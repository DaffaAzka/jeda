# Jeda

Platform persiapan UTBK dengan dukungan wellbeing, dibangun menggunakan Next.js,
PostgreSQL, Prisma, dan Better Auth.

## Menyiapkan database dan autentikasi

1. Siapkan PostgreSQL, lalu salin `.env.example` menjadi `.env` dan sesuaikan
   `DATABASE_URL`.
2. Isi `BETTER_AUTH_SECRET` dengan secret acak minimal 32 karakter dan
   `BETTER_AUTH_URL` dengan URL aplikasi (misalnya `http://localhost:3000`).
3. Generate Prisma Client dan terapkan migrasi:

```bash
npm run db:generate
npm run db:migrate
```

Skema lengkap Jeda dan tabel Better Auth ada di `prisma/schema.prisma`.
Kredensial email/password Better Auth tersimpan sebagai hash di
`accounts.password`; aplikasi tidak menyimpan password plaintext maupun kolom
hash duplikat.

Endpoint Better Auth tersedia di `/api/auth/[...all]`. Jalankan aplikasi lokal
dengan `npm run dev`.
