import type { VercelRequest, VercelResponse } from "@vercel/node";
import { UAParser } from "ua-parser-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, category, message, githubUsername, githubName, url, version } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Pesan laporan wajib diisi." });
    }

    // Determine Display Name
    let displayName = "Anonymous";
    if (name && name.trim() !== "") {
      displayName = name.trim();
    } else if (githubName && githubName.trim() !== "") {
      displayName = githubName.trim();
    } else if (githubUsername && githubUsername.trim() !== "") {
      displayName = githubUsername.trim();
    }

    const gitUsername = githubUsername || "";

    // Resolve IP Address
    const rawIp = (req.headers["x-forwarded-for"] as string) || req.socket?.remoteAddress || "Unknown";
    const ip = rawIp.split(",")[0].trim();

    // Resolve Device & Browser Info from User-Agent
    const userAgent = (req.headers["user-agent"] as string) || "";
    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();

    const osName = uaResult.os.name || "";
    const osVer = uaResult.os.version || "";
    const browserName = uaResult.browser.name || "";
    const browserVer = uaResult.browser.version || "";
    const devVendor = uaResult.device.vendor || "";
    const devModel = uaResult.device.model || "";

    let deviceInfo = "";
    if (devVendor || devModel) {
      deviceInfo += `${devVendor} ${devModel} `.trim();
    } else {
      deviceInfo += "Desktop ";
    }

    const osPart = `${osName} ${osVer}`.trim();
    const browserPart = `${browserName} ${browserVer}`.trim();

    if (osPart) deviceInfo += `(${osPart})`;
    if (browserPart) deviceInfo += ` via ${browserPart}`;
    deviceInfo = deviceInfo.trim() || "Unknown Device";

    // Resolve Timestamp (WIB)
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000;
    const wibTime = new Date(now.getTime() + wibOffset);
    const wibFormatted = wibTime.toISOString().replace("T", " ").substring(0, 19) + " WIB";

    const escapeHtml = (unsafe: string): string => {
      if (!unsafe) return "";
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    };

    const telegramMessage = `<b>📩 ZIP2GIT REPORT</b>

<b>👤 Nama</b>
${escapeHtml(displayName)}

<b>🐙 GitHub</b>
${gitUsername ? `@${escapeHtml(gitUsername)}` : "<i>Belum Login / Anonim</i>"}

<b>🏷️ Kategori</b>
${escapeHtml(category || "General")}

<b>🌍 IP</b>
<code>${escapeHtml(ip)}</code>

<b>📱 Device</b>
${escapeHtml(deviceInfo)}

<b>🕒 Waktu</b>
${escapeHtml(wibFormatted)}

<b>📄 Halaman</b>
<code>${escapeHtml(url || "/")}</code>
${version ? `\n<b>🔖 Versi</b>\n<code>${escapeHtml(version)}</code>\n` : ""}
<b>📝 Pesan</b>
<pre>${escapeHtml(message)}</pre>`;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.warn("Telegram configuration is incomplete. TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing.");
      return res.status(200).json({
        success: true,
        message: "Laporan diterima (Peringatan: Bot Telegram belum dikonfigurasi).",
        mockLogged: true,
        formattedMessage: telegramMessage
      });
    }

    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: telegramMessage,
        parse_mode: "HTML"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send message to Telegram:", errorText);
      return res.status(502).json({ error: "Gagal mengirimkan laporan ke Telegram." });
    }

    return res.status(200).json({
      success: true,
      message: "Laporan berhasil dikirimkan ke Telegram!"
    });
  } catch (err: any) {
    console.error("Error handling report submission:", err);
    return res.status(500).json({ error: "Terjadi kesalahan internal server." });
  }
}
