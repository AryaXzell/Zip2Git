import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { UAParser } from "ua-parser-js";

// Simple in-memory rate limiter to stop basic spam/abuse.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // max 5 reports per IP per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }
  entry.count += 1;
  return false;
}

const MAX_LENGTHS = {
  name: 100,
  category: 50,
  message: 2000,
  githubUsername: 100,
  githubName: 100,
  url: 500,
  version: 50,
};

function sanitizeString(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies (with a size limit to prevent abuse)
  app.use(express.json({ limit: "100kb" }));

  // API Route for Support/FAQ Report
  app.post("/api/report", async (req, res) => {
    try {
      const rawIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "Unknown";
      // x-forwarded-for can be a list of IPs, take the first one
      const ip = rawIp.split(",")[0].trim();

      if (isRateLimited(ip)) {
        return res.status(429).json({ error: "Terlalu banyak laporan dikirim. Coba lagi dalam beberapa saat." });
      }

      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ error: "Isi permintaan tidak valid." });
      }

      const name = sanitizeString(req.body.name, MAX_LENGTHS.name);
      const category = sanitizeString(req.body.category, MAX_LENGTHS.category);
      const message = sanitizeString(req.body.message, MAX_LENGTHS.message);
      const githubUsername = sanitizeString(req.body.githubUsername, MAX_LENGTHS.githubUsername);
      const githubName = sanitizeString(req.body.githubName, MAX_LENGTHS.githubName);
      const url = sanitizeString(req.body.url, MAX_LENGTHS.url);
      const version = sanitizeString(req.body.version, MAX_LENGTHS.version);

      if (!message) {
        return res.status(400).json({ error: "Pesan laporan wajib diisi." });
      }

      // Determine Display Name
      let displayName = "Anonymous";
      if (name) {
        displayName = name;
      } else if (githubName) {
        displayName = githubName;
      } else if (githubUsername) {
        displayName = githubUsername;
      }

      const gitUsername = githubUsername;

      // Resolve Device & Browser Info from User-Agent
      const userAgent = req.headers["user-agent"] || "";
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
      // Add 7 hours for WIB (UTC+7)
      const wibOffset = 7 * 60 * 60 * 1000;
      const wibTime = new Date(now.getTime() + wibOffset);
      const wibFormatted = wibTime.toISOString().replace("T", " ").substring(0, 19) + " WIB";

      const escapeHtml = (unsafe: string): string => {
        if (!unsafe) return "";
        return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      };

      // Format beautiful Telegram Message (HTML mode is robust against parse crashes)
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

      // Get Telegram tokens from environment variables
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
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
