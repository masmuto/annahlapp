-- ============================================================================
-- GO An Nahl — Supabase Schema
-- ============================================================================
-- Run this entire file in Supabase SQL Editor (Dashboard → SQL → New Query)
-- Safe to run multiple times (uses IF NOT EXISTS / DROP IF EXISTS)
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
  password    TEXT NOT NULL, -- store hashed password in production (bcrypt/argon2)
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
  bulan             TEXT NOT NULL, -- format: YYYY-MM
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
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Strategy: All authenticated requests can read.
-- Only admin role can write (insert/update/delete) on most tables.
-- Each user can update their own profile.
-- ============================================================================

-- Helper function to get current user role from JWT
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_role')::TEXT,
    (auth.jwt() -> 'app_metadata' -> 'role')::TEXT,
    'pengelola'
  );
$$ LANGUAGE SQL STABLE;

-- Helper: is current user admin?
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT auth.user_role() = 'admin';
$$ LANGUAGE SQL STABLE;

-- ---------- users ----------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select_authenticated" ON users;
CREATE POLICY "users_select_authenticated" ON users
  FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "users_update_self" ON users;
CREATE POLICY "users_update_self" ON users
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "users_insert_admin" ON users;
CREATE POLICY "users_insert_admin" ON users
  FOR INSERT TO authenticated WITH CHECK (auth.is_admin());
DROP POLICY IF EXISTS "users_update_admin" ON users;
CREATE POLICY "users_update_admin" ON users
  FOR UPDATE TO authenticated USING (auth.is_admin()) WITH CHECK (auth.is_admin());
DROP POLICY IF EXISTS "users_delete_admin" ON users;
CREATE POLICY "users_delete_admin" ON users
  FOR DELETE TO authenticated USING (auth.is_admin());

-- ---------- ustaz ----------
ALTER TABLE ustaz ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ustaz_select_authenticated" ON ustaz;
CREATE POLICY "ustaz_select_authenticated" ON ustaz FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "ustaz_write_admin" ON ustaz;
CREATE POLICY "ustaz_write_admin" ON ustaz FOR ALL TO authenticated
  USING (auth.is_admin()) WITH CHECK (auth.is_admin());

-- ---------- kelas ----------
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kelas_select_authenticated" ON kelas;
CREATE POLICY "kelas_select_authenticated" ON kelas FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "kelas_write_admin" ON kelas;
CREATE POLICY "kelas_write_admin" ON kelas FOR ALL TO authenticated
  USING (auth.is_admin()) WITH CHECK (auth.is_admin());

-- ---------- santri ----------
ALTER TABLE santri ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "santri_select_authenticated" ON santri;
CREATE POLICY "santri_select_authenticated" ON santri FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "santri_write_admin" ON santri;
CREATE POLICY "santri_write_admin" ON santri FOR ALL TO authenticated
  USING (auth.is_admin()) WITH CHECK (auth.is_admin());

-- ---------- kelompok_belajar ----------
ALTER TABLE kelompok_belajar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kelompok_select_authenticated" ON kelompok_belajar;
CREATE POLICY "kelompok_select_authenticated" ON kelompok_belajar
  FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "kelompok_write_admin" ON kelompok_belajar;
CREATE POLICY "kelompok_write_admin" ON kelompok_belajar FOR ALL TO authenticated
  USING (auth.is_admin()) WITH CHECK (auth.is_admin());

-- ---------- jadwal_kelompok ----------
ALTER TABLE jadwal_kelompok ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "jadwal_select_authenticated" ON jadwal_kelompok;
CREATE POLICY "jadwal_select_authenticated" ON jadwal_kelompok
  FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "jadwal_write_admin" ON jadwal_kelompok;
CREATE POLICY "jadwal_write_admin" ON jadwal_kelompok FOR ALL TO authenticated
  USING (auth.is_admin()) WITH CHECK (auth.is_admin());

-- ---------- anggota_kelompok ----------
ALTER TABLE anggota_kelompok ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anggota_select_authenticated" ON anggota_kelompok;
CREATE POLICY "anggota_select_authenticated" ON anggota_kelompok
  FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "anggota_write_admin" ON anggota_kelompok;
CREATE POLICY "anggota_write_admin" ON anggota_kelompok FOR ALL TO authenticated
  USING (auth.is_admin()) WITH CHECK (auth.is_admin());

-- ---------- pembayaran_spp ----------
ALTER TABLE pembayaran_spp ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pembayaran_select_authenticated" ON pembayaran_spp;
CREATE POLICY "pembayaran_select_authenticated" ON pembayaran_spp
  FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "pembayaran_write_admin" ON pembayaran_spp;
CREATE POLICY "pembayaran_write_admin" ON pembayaran_spp FOR ALL TO authenticated
  USING (auth.is_admin() OR auth.user_role() = 'bendahara')
  WITH CHECK (auth.is_admin() OR auth.user_role() = 'bendahara');

-- ---------- pengaturan ----------
ALTER TABLE pengaturan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pengaturan_select_authenticated" ON pengaturan;
CREATE POLICY "pengaturan_select_authenticated" ON pengaturan
  FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "pengaturan_write_admin" ON pengaturan;
CREATE POLICY "pengaturan_write_admin" ON pengaturan FOR ALL TO authenticated
  USING (auth.is_admin()) WITH CHECK (auth.is_admin());

-- ---------- pesan_template ----------
ALTER TABLE pesan_template ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pesan_template_select_authenticated" ON pesan_template;
CREATE POLICY "pesan_template_select_authenticated" ON pesan_template
  FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "pesan_template_write_admin" ON pesan_template;
CREATE POLICY "pesan_template_write_admin" ON pesan_template FOR ALL TO authenticated
  USING (auth.is_admin()) WITH CHECK (auth.is_admin());

-- ---------- pesan_log ----------
ALTER TABLE pesan_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pesan_log_select_authenticated" ON pesan_log;
CREATE POLICY "pesan_log_select_authenticated" ON pesan_log
  FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "pesan_log_insert_authenticated" ON pesan_log;
CREATE POLICY "pesan_log_insert_authenticated" ON pesan_log
  FOR INSERT TO authenticated WITH CHECK (TRUE);
DROP POLICY IF EXISTS "pesan_log_delete_admin" ON pesan_log;
CREATE POLICY "pesan_log_delete_admin" ON pesan_log
  FOR DELETE TO authenticated USING (auth.is_admin());

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

-- Default users (password is plain text — REPLACE with bcrypt hash in production!)
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
-- 8. SAMPLE DATA (Optional — uncomment to add demo santri/ustaz/kelas)
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
-- 1. Copy NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local
-- 2. Set SUPABASE_SERVICE_ROLE_KEY for server-side admin operations (Dashboard → Settings → API)
-- 3. To create admin users with role in auth.users, use the function below
-- ============================================================================

-- ============================================================================
-- APPENDIX: Helper function to set user role in auth.users metadata
-- ============================================================================
-- Run this after creating users via Supabase Auth (sign up). It will set their
-- role in user_metadata so RLS policies can read it.
--
-- CREATE OR REPLACE FUNCTION public.set_user_role(user_uuid UUID, new_role TEXT)
-- RETURNS VOID AS $$
-- BEGIN
--   UPDATE auth.users
--   SET raw_user_meta_data = jsonb_set(
--     COALESCE(raw_user_meta_data, '{}'::jsonb),
--     '{user_role}',
--     to_jsonb(new_role)
--   )
--   WHERE id = user_uuid;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- Usage:
-- SELECT public.set_user_role('uuid-user-id', 'admin');
-- ============================================================================
