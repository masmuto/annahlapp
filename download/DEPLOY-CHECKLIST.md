# Quick Deploy Checklist — Vercel

## Persiapan (5 menit)

### 1. Setup Database Supabase
1. Buka Supabase Dashboard → **SQL Editor** → **New Query**
2. Copy-paste isi `download/supabase-schema.sql` → **Run**
3. Catat database password dari **Project Settings → Database**

### 2. Dapatkan Connection String PostgreSQL
```
Dari Supabase Dashboard → Project Settings → Database → Connection string
Pilih "Connection pooling" → "Transaction" mode (port 6543)

DATABASE_URL=postgresql://postgres.obxqnotzsqxllddegsum:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.obxqnotzsqxllddegsum.supabase.co:5432/postgres
```

### 3. Dapatkan Service Role Key
```
Dari Supabase Dashboard → Project Settings → API → service_role secret
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

## Deploy ke Vercel (3 menit)

### Via Dashboard
1. Push code ke GitHub
2. https://vercel.com → **Add New** → **Project** → Import repo
3. Tambah **Environment Variables** (5 var — TANPA PRISMA_SCHEMA, tidak perlu lagi!):

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://postgres.obxqnotzsqxllddegsum:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` |
| `DIRECT_URL` | `postgresql://postgres:[PASSWORD]@db.obxqnotzsqxllddegsum.supabase.co:5432/postgres` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://obxqnotzsqxllddegsum.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_S4wWWeHnYGenAzgEWBM7Hg_8rz29ZSl` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxxx...` |

4. Klik **Deploy** → tunggu 2-3 menit

### Via CLI
```bash
npm i -g vercel
vercel login
vercel

# Set env vars (5 var)
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Deploy ke production
vercel --prod
```

## Verifikasi (1 menit)

1. Buka URL Vercel (`https://go-an-nahl.vercel.app`)
2. Login: `admin / admin123`
3. Test koneksi: `https://[url]/api/supabase-test`
4. Seed data (jika kosong):
   ```bash
   curl -X POST "https://[url]/api/seed?force=true"
   ```

## Selesai! 🎉

Aplikasi live di Vercel dengan backend Supabase PostgreSQL.

---

**Total waktu setup**: ~10 menit
**Cost**: $0 (Free tier cukup untuk < 200 santri)
**Auto-deploy**: Setiap push ke `main` branch GitHub

## ⚠️ Jika Sebelumnya Sudah Pernah Deploy dengan Error

Jika Anda sebelumnya deploy dengan source code lama (yang punya dual schema SQLite/PostgreSQL) dan dapat error `Environment variable not found: DATABASE_URL` atau `provider = "sqlite"`:

1. **Re-download source ZIP**: `https://[your-app].vercel.app/go-an-nahl-source.zip` atau `http://localhost:3000/go-an-nahl-source.zip`
2. **Delete Vercel project lama** (atau rename)
3. **Create new Vercel project** dengan source ZIP baru
4. Set 5 env vars (TANPA `PRISMA_SCHEMA` — sudah tidak perlu!)
5. Deploy ulang

Atau jika pakai GitHub: push source code baru ke repo yang sama → Vercel auto-redeploy.
