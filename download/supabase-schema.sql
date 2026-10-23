-- ============================================================================
-- GO An Nahl — Supabase Schema (CLEAN VERSION)
-- ============================================================================
-- Run this entire file in Supabase SQL Editor (Dashboard → SQL → New Query)
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT DO NOTHING)
--
-- Versi ini TIDAK menggunakan RLS dan function di schema auth (yang butuh
-- superadmin access). Aplikasi menggunakan custom auth (cookie session) +
-- service_role key di server-side yang otomatis bypass RLS.
--
-- Untuk production dengan Supabase Auth + RLS, lihat versi advanced
-- di bagian bawah file ini (commented out).
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. ENUM TYPES
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'bendahara', 'pengelola');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE jenis_kelamin AS ENUM ('L', 'P');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE santri_status AS ENUM ('aktif', 'lulus', 'nonaktif');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ustaz_status AS ENUM ('aktif', 'nonaktif');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE kelompok_status AS ENUM ('aktif', 'selesai', 'dibatalkan');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE pembayaran_status AS ENUM ('lunas', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE metode_pembayaran AS ENUM ('tunai', 'transfer', 'qris');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE pesan_status AS ENUM ('terkirim', 'gagal', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE pesan_kategori AS ENUM ('pembayaran', 'tunggakan', 'jadwal', 'umum', 'test', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- ---------- users ----------
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username    TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  name        TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'admin',
  email       TEXT,
  phone       TEXT,
  avatar      TEXT,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- ---------- ustaz ----------
CREATE TABLE IF NOT EXISTS ustaz (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nip           TEXT UNIQUE,
  nama          TEXT NOT NULL,
  jenis_kelamin jenis_kelamin NOT NULL DEFAULT 'L',
  tempat_lahir  TEXT,
  tanggal_lahir DATE,
  alamat        TEXT,
  no_hp         TEXT,
  email         TEXT,
  spesialisasi  TEXT,
  tanggal_masuk DATE NOT NULL DEFAULT CURRENT_DATE,
  status        ustaz_status NOT NULL DEFAULT 'aktif',
  catatan       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ustaz_status ON ustaz(status);
CREATE INDEX IF NOT EXISTS idx_ustaz_spesialisasi ON ustaz(spesialisasi);

-- ---------- kelas ----------
CREATE TABLE IF NOT EXISTS kelas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama        TEXT UNIQUE NOT NULL,
  tingkat     TEXT NOT NULL,
  ustaz_id    UUID REFERENCES ustaz(id) ON DELETE SET NULL,
  kapasitas   INTEGER NOT NULL DEFAULT 20,
  keterangan  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kelas_tingkat ON kelas(tingkat);
CREATE INDEX IF NOT EXISTS idx_kelas_ustaz ON kelas(ustaz_id);

-- ---------- santri ----------
CREATE TABLE IF NOT EXISTS santri (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nis           TEXT UNIQUE NOT NULL,
  nama          TEXT NOT NULL,
  jenis_kelamin jenis_kelamin NOT NULL DEFAULT 'L',
  tempat_lahir  TEXT,
  tanggal_lahir DATE,
  alamat        TEXT,
  nama_ayah     TEXT,
  nama_ibu      TEXT,
  no_hp_ortu    TEXT,
  kelas_id      UUID REFERENCES kelas(id) ON DELETE SET NULL,
  tanggal_masuk DATE NOT NULL DEFAULT CURRENT_DATE,
  status        santri_status NOT NULL DEFAULT 'aktif',
  catatan       TEXT,
  spp_bulanan   NUMERIC(12,2) NOT NULL DEFAULT 150000,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_santri_kelas ON santri(kelas_id);
CREATE INDEX IF NOT EXISTS idx_santri_status ON santri(status);
CREATE INDEX IF NOT EXISTS idx_santri_nis ON santri(nis);
CREATE INDEX IF NOT EXISTS idx_santri_nama ON santri(nama);

-- ---------- kelompok_belajar ----------
CREATE TABLE IF NOT EXISTS kelompok_belajar (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama           TEXT NOT NULL,
  ustaz_id       UUID REFERENCES ustaz(id) ON DELETE SET NULL,
  mata_pelajaran TEXT NOT NULL,
  ruangan        TEXT,
  kapasitas      INTEGER NOT NULL DEFAULT 15,
  catatan        TEXT,
  status         kelompok_status NOT NULL DEFAULT 'aktif',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kelompok_ustaz ON kelompok_belajar(ustaz_id);
CREATE INDEX IF NOT EXISTS idx_kelompok_status ON kelompok_belajar(status);
CREATE INDEX IF NOT EXISTS idx_kelompok_mapel ON kelompok_belajar(mata_pelajaran);

-- ---------- jadwal_kelompok (1 kelompok bisa banyak hari) ----------
CREATE TABLE IF NOT EXISTS jadwal_kelompok (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kelompok_id UUID NOT NULL REFERENCES kelompok_belajar(id) ON DELETE CASCADE,
  hari        TEXT NOT NULL CHECK (hari IN ('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Ahad')),
  jam_mulai   TEXT NOT NULL,
  jam_selesai TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kelompok_id, hari, jam_mulai)
);
CREATE INDEX IF NOT EXISTS idx_jadwal_kelompok ON jadwal_kelompok(kelompok_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_hari ON jadwal_kelompok(hari);

-- ---------- anggota_kelompok (junction santri <-> kelompok) ----------
CREATE TABLE IF NOT EXISTS anggota_kelompok (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kelompok_id       UUID NOT NULL REFERENCES kelompok_belajar(id) ON DELETE CASCADE,
  santri_id         UUID NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
  tanggal_bergabung DATE NOT NULL DEFAULT CURRENT_DATE,
  catatan           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kelompok_id, santri_id)
);
CREATE INDEX IF NOT EXISTS idx_anggota_kelompok ON anggota_kelompok(kelompok_id);
CREATE INDEX IF NOT EXISTS idx_anggota_santri ON anggota_kelompok(santri_id);

-- ---------- pembayaran_spp ----------
CREATE TABLE IF NOT EXISTS pembayaran_spp (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  no_pembayaran     TEXT UNIQUE NOT NULL,
  santri_id         UUID NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
  bulan             TEXT NOT NULL,
  jumlah            NUMERIC(12,2) NOT NULL,
  tanggal_bayar     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metode_pembayaran metode_pembayaran NOT NULL DEFAULT 'tunai',
  status            pembayaran_status NOT NULL DEFAULT 'lunas',
  keterangan        TEXT,
  diterima_oleh     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (santri_id, bulan)
);
CREATE INDEX IF NOT EXISTS idx_pembayaran_santri ON pembayaran_spp(santri_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_bulan ON pembayaran_spp(bulan);
CREATE INDEX IF NOT EXISTS idx_pembayaran_status ON pembayaran_spp(status);
CREATE INDEX IF NOT EXISTS idx_pembayaran_tanggal ON pembayaran_spp(tanggal_bayar DESC);

-- ---------- pengaturan (key-value) ----------
CREATE TABLE IF NOT EXISTS pengaturan (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key        TEXT UNIQUE NOT NULL,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- pesan_template ----------
CREATE TABLE IF NOT EXISTS pesan_template (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kode       TEXT UNIQUE NOT NULL,
  nama       TEXT NOT NULL,
  isi        TEXT NOT NULL,
  kategori   TEXT NOT NULL DEFAULT 'umum',
  aktif      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pesan_template_kategori ON pesan_template(kategori);

-- ---------- pesan_log ----------
CREATE TABLE IF NOT EXISTS pesan_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  penerima      TEXT NOT NULL,
  nama_penerima TEXT,
  pesan         TEXT NOT NULL,
  kategori      pesan_kategori NOT NULL DEFAULT 'manual',
  status        pesan_status NOT NULL DEFAULT 'terkirim',
  error         TEXT,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pesan_log_kategori ON pesan_log(kategori);
CREATE INDEX IF NOT EXISTS idx_pesan_log_created ON pesan_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pesan_log_user ON pesan_log(user_id);

-- ============================================================================
-- 4. TRIGGERS — auto-update updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_ustaz_updated ON ustaz;
CREATE TRIGGER trg_ustaz_updated BEFORE UPDATE ON ustaz
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_kelas_updated ON kelas;
CREATE TRIGGER trg_kelas_updated BEFORE UPDATE ON kelas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_santri_updated ON santri;
CREATE TRIGGER trg_santri_updated BEFORE UPDATE ON santri
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_kelompok_updated ON kelompok_belajar;
CREATE TRIGGER trg_kelompok_updated BEFORE UPDATE ON kelompok_belajar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_jadwal_kelompok_updated ON jadwal_kelompok;
CREATE TRIGGER trg_jadwal_kelompok_updated BEFORE UPDATE ON jadwal_kelompok
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_pembayaran_updated ON pembayaran_spp;
CREATE TRIGGER trg_pembayaran_updated BEFORE UPDATE ON pembayaran_spp
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_pesan_template_updated ON pesan_template;
CREATE TRIGGER trg_pesan_template_updated BEFORE UPDATE ON pesan_template
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) — DISABLED
-- ============================================================================
-- Aplikasi menggunakan:
--   1. Custom auth (cookie session, bukan Supabase Auth)
--   2. Service role key di server-side (bypass RLS)
--   3. Prisma ORM untuk database access
--
-- Karena itu RLS tidak relevan dan kami DISABLE untuk semua tabel.
-- Server-side API routes sudah melakukan otorisasi sendiri (cek role admin/
-- bendahara/pengelola) sebelum mengakses database.
--
-- UNTUK PRODUCTION DENGAN SUPABASE AUTH:
-- Lihat bagian "RLS POLICIES (ADVANCED)" di bawah untuk meng-enable RLS
-- dengan aman setelah setup Supabase Auth.
-- ============================================================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE ustaz DISABLE ROW LEVEL SECURITY;
ALTER TABLE kelas DISABLE ROW LEVEL SECURITY;
ALTER TABLE santri DISABLE ROW LEVEL SECURITY;
ALTER TABLE kelompok_belajar DISABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_kelompok DISABLE ROW LEVEL SECURITY;
ALTER TABLE anggota_kelompok DISABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran_spp DISABLE ROW LEVEL SECURITY;
ALTER TABLE pengaturan DISABLE ROW LEVEL SECURITY;
ALTER TABLE pesan_template DISABLE ROW LEVEL SECURITY;
ALTER TABLE pesan_log DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. VIEWS — for convenience queries
-- ============================================================================

-- View: santri with kelas name
CREATE OR REPLACE VIEW v_santri_lengkap AS
SELECT
  s.*,
  k.nama AS kelas_nama,
  k.tingkat AS kelas_tingkat
FROM santri s
LEFT JOIN kelas k ON s.kelas_id = k.id;

-- View: kelompok with jadwal count & anggota count
CREATE OR REPLACE VIEW v_kelompok_summary AS
SELECT
  k.*,
  u.nama AS ustaz_nama,
  (SELECT COUNT(*) FROM jadwal_kelompok jk WHERE jk.kelompok_id = k.id) AS jadwal_count,
  (SELECT COUNT(*) FROM anggota_kelompok ak WHERE ak.kelompok_id = k.id) AS anggota_count
FROM kelompok_belajar k
LEFT JOIN ustaz u ON k.ustaz_id = u.id;

-- View: pembayaran with santri info
CREATE OR REPLACE VIEW v_pembayaran_lengkap AS
SELECT
  p.*,
  s.nama AS santri_nama,
  s.nis AS santri_nis,
  k.nama AS kelas_nama
FROM pembayaran_spp p
JOIN santri s ON p.santri_id = s.id
LEFT JOIN kelas k ON s.kelas_id = k.id;

-- ============================================================================
-- 7. SEED DATA — Default admin, pengaturan, pesan templates
-- ============================================================================

-- Default users (password plain text — GANTI dengan bcrypt hash di production!)
INSERT INTO users (username, password, name, role, email, phone) VALUES
  ('admin', 'admin123', 'Administrator An Nahl', 'admin', 'admin@tahfidzannahl.sch.id', '081200000001'),
  ('bendahara', 'bendahara123', 'Bendahara An Nahl', 'bendahara', 'bendahara@tahfidzannahl.sch.id', '081200000002'),
  ('pengelola', 'pengelola123', 'Pengelola An Nahl', 'pengelola', 'pengelola@tahfidzannahl.sch.id', '081200000003')
ON CONFLICT (username) DO NOTHING;

-- Default pengaturan
INSERT INTO pengaturan (key, value) VALUES
  ('wa_enabled', 'true'),
  ('wa_sender_name', 'Rumah Tahfidz An Nahl'),
  ('wa_sender_number', '6281200000000'),
  ('wa_api_url', ''),
  ('wa_api_token', ''),
  ('wa_use_gateway', 'false'),
  ('app_name', 'GO An Nahl'),
  ('app_lembaga', 'Rumah Tahfidz An Nahl'),
  ('app_address', 'Jl. Pendidikan No. 1, Kota'),
  ('app_phone', '081200000000'),
  ('app_email', 'info@tahfidzannahl.sch.id'),
  ('spp_default_amount', '150000'),
  ('spp_due_day', '10')
ON CONFLICT (key) DO NOTHING;

-- Default pesan templates
INSERT INTO pesan_template (kode, nama, isi, kategori, aktif) VALUES
  (
    'bukti_pembayaran',
    'Bukti Pembayaran SPP',
    E'Assalamu''alaikum Wr. Wb.\n\nYth. {nama_ortu}\n\nKami informasikan bahwa pembayaran SPP putra/putri Bapak/Ibu telah kami terima dengan rincian:\n\nNama Santri: {nama}\nNIS: {nis}\nKelas: {kelas}\nBulan: {bulan}\nJumlah: {jumlah}\nNo. Pembayaran: {noPembayaran}\nTanggal: {tanggal}\n\nJazakumullah khairan katsira.\n\nWassalamu''alaikum Wr. Wb.\n{lembaga}',
    'pembayaran',
    TRUE
  ),
  (
    'tunggakan_spp',
    'Pengingat Tunggakan SPP',
    E'Assalamu''alaikum Wr. Wb.\n\nYth. {nama_ortu}\n\nKami informasikan bahwa pembayaran SPP untuk putra/putri Bapak/Ibu pada bulan {bulan} belum diterima.\n\nNama Santri: {nama}\nNIS: {nis}\nKelas: {kelas}\nBulan: {bulan}\nJumlah: {jumlah}\n\nMohon dapat segera melakukan pembayaran. Jazakumullah khairan.\n\nWassalamu''alaikum Wr. Wb.\n{lembaga}',
    'tunggakan',
    TRUE
  ),
  (
    'info_jadwal',
    'Info Jadwal Kelompok Belajar',
    E'Assalamu''alaikum Wr. Wb.\n\nYth. {nama_ortu}\n\nKami informasikan jadwal kelompok belajar putra/putri Bapak/Ibu:\n\nNama Santri: {nama}\nNIS: {nis}\nHari: {hari}\nJam: {jam}\nPembimbing: {ustaz}\nRuangan: {ruangan}\n\nMohon hadir tepat waktu. Jazakumullah khairan.\n\nWassalamu''alaikum Wr. Wb.\n{lembaga}',
    'jadwal',
    TRUE
  ),
  (
    'pengumuman_umum',
    'Pengumuman Umum',
    E'Assalamu''alaikum Wr. Wb.\n\nYth. {nama_ortu}\n\n{pesan}\n\nWassalamu''alaikum Wr. Wb.\n{lembaga}',
    'umum',
    TRUE
  )
ON CONFLICT (kode) DO NOTHING;

-- ============================================================================
-- 8. SAMPLE DATA (Optional — uncomment to add demo data)
-- ============================================================================
/*
-- Demo ustaz
INSERT INTO ustaz (nip, nama, jenis_kelamin, spesialisasi, no_hp, tanggal_masuk, alamat) VALUES
  ('NIP-2025-001', 'Ust. Ahmad Fauzan, S.Pd.I', 'L', 'Tahfidz', '081234567001', '2023-07-15', 'Jl. Pendidikan No. 1'),
  ('NIP-2025-002', 'Ust. Siti Aminah, S.Pd.I', 'P', 'Tahfidz', '081234567002', '2023-07-15', 'Jl. Pendidikan No. 2'),
  ('NIP-2025-003', 'Ust. Abdul Rahman, Lc', 'L', 'Tajwid', '081234567003', '2023-07-15', 'Jl. Pendidikan No. 3'),
  ('NIP-2025-004', 'Ust. Khadijah, S.Pd.I', 'P', 'Iqra', '081234567004', '2023-07-15', 'Jl. Pendidikan No. 4')
ON CONFLICT (nip) DO NOTHING;

-- Demo kelas (run AFTER ustaz inserted)
INSERT INTO kelas (nama, tingkat, ustaz_id, kapasitas) VALUES
  ('Kelas A - Iqra 1', 'Iqra', (SELECT id FROM ustaz WHERE nip='NIP-2025-004'), 15),
  ('Kelas B - Tahsin', 'Tahsin', (SELECT id FROM ustaz WHERE nip='NIP-2025-003'), 18),
  ('Kelas C - Tahfidz 1', 'Tahfidz', (SELECT id FROM ustaz WHERE nip='NIP-2025-001'), 20)
ON CONFLICT (nama) DO NOTHING;

-- Demo santri (run AFTER kelas inserted)
INSERT INTO santri (nis, nama, jenis_kelamin, no_hp_ortu, kelas_id, spp_bulanan, tanggal_masuk) VALUES
  ('SN-2025-001', 'Ahmad Fauzan', 'L', '081234567100', (SELECT id FROM kelas WHERE nama='Kelas C - Tahfidz 1'), 200000, '2024-07-15'),
  ('SN-2025-002', 'Fatimah Azzahra', 'P', '081234567101', (SELECT id FROM kelas WHERE nama='Kelas A - Iqra 1'), 150000, '2024-07-15'),
  ('SN-2025-003', 'Abdul Mubarak', 'L', '081234567102', (SELECT id FROM kelas WHERE nama='Kelas B - Tahsin'), 175000, '2024-07-15')
ON CONFLICT (nis) DO NOTHING;
*/

-- ============================================================================
-- DONE. Schema ready.
-- ============================================================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Test connection: GET /api/supabase-test
-- 3. Seed demo data via app: POST /api/seed?force=true
-- ============================================================================


-- ============================================================================
-- RLS POLICIES (ADVANCED) — OPTIONAL, untuk production dengan Supabase Auth
-- ============================================================================
-- Bagian ini TIDAK dieksekusi secara default. Uncomment jika:
-- 1. Anda sudah setup Supabase Auth (Email/Password signup)
-- 2. User login via supabase.auth.signIn() (bukan custom cookie)
-- 3. Ingin enforce row-level security berdasarkan JWT user
--
-- Sebelum enable RLS, pastikan:
-- - Setiap user di auth.users punya user_metadata.user_role = 'admin'/'bendahara'/'pengelola'
-- - Function helper di bawah sudah dibuat di schema public (BUKAN auth)
-- ============================================================================
/*

-- Helper function di schema PUBLIC (bukan auth) — tidak butuh superadmin
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_role')::TEXT,
    (auth.jwt() -> 'app_metadata' -> 'role')::TEXT,
    'pengelola'
  );
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() = 'admin';
$$ LANGUAGE SQL STABLE;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ustaz ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelompok_belajar ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_kelompok ENABLE ROW LEVEL SECURITY;
ALTER TABLE anggota_kelompok ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran_spp ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengaturan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesan_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesan_log ENABLE ROW LEVEL SECURITY;

-- Example policies (sesuaikan dengan kebutuhan)
CREATE POLICY "users_select_authenticated" ON users
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "users_update_self" ON users
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_all_admin" ON users
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "santri_select_authenticated" ON santri
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "santri_all_admin" ON santri
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- (lanjutkan pattern yang sama untuk tabel lainnya...)
*/
