# Setup Login with GitHub OAuth

Fitur "Masuk dengan GitHub" sudah terpasang. Ikuti langkah ini agar berfungsi
di Vercel (production) dan lokal (dev).

## 1. Buat GitHub OAuth App

Buka https://github.com/settings/developers → **New OAuth App**.

**Untuk Production (Vercel):**
- Application name: `Zip2Git` (bebas)
- Homepage URL: `https://<domain-vercel-anda>.vercel.app`
- Authorization callback URL: `https://<domain-vercel-anda>.vercel.app/auth/callback`

Setelah dibuat, copy **Client ID**, lalu klik **Generate a new client secret** dan copy juga.

> GitHub hanya mengizinkan SATU callback URL per OAuth App. Untuk dev lokal,
> buat OAuth App KEDUA yang terpisah (lihat langkah 3) — jangan pakai App yang
> sama untuk production dan lokal.

## 2. Set Environment Variables di Vercel

Project Settings → Environment Variables → tambahkan (untuk environment **Production** dan **Preview**):

| Key | Value |
|---|---|
| `VITE_GITHUB_CLIENT_ID` | Client ID dari langkah 1 |
| `GITHUB_CLIENT_ID` | Client ID yang sama |
| `GITHUB_CLIENT_SECRET` | Client Secret dari langkah 1 |

`VITE_GITHUB_CLIENT_ID` dipakai di browser (aman, Client ID memang publik).
`GITHUB_CLIENT_SECRET` HANYA dipakai di `api/auth/github.ts` (serverless, tidak pernah dikirim ke browser).

Redeploy setelah menambahkan env vars (Vercel tidak otomatis rebuild untuk env var baru pada deployment yang sudah ada).

## 3. Setup untuk Dev Lokal (opsional)

Buat OAuth App kedua di GitHub khusus untuk lokal:
- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/auth/callback`

Lalu buat file `.env` di root project (jangan commit, sudah ada di `.gitignore`):

```
VITE_GITHUB_CLIENT_ID=<client id lokal>
GITHUB_CLIENT_ID=<client id lokal>
GITHUB_CLIENT_SECRET=<client secret lokal>
```

Jalankan seperti biasa: `npm run dev`.

## Cara Kerja Singkat

1. User klik "Masuk dengan GitHub" → redirect ke `github.com/login/oauth/authorize`.
2. GitHub redirect balik ke `/auth/callback?code=...&state=...`.
3. Karena app pakai `HashRouter`, script kecil di `index.html` mengubah URL
   itu menjadi `/#/auth/callback?code=...` sebelum React mount.
4. Halaman `AuthCallback.tsx` memverifikasi `state` (proteksi CSRF), lalu
   mengirim `code` ke `POST /api/auth/github`.
5. Serverless function menukar `code` → `access_token` ke GitHub API
   menggunakan `client_secret` (server-side only), lalu mengembalikan
   `access_token` ke browser.
6. Token disimpan di `localStorage` (bukan `sessionStorage`) sehingga sesi
   bertahan walau tab/browser ditutup — user tidak perlu login ulang setiap
   buka web, sampai eksplisit logout.

## Login dengan Personal Access Token (PAT) masih tersedia

PAT login tidak dihapus — sekarang jadi opsi sekunder ("Masuk dengan Personal
Access Token") yang bisa di-expand di halaman `/login`, sebagai fallback bila
OAuth belum dikonfigurasi atau user memilih PAT.
