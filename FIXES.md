# Zip2Git — Catatan Perbaikan (Production Deploy Fix)

## Masalah Utama
Form FAQ/Report (`/tentang`) bekerja normal di `npm run dev`, tapi error di production
(Vercel) karena `server.ts` (Express) **tidak pernah dijalankan oleh Vercel**. Vercel
hanya mengenali:
1. File statis hasil `vite build` di `dist/`
2. Serverless Functions di folder `/api/*.ts`

Akibatnya, request ke `/api/report` di-rewrite balik ke `index.html` oleh
`vercel.json`, sehingga frontend menerima HTML alih-alih JSON → error.

## Perubahan yang Dilakukan

### 1. `api/report.ts` (BARU)
Logic dari `server.ts` (endpoint `/api/report`) dipindahkan/di-porting menjadi
Vercel Serverless Function yang valid, lengkap dengan:
- Validasi pesan wajib diisi
- Resolusi nama pengirim, IP, User-Agent (device/browser info)
- Format pesan Telegram (HTML-escaped)
- Fallback mock response jika `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` belum di-set

### 2. `vercel.json`
Rewrite rule diubah dari `/(.*)` menjadi `/((?!api/).*)` agar path yang diawali
`api/` **tidak** di-redirect ke `index.html`, sehingga serverless function bisa
diakses dengan benar.

### 3. `package.json`
- Ditambahkan script `vercel-build` (`vite build` saja) — Vercel otomatis
  memakai script ini jika tersedia, jadi tidak perlu lagi bundling `server.ts`
  yang toh tidak akan dieksekusi Vercel.
- Ditambahkan `@vercel/node` sebagai devDependency untuk tipe `VercelRequest`/`VercelResponse`.
- Script `build`/`start`/`dev` lama tetap dipertahankan untuk keperluan development
  lokal atau self-hosting non-Vercel (mis. Docker/VPS).

### 4. `.env.example`
Dibersihkan dari variabel template AI Studio yang tidak lagi relevan
(`GEMINI_API_KEY`, `APP_URL`), hanya menyisakan `TELEGRAM_BOT_TOKEN` dan
`TELEGRAM_CHAT_ID` yang benar-benar dipakai project ini.

### 5. `.vercelignore` (BARU)
Mengecualikan `server.ts`, folder `assets/` (sisa metadata AI Studio), dan file
konfigurasi non-esensial dari proses deploy Vercel.

## Yang Perlu Kamu Lakukan Setelah Extract Zip Ini

1. **Install dependency baru:**
   ```bash
   npm install
   ```

2. **Pastikan environment variable sudah di-set di Vercel Dashboard:**
   - Project Settings → Environment Variables
   - Tambahkan `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID`
   - **PENTING:** centang environment **Production** (bukan cuma Preview/Development)

3. **Commit & push, lalu redeploy di Vercel.**

4. **Test:** buka `/#/tentang`, isi form laporan, klik "Kirim Laporan" — seharusnya
   sudah berhasil terkirim ke Telegram (atau menampilkan mock preview jika env
   var belum di-set).

## Catatan Tambahan (Non-blocking, FYI saja)
- `src/pages/About.tsx` memakai `dangerouslySetInnerHTML` untuk menampilkan
  preview pesan Telegram — aman karena server-side sudah melakukan HTML-escaping
  di `api/report.ts`, tapi tetap perlu diperhatikan jika ada perubahan format pesan.
- Beberapa `<a target="_blank">` menggunakan `referrerPolicy="no-referrer"` tanpa
  `rel="noopener noreferrer"` — tidak menyebabkan bug, tapi best practice untuk
  keamanan tab baru.
