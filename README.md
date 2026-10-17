# MOODI (Jeda)

Platform persiapan UTBK terintegrasi dengan dukungan adaptif *wellbeing*, dibangun menggunakan Next.js 16 (App Router), PostgreSQL, Prisma v7, Better Auth v1, Lexical Editor, dan Google Gemini API (khusus pembuatan draf admin).

MOODI mendukung pencapaian **SDG 3** (Target 3.4: Kesehatan Mental & Kesejahteraan) dan **SDG 4** (Target 4.3 & 4.5: Akses Pendidikan Tinggi yang Setara).

---

## 🌟 Fitur Utama

1. **Beranda & Rencana Adaptif Harian:**
   - Check-in kondisi 30 detik (tidur, energi, suasana hati, stres).
   - Mesin aturan (*rule engine*) transparan yang menentukan mode harian (`recovery`, `balanced`, `challenge`) beserta kalimat penjelasan "kenapa" yang dapat dipertanggungjawabkan.
2. **Modul Belajar (Materi & Cek Pemahaman):**
   - Struktur kurikulum UTBK: Subtes → Topik → Materi (*Lesson*).
   - Pembaca materi ringan berbasis Server Component dengan rendering rumus matematika LaTeX via KaTeX (`trust: false`).
   - Latihan interaktif "Cek Pemahaman" (3-5 soal) dengan umpan balik langsung tanpa tekanan nilai atau perankingan.
   - **Pemisahan tegas:** Modul Belajar tidak pernah membuat `TryoutSession`, sehingga progres belajar murni tidak mengontaminasi peta penguasaan (*mastery map*) tryout.
3. **Tryout & Graded Exposure:**
   - Tiga tingkat paparan: Santai (*relaxed*), Latihan Waktu (*timed*), dan Simulasi Penuh (*full simulation*).
   - Tombol darurat relaksasi **"Napas dulu"** yang selalu dapat diakses.
   - Tab latihan mandiri per topik.
4. **Error Autopsy:**
   - Identifikasi penyebab salah di setiap tryout (*did not know*, *out of time*, *panic*, *careless*) dengan saran otomatis sistem dan konfirmasi siswa.
5. **Dashboard Insight:**
   - Korelasi mingguan antara pola tidur/stres dengan akurasi pengerjaan.
   - Peta penguasaan topik (*mastery map*) dan distribusi kesalahan.
6. **Ruang Tenang (Calm Room):**
   - Animasi pernapasan kotak 4-4-4-4 (*box breathing*), daftar periksa *grounding* 5-4-3-2-1, dan jurnal refleksi pribadi.
   - Reframing kognitif ("Pikiran vs Fakta") dihitung **100% secara lokal** di sisi klien/server tanpa mengirim pemikiran siswa ke LLM.
7. **Authoring Draf Berbasis AI untuk Admin:**
   - Pembuatan draf materi dan soal baru berbantukan Google Gemini SDK (`@google/genai`) dengan *read-only tool calling* (`get_topic_context`, `list_existing_question_stems`, `get_format_rules`).
   - Output terstruktur yang divalidasi ketat oleh Zod dan dikonversi ke AST Lexical.
   - **Prinsip Human-in-the-Loop:** Semua konten AI selalu berstatus draf (`isPublished: false`) dan wajib ditinjau serta diverifikasi oleh admin sebelum diterbitkan.
8. **Editor Rich Text Lexical:**
   - Editor modern untuk admin dengan dukungan heading, list, quote, code block, tabel, collapsible hint, persamaan LaTeX, dan shortcut markdown.

---

## 🔒 Privasi & Keamanan Data Siswa

- **Zero Student Data to LLM:** Data check-in, catatan jurnal, sesi ruang tenang, dan jawaban tryout siswa **TIDAK PERNAH** dikirim ke model AI eksternal mana pun.
- **Persetujuan Eksplisit (*Consent-gated*):** Data sensitif *wellbeing* hanya disimpan jika siswa memberikan persetujuan saat onboarding.
- **Bukan Pengganti Medis:** Hasil check-in tidak memuat label klinis atau diagnosis.

---

## 🚀 Memulai Aplikasi Secara Lokal

### 1. Konfigurasi Lingkungan (.env)
Salin `.env.example` ke `.env` dan sesuaikan nilainya:
```bash
cp .env.example .env
```

Pastikan variabel berikut terisi:
- `DATABASE_URL`: URL PostgreSQL (Neon / Supabase / lokal).
- `BETTER_AUTH_SECRET`: String rahasia minimal 32 karakter.
- `BETTER_AUTH_URL`: URL aplikasi (misal `http://localhost:3000`).
- `GEMINI_API_KEY` & `GEMINI_MODEL`: Kunci API Google AI Studio (opsional untuk admin authoring).
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_DEMO_PASSWORD`: Kredensial akun demo.

### 2. Migrasi Database & Seeding
```bash
# Generate Prisma Client
npm run db:generate

# Jalankan migrasi schema
npm run db:migrate

# Jalankan seeder idempoten (membuat akun admin, akun demo, kurikulum UTBK, 42 soal, materi, dan riwayat 14 hari)
npm run db:seed
```

### 3. Reset & Refresh Data Demo
Jika ingin mengembalikan akun siswa demo ke kondisi awal tanpa menghapus bank soal dan materi:
```bash
npm run db:refresh
```

### 4. Menjalankan Server Pengembangan & Pengujian
```bash
# Jalankan dev server
npm run dev

# Jalankan rangkaian tes unit
npm run test
```

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
