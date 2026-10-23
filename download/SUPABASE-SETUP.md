# Setup Supabase untuk GO An Nahl

Dokumen ini menjelaskan cara menghubungkan aplikasi GO An Nahl dengan **Supabase** sebagai backend (PostgreSQL + Auth + RLS).

## Prasyarat

- Akun Supabase (https://supabase.com) — gratis untuk starter
- Project Supabase sudah dibuat
- File `supabase-schema.sql` (tersedia di `/download/supabase-schema.sql`)

## Langkah 1: Dapatkan Credentials

1. Buka **Supabase Dashboard** → pilih project Anda
2. Buka **Project Settings** (ikon ⚙️) → **API**
3. Catat 3 nilai:
   - **Project URL**: `https://xxx.supabase.co` (sudah diisi di `.env`)
   - **anon/publishable key**: `sb_publishable_xxx` (sudah diisi di `.env`)
   - **service_role secret**: `eyJxxx...` (WAJIB diisi untuk operasi server)

## Langkah 2: Buat Schema di Supabase

1. Buka **SQL Editor** di sidebar Supabase Dashboard
2. Klik **New query**
3. Buka file `/home/z/my-project/download/supabase-schema.sql`
4. Copy seluruh isinya → paste ke SQL Editor
5. Klik **Run** (tunggu sampai sukses, ~5 detik)

> ⚠️ **PENTING**: Jika sebelumnya Anda sudah mencoba run SQL dan dapat error
> `permission denied for schema auth`, **ABAIKAN error tersebut**. Schema
> versi baru sudah diperbaiki — tidak lagi membuat function di schema `auth`.
> Cukup run ulang SQL baru, tidak perlu drop tabel yang sudah ter-create
> (semua statement pakai `IF NOT EXISTS` / `ON CONFLICT DO NOTHING`).

Schema akan membuat:
- ✅ 11 tabel (users, ustaz, kelas, santri, kelompok_belajar, jadwal_kelompok, anggota_kelompok, pembayaran_spp, pengaturan, pesan_template, pesan_log)
- ✅ 8 enum types
- ✅ 25 indexes untuk query performance
- ✅ 8 triggers auto-update `updated_at`
- ✅ 3 views untuk convenience query
- ✅ 3 user default (admin, bendahara, pengelola)
- ✅ 13 pengaturan default (WA settings, app config, SPP defaults)
- ✅ 4 pesan template default (bukti_pembayaran, tunggakan_spp, info_jadwal, pengumuman_umum)
- ✅ RLS DISABLED (aman karena pakai service_role key di server-side, lihat catatan di bawah)

## Langkah 3: Isi `.env.local` (atau `.env`)

File `.env` sudah terisi 2 var pertama. Tambahkan **service_role** untuk operasi server:

```env
NEXT_PUBLIC_SUPABASE_URL=https://obxqnotzsqxllddegsum.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_S4wWWeHnYGenAzgEWBM7Hg_8rz29ZSl
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # ISI INI dari Dashboard → Settings → API
USE_SUPABASE=true  # Set true untuk switch backend ke Supabase
```

## Langkah 4: Verifikasi Koneksi

Setelah setup, restart dev server:
```bash
# Touch .env to trigger reload
touch .env
```

Buka aplikasi → login dengan `admin / admin123` → cek apakah data muncul.

## Struktur File

| File | Fungsi |
|---|---|
| `src/lib/supabase.ts` | Client Supabase (browser + server) + table constants |
| `.env` | Environment variables (URL, anon key, service key) |
| `download/supabase-schema.sql` | DDL lengkap untuk Supabase SQL Editor |

## Schema Diagram

```
users (auth users)
  └── pesan_log (user_id)

ustaz
  ├── kelas (ustaz_id)
  └── kelompok_belajar (ustaz_id)

kelas
  ├── santri (kelas_id)
  └── ustaz (ustaz_id)

santri
  ├── pembayaran_spp (santri_id)
  └── anggota_kelompok (santri_id)

kelompok_belajar
  ├── jadwal_kelompok (kelompok_id) [1-to-many: multi-hari]
  ├── anggota_kelompok (kelompok_id) [many-to-many dengan santri]
  └── ustaz (ustaz_id)

pengaturan (key-value)
pesan_template (kode, isi, kategori)
pesan_log (penerima, status, kategori)
```

## RLS (Row Level Security)

**Status: DISABLED** di schema default (untuk kompatibilitas maksimal).

### Kenapa RLS DISABLED?

Aplikasi menggunakan:
1. **Custom auth** (cookie session, bukan Supabase Auth)
2. **Service role key** di server-side (otomatis bypass RLS)
3. **Prisma ORM** untuk database access

Karena itu RLS tidak relevan — otorisasi sudah di-handle di API routes (cek role admin/bendahara/pengelola sebelum akses database).

### Kapan Meng-enable RLS?

Jika Anda ingin:
- Pakai **Supabase Auth** (login/register via Supabase)
- Akses database langsung dari frontend dengan anon key
- Enforce row-level security per user

Lihat bagian "RLS POLICIES (ADVANCED)" di akhir file `supabase-schema.sql` (commented out). Enable setelah:
1. Setup Supabase Auth (Email/Password)
2. Setiap user di `auth.users` punya `user_metadata.user_role = 'admin'/'bendahara'/'pengelola'`
3. Uncomment section RLS advanced di SQL schema

### Otorisasi yang Berjalan (Server-side)

| Role | Akses |
|---|---|
| `admin` | Full access semua fitur + User Manager + Database reset |
| `bendahara` | Pembayaran SPP + Laporan + Profil sendiri |
| `pengelola` | Read-only sebagian besar data + Profil sendiri |
| (anonymous) | Hanya halaman login |

## Migration dari Prisma/SQLite ke Supabase

Aplikasi saat ini menggunakan **Prisma + SQLite** sebagai backend default. Untuk switch ke Supabase:

### Opsi A: Migrasi Data (Rekomendasi)
1. Backup data SQLite via menu **Pengaturan → Database → Backup**
2. Setup Supabase (jalankan SQL schema)
3. Import data manual ke Supabase via SQL Editor atau Dashboard Table Editor
4. Set `USE_SUPABASE=true` di `.env`
5. API routes akan otomatis switch ke Supabase

### Opsi B: Paralel (Hybrid)
- Prisma untuk development lokal
- Supabase untuk production
- Bandingkan performa sebelum commit

## Production Notes

### Keamanan Password
Schema saat ini menyimpan password sebagai **plain text** di tabel `users`. Untuk production:

```sql
-- Update password user dengan bcrypt hash
UPDATE users SET password = '$2b$10$xxx...' WHERE username = 'admin';
```

Atau gunakan **Supabase Auth** (built-in) — schema dirancang agar bisa diintegrasikan dengan `auth.users`:
1. Aktifkan Email/Password auth di Supabase Dashboard
2. Buat user via `supabase.auth.signUp()` di frontend
3. Set role user via function `public.set_user_role(user_uuid, 'admin')`
4. Update RLS policies untuk baca role dari JWT (`auth.jwt() -> 'user_role'`)

### Backup Otomatis
- Supabase Free: backup harian otomatis, retention 7 hari
- Supabase Pro ($25/bln): Point-in-time recovery, retention 30 hari

### Performance
- Indexes sudah dibuat untuk kolom yang sering di-filter
- Gunakan views (`v_santri_lengkap`, `v_kelompok_summary`, `v_pembayaran_lengkap`) untuk query yang sering dipakai
- Realtime subscription tersedia (akan dikembangkan di versi berikutnya)

## Troubleshooting

### Error: `relation "users" does not exist`
**Solusi**: Jalankan ulang `supabase-schema.sql` di SQL Editor.

### Error: `permission denied for table users`
**Solusi**: Pastikan user sudah login (anon key + JWT). Cek RLS policies di Dashboard → Authentication → Policies.

### Error: `invalid input syntax for type uuid`
**Solusi**: Pastikan semua ID yang dikirim ke API adalah UUID valid. Prisma menggunakan cuid (string), Supabase menggunakan UUID.

### Supabase client not configured
**Solusi**: Cek env vars di `.env`. Restart dev server dengan `touch .env`.

## Useful Queries

Cek jumlah record per tabel:
```sql
SELECT 'users' AS t, COUNT(*) FROM users
UNION ALL SELECT 'santri', COUNT(*) FROM santri
UNION ALL SELECT 'ustaz', COUNT(*) FROM ustaz
UNION ALL SELECT 'kelas', COUNT(*) FROM kelas
UNION ALL SELECT 'kelompok_belajar', COUNT(*) FROM kelompok_belajar
UNION ALL SELECT 'pembayaran_spp', COUNT(*) FROM pembayaran_spp
UNION ALL SELECT 'pesan_log', COUNT(*) FROM pesan_log;
```

Cek user role:
```sql
SELECT id, username, name, role FROM users ORDER BY created_at;
```

Reset database (HATI-HATI):
```sql
DROP TABLE IF EXISTS pesan_log, pesan_template, pengaturan, pembayaran_spp,
  anggota_kelompok, jadwal_kelompok, kelompok_belajar, santri, kelas, ustaz, users
  CASCADE;
-- Lalu jalankan ulang supabase-schema.sql
```
