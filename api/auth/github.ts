import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Exchanges a GitHub OAuth "code" for an access_token.
 * The client_secret NEVER touches the browser — it only lives here, server-side.
 *
 * POST /api/auth/github
 * body: { code: string }
 * -> { access_token: string }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { code } = req.body ?? {};

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Parameter 'code' wajib disertakan." });
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is not configured.");
      return res.status(500).json({
        error: "Konfigurasi OAuth GitHub belum lengkap di server (env var hilang).",
      });
    }

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text().catch(() => "");
      console.error("GitHub token exchange failed:", tokenRes.status, text);
      return res.status(502).json({ error: "Gagal bertukar kode otorisasi dengan GitHub." });
    }

    const data = await tokenRes.json();

    if (data.error) {
      // e.g. bad_verification_code, incorrect_client_credentials, redirect_uri_mismatch
      console.error("GitHub OAuth error payload:", data);
      return res.status(400).json({
        error: data.error_description || data.error || "GitHub menolak permintaan otorisasi.",
      });
    }

    if (!data.access_token) {
      return res.status(502).json({ error: "GitHub tidak mengembalikan access token." });
    }

    return res.status(200).json({ access_token: data.access_token });
  } catch (err: any) {
    console.error("Error handling GitHub OAuth exchange:", err);
    return res.status(500).json({ error: "Terjadi kesalahan internal server." });
  }
}
