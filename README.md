# Jeda

Platform persiapan UTBK dengan dukungan wellbeing, dibangun menggunakan Next.js, PostgreSQL, Prisma, dan Better Auth.

## Menyiapkan database dan autentikasi

1. Siapkan PostgreSQL, lalu salin `.env.example` menjadi `.env` dan sesuaikan `DATABASE_URL`.
2. Isi `BETTER_AUTH_SECRET` dengan secret acak minimal 32 karakter dan `BETTER_AUTH_URL` dengan URL aplikasi (misalnya `http://localhost:3000`).
3. Generate Prisma Client dan terapkan migrasi:

```bash
npm run db:generate
npm run db:migrate
```

Skema lengkap Jeda dan tabel Better Auth ada di `prisma/schema.prisma`.
Kredensial email/password Better Auth tersimpan sebagai hash di `accounts.password`; aplikasi tidak menyimpan password plaintext maupun kolom hash duplikat.

Endpoint Better Auth tersedia di `/api/auth/[...all]`. Jalankan aplikasi lokal dengan `npm run dev`.

---

# 🛡️ Panduan Keamanan & Mitigasi Traffic Spikes (Anti-Bot & Brute Force)

Dokumen ini berisi panduan dan implementasi keamanan untuk melindungi aplikasi ini dari serangan *brute force*, *botnet massive*, dan lonjakan trafik (*traffic spikes*) yang tidak wajar. Mengingat aplikasi ini di-hosting di **Vercel**, mitigasi ini sangat penting untuk mencegah *downtime* dan tagihan server yang membengkak (*billing shock*).

---

## 1. Perlindungan Tingkat Infrastruktur (Vercel)

Langkah pertama adalah mengamankan dari panel Vercel langsung sebelum trafik menyentuh kode Next.js kita.

- [ ] **Aktifkan Vercel Spend Limits (SANGAT PENTING):**
  - Masuk ke Vercel Dashboard > **Settings** > **Billing** > **Spend Management**.
  - Atur limit pengeluaran (misal: $50 atau $100).
  - Pilih aksi **"Pause my projects"** atau setidaknya **"Send a webhook/email"** jika limit tercapai. Ini adalah sabuk pengaman utama agar tagihan tidak meledak saat terkena DDoS.
- [ ] **Gunakan Vercel WAF (Web Application Firewall):**
  - Vercel memiliki fitur WAF bawaan. Jika terjadi serangan, segera aktifkan **Attack Challenge Mode** di tab *Security*. Ini akan memaksa pengunjung melewati semacam *captcha* otomatis sebelum masuk ke situs.
  - Blokir IP atau negara tertentu jika trafik anomali berasal dari region spesifik.
- [ ] **Gunakan Cloudflare Proxy (Opsional & Sangat Direkomendasikan):**
  - Arahkan domain melalui Cloudflare (DNS + Proxy CDN) di depan Vercel. Fitur gratis Cloudflare seperti *Bot Fight Mode*, *Under Attack Mode*, dan caching statis akan menyaring bot sebelum sampai ke kuota bandwidth Vercel.

---

## 2. Perlindungan Tingkat Aplikasi (Next.js Proxy & Rate Limiting)

Aplikasi ini mengimplementasikan **Rate Limiting** di Edge/Network boundary via [`proxy.ts`](file:///c:/Projects/mental-lms/proxy.ts) (standar Next.js 16) yang didukung oleh modul [`lib/rate-limit.ts`](file:///c:/Projects/mental-lms/lib/rate-limit.ts).

### Konfigurasi Rate Limiting:
- **Tingkat Ketat (Auth & Rute Rawan):** Dibatasi **5 request per 60 detik** untuk `/api/auth/:path*`, `/login`, dan `/register` guna mencegah *credential stuffing* dan *brute force*.
- **Tingkat Standar (API Umum):** Dibatasi **30 request per 10 detik** untuk endpoint `/api/:path*`.
- **Dukungan Upstash Redis & Fallback:**
  - Jika `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` diset, aplikasi menggunakan Redis sliding window terdistribusi.
  - Jika belum diset (misalnya di lingkungan lokal/dev), aplikasi otomatis beralih (*graceful fallback*) ke in-memory sliding window tanpa error.

Contoh konfigurasi di `.env`:
```env
UPSTASH_REDIS_REST_URL="https://your-upstash-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

---

## 3. Perlindungan Autentikasi & Formulir (Anti Brute-Force & Bot)

Halaman login dan registrasi adalah target utama *brute force* dan *credential stuffing*. Aplikasi dilengkapi dengan:

1. **Rate Limiting Internal Better Auth:**
   - Dikonfigurasi langsung pada [`lib/auth.ts`](file:///c:/Projects/mental-lms/lib/auth.ts) dengan aturan ketat untuk `/sign-in/email`, `/sign-up/email`, dan `/change-password`.
2. **Cloudflare Turnstile Widget:**
   - Komponen [`components/turnstile.tsx`](file:///c:/Projects/mental-lms/components/turnstile.tsx) terintegrasi pada formulir masuk dan daftar ([`components/auth-form.tsx`](file:///c:/Projects/mental-lms/components/auth-form.tsx)).
   - Token dikirimkan melalui header `x-captcha-response` dan divalidasi oleh plugin captcha Better Auth di server jika `CLOUDFLARE_TURNSTILE_SECRET_KEY` diaktifkan:
   ```env
   CLOUDFLARE_TURNSTILE_SECRET_KEY="0x4AAAAAA..."
   NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY="0x4AAAAAA..."
   ```

---

## 4. Caching Strategis & Security Headers

Untuk meringankan beban komputasi server saat terjadi lonjakan trafik:

- **Security Headers Terpasang di [`next.config.ts`](file:///c:/Projects/mental-lms/next.config.ts):**
  - `Strict-Transport-Security` (HSTS)
  - `X-Frame-Options: DENY` (Anti Clickjacking)
  - `X-Content-Type-Options: nosniff` (Anti MIME Sniffing)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Static Optimization:**
  - Halaman publik utama seperti landing page (`/`) bersifat statis dan langsung dilayani dari CDN Edge tanpa mengeksekusi komputasi database.

---

## 5. Monitoring & Alerting

- [ ] Gunakan **Vercel Analytics** & **Vercel Logs** untuk memantau lonjakan P99 latency atau respons HTTP 429 / 5xx.
- [ ] Aktifkan notifikasi Webhook atau integrasikan **Axiom** / **Datadog** (via Vercel Integrations) untuk menerima *alert* di Discord, Slack, atau Email saat terjadi anomali lonjakan trafik lebih dari 500% dalam 5 menit.
