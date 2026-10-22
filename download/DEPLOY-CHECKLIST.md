# Quick Deploy Checklist — Vercel

## Persiapan (5 menit)

### 1. Setup Database Supabase
```bash
# 1. Buka Supabase Dashboard → SQL Editor → New Query
# 2. Copy-paste isi download/supabase-schema.sql → Run
# 3. Catat database password dari Project Settings → Database
```

### 2. Dapatkan Connection String
```
# Dari Supabase Dashboard → Project Settings → Database → Connection pooling (Transaction mode)

DATABASE_URL=postgresql://postgres.obxqnotzsqxllddegsum:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.obxqnotzsqxllddegsum.supabase.co:5432/postgres
```

### 3. Dapatkan Service Role Key
```
# Dari Supabase Dashboard → Project Settings → API → service_role secret
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

## Deploy ke Vercel (3 menit)

### Via Dashboard
1. Push code ke GitHub
2. https://vercel.com → **Add New** → **Project** → Import repo
3. Tambah **Environment Variables** (6 var):

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://postgres.obxqnotzsqxllddegsum:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` |
| `DIRECT_URL` | `postgresql://postgres:[PASSWORD]@db.obxqnotzsqxllddegsum.supabase.co:5432/postgres` |
| `PRISMA_SCHEMA` | `prisma/schema.vercel.prisma` (PENTING!) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://obxqnotzsqxllddegsum.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_S4wWWeHnYGenAzgEWBM7Hg_8rz29ZSl` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxxx...` |

4. Klik **Deploy** → tunggu 2-3 menit

### Via CLI
```bash
npm i -g vercel
vercel login
vercel

# Set env vars
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add PRISMA_SCHEMA production  # isi: prisma/schema.vercel.prisma
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
