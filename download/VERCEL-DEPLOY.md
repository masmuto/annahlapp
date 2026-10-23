# Deployment ke Vercel — GO An Nahl

Panduan lengkap deploy aplikasi **GO An Nahl** ke Vercel dengan backend Supabase PostgreSQL.

## Prasyarat

- ✅ Akun Vercel (https://vercel.com) — gratis untuk Hobby tier
- ✅ Akun GitHub/GitLab/Bitbucket (untuk connect repo)
- ✅ Project Supabase sudah dibuat + SQL schema sudah di-run
- ✅ Database password Supabase diketahui

## Langkah 1: Setup Database Supabase (Jika belum)

Jika belum run SQL schema di Supabase:

1. Buka **Supabase Dashboard** → **SQL Editor** → **New query**
2. Copy isi file `download/supabase-schema.sql` → paste → **Run**
3. Catat **Database Password** dari Project Settings → Database

## Langkah 2: Dapatkan Connection String PostgreSQL

1. Supabase Dashboard → **Project Settings** → **Database**
2. Scroll ke **Connection string** → pilih **Connection pooling** → mode **Transaction**
3. Copy connection string (format):
   ```
   postgresql://postgres.obxqnotzsqxllddegsum:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
4. Ganti `[YOUR-PASSWORD]` dengan database password asli
5. Catat juga **Direct connection** (untuk prisma migrate):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.obxqnotzsqxllddegsum.supabase.co:5432/postgres
   ```

## Langkah 3: Push Prisma Schema ke Supabase

Jalankan di lokal untuk membuat semua tabel di Supabase PostgreSQL:

```bash
# Set DATABASE_URL dan DIRECT_URL di .env.local dulu (lihat Langkah 2)
# Lalu jalankan:
bun run db:push
```

Atau jika ingin pakai Supabase SQL schema yang sudah disediakan (alternatif):
- Skip `bun run db:push` di atas
- Cukup run `supabase-schema.sql` di Supabase SQL Editor

> **Catatan**: Prisma schema dan `supabase-schema.sql` menggunakan struktur tabel yang sama. Pilih salah satu untuk inisialisasi.

## Langkah 4: Setup Project di Vercel

### Opsi A: Deploy via GitHub (Rekomendasi)

1. Push code ke GitHub repo (bisa private)
2. Buka https://vercel.com → **Login** → **Add New** → **Project**
3. Import repository Anda
4. Vercel auto-detect Next.js framework
5. **Settings**:
   - **Framework Preset**: Next.js
   - **Build Command**: `bun run build` (atau default `next build`)
   - **Install Command**: `bun install` (atau `npm install`)
   - **Output Directory**: `.next` (default)
6. **Environment Variables** — klik **Add** dan isi semua var berikut:

| Variable | Value | Sensitive? |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.obxqnotzsqxllddegsum:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` | ✅ Yes |
| `DIRECT_URL` | `postgresql://postgres:[PASSWORD]@db.obxqnotzsqxllddegsum.supabase.co:5432/postgres` | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://obxqnotzsqxllddegsum.supabase.co` | No |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_S4wWWeHnYGenAzgEWBM7Hg_8rz29ZSl` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxxx...` (dari Supabase Dashboard → API → service_role) | ✅ Yes |

> **Catatan**: Hanya 5 env vars. Tidak perlu `PRISMA_SCHEMA` lagi — schema sekarang single-mode PostgreSQL.

7. Centang semua environment: **Production**, **Preview**, **Development**
8. Klik **Deploy** — tunggu 2-3 menit

### Opsi B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Dari root project:
vercel

# Ikuti prompt:
# - Set up and deploy? Y
# - Which scope? (pilih akun)
# - Link to existing project? N
# - Project name: go-an-nahl
# - Directory: ./
# - Override settings? N

# Set env vars:
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Deploy ke production:
vercel --prod
```

## Langkah 5: Verifikasi Deployment

1. Buka URL Vercel (e.g., `https://go-an-nahl.vercel.app`)
2. Login dengan `admin / admin123`
3. Cek apakah data muncul di Dashboard (jika kosong, run seed via `/api/seed?force=true`)

### Test endpoint koneksi Supabase:
```
https://[your-app].vercel.app/api/supabase-test
```

Seharusnya return:
```json
{
  "configured": true,
  "connected": true,
  "counts": { "users": 3, "santri": 0, ... }
}
```

## Langkah 6: Seed Data (Jika Database Kosong)

```bash
# Pakai curl ke URL Vercel production:
curl -X POST "https://[your-app].vercel.app/api/seed?force=true"
```

Atau buka di browser:
```
https://[your-app].vercel.app/api/seed?force=true
```
(pakai method POST, bisa pakai Postman atau curl)

## Konfigurasi Vercel

### File `vercel.json`

Sudah dibuat di root project:
```json
{
  "framework": "nextjs",
  "buildCommand": "bun run build",
  "installCommand": "bun install",
  "regions": ["sin1"]
}
```

- **Region**: `sin1` (Singapore — paling dekat dengan Indonesia)
- Untuk region lain: `hnd1` (Tokyo), `bom1` (Mumbai), `fra1` (Frankfurt), `iad1` (Washington DC)

### Build Process

Vercel akan otomatis:
1. Run `bun install` (atau `npm install`)
2. Run `postinstall` script → `prisma generate` (generate Prisma Client)
3. Run `bun run build` → `prisma generate && next build`
4. Deploy ke edge network

## Custom Domain (Opsional)

1. Vercel Dashboard → Project → **Settings** → **Domains**
2. Add domain: `tahfidzannahl.sch.id` (atau subdomain `app.tahfidzannahl.sch.id`)
3. Tambah DNS record di domain provider:
   - Type: `CNAME`
   - Name: `app` (atau `@`)
   - Value: `cname.vercel-dns.com`
4. Tunggu propagation DNS (5-30 menit)
5. Vercel auto-issue SSL certificate

## Automatic Deploys

Setelah setup pertama:
- **Push ke `main` branch** → auto-deploy ke **Production**
- **Pull Request** → auto-deploy ke **Preview** environment
- Setiap deploy dapat URL unik (e.g., `go-an-nahl-pr-123.vercel.app`)

## Monitoring & Logs

1. Vercel Dashboard → Project → **Deployments**
2. Klik deployment terbaru → lihat **Build Logs**
3. Tab **Runtime Logs** — lihat console.log/error saat app running
4. Tab **Analytics** — monitor performance & traffic (Pro tier)

## Troubleshooting

### Error: `Environment variable not found: DATABASE_URL` + `provider = "sqlite"`
**Penyebab**: Vercel masih pakai source code LAMA (yang punya dual schema SQLite/PostgreSQL). Prisma fallback ke schema.prisma (SQLite) dan butuh DATABASE_URL SQLite (`file:...`), tapi di env hanya ada PostgreSQL URL.
**Solusi**:
1. **Re-download source ZIP terbaru**: `http://localhost:3000/go-an-nahl-source.zip` (atau dari Vercel production yang sudah updated)
2. **Hapus Vercel project lama** (atau push source baru ke GitHub yang sama)
3. **Create new Vercel project** dari source ZIP/repo baru
4. Set 5 env vars (TANPA `PRISMA_SCHEMA` — tidak perlu lagi)
5. Deploy ulang
6. Hapus env var `PRISMA_SCHEMA` jika ada di project lama

### Error: `PrismaClientInitializationError: Can't reach database server`
**Penyebab**: Connection string salah atau database password tidak benar.
**Solusi**:
- Cek format `DATABASE_URL` — pastikan pakai port **6543** (pooled)
- Cek password tidak ada karakter khusus yang perlu di-encode (e.g., `@` → `%40`)
- Test connection dari lokal dengan `bun run db:push`

### Error: `Environment variable "DATABASE_URL" could not be found` (di Vercel)
**Penyebab**: Env var belum di-set di Vercel Dashboard.
**Solusi**:
- Vercel Dashboard → Project → Settings → Environment Variables
- Tambah `DATABASE_URL` dengan value connection string PostgreSQL
- **Redeploy** (Deployments → ... → Redeploy)
- Pastikan env var di-set untuk semua environment (Production, Preview, Development)

### Error: `prisma generate` failed during build
**Penyebab**: `postinstall` script tidak jalan atau Prisma client corrupt.
**Solusi**:
- Pastikan `package.json` ada `"postinstall": "prisma generate"`
- Hapus `node_modules` dan lockfile, rebuild:
  ```bash
  rm -rf node_modules bun.lock
  bun install
  ```

### Build berhasil tapi app blank/error 500
**Penyebab**: Biasanya env var tidak terbaca atau RLS block query.
**Solusi**:
- Cek Runtime Logs di Vercel
- Test endpoint `/api/supabase-test` untuk diagnose
- Pastikan `SUPABASE_SERVICE_ROLE_KEY` sudah di-set (untuk bypass RLS di server)

### Database connection limit
Supabase Free tier: 200 koneksi concurrent.
**Tips**: Vercel serverless dapat spin up banyak instances. Gunakan **connection pooling** (port 6543) supaya 1 koneksi dipakai bersama.

### Cold start lambat
Vercel Hobby: cold start ~1-3 detik.
**Solusi**: Upgrade ke **Pro tier** ($20/bln) untuk reduced cold start + always-on functions.

## Backup & Restore

### Backup otomatis
- **Supabase Free**: backup harian, retention 7 hari
- **Supabase Pro**: PITR (Point-in-Time Recovery), retention 30 hari

### Manual backup via aplikasi
Buka **Pengaturan → Database → Backup** → download JSON file.

### Restore
Buka **Pengaturan → Database → Restore** → upload JSON file backup.

## Cost Estimation

| Service | Free Tier | Pro Tier |
|---|---|---|
| **Vercel** | 100GB bandwidth, 100GB-hrs serverless | $20/bln — 1TB bandwidth, always-on |
| **Supabase** | 500MB DB, 50K MAU, 2GB bandwidth | $25/bln — 8GB DB, 100K MAU, 250GB bandwidth |
| **Total Free** | **$0** | — |
| **Total Pro** | — | **$45/bln** |

Untuk skala kecil (santri < 200, user < 50), **Free tier cukup**.

## Quick Checklist Sebelum Deploy

- [ ] SQL schema sudah di-run di Supabase SQL Editor
- [ ] `bun run db:push` sukses di lokal (atau tabel sudah ada di Supabase)
- [ ] Code sudah di-push ke GitHub
- [ ] Semua env vars di-set di Vercel Dashboard:
  - [ ] `DATABASE_URL` (PostgreSQL connection string)
  - [ ] `DIRECT_URL` (direct connection)
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Build sukses di Vercel
- [ ] Login dengan `admin / admin123` berhasil
- [ ] Data muncul di Dashboard

## Useful Commands

```bash
# Test build lokal sebelum push
bun run build

# Run linter
bun run lint

# Push schema ke Supabase
bun run db:push

# Generate Prisma client
bun run db:generate

# Test koneksi Supabase lokal
curl http://localhost:3000/api/supabase-test

# Test koneksi di Vercel
curl https://[your-app].vercel.app/api/supabase-test
```

## Support

Jika ada masalah deployment:
1. Cek **Build Logs** di Vercel Dashboard
2. Cek **Runtime Logs** untuk error setelah deploy
3. Test endpoint `/api/supabase-test` untuk diagnose koneksi
4. Pastikan semua env vars sudah benar (tidak ada typo, password benar)

Setup yang baik → deploy seharusnya selesai dalam **5 menit**. 🚀
