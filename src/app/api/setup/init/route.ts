import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { readSupabaseConfig, markInitialized } from "@/lib/supabase-config";

export const runtime = "nodejs";

// POST /api/setup/init — run the SQL schema on Supabase PostgreSQL
// Uses the Supabase SQL endpoint (POST /rest/v1/rpc) is NOT suitable for DDL.
// Instead, we use the Management API or direct query via pg.
//
// Strategy: Use Supabase's `/pg/query` endpoint (not publicly documented)
// OR use the `@supabase/supabase-js` `.rpc()` to call a function we define.
//
// Simplest reliable approach: Send the SQL via the SQL-over-HTTP endpoint
// at `/sql` (Supabase internal). This requires the service role key.
//
// If that fails, we return the SQL to the user so they can paste it into
// the Supabase SQL Editor manually.

const SCHEMA_SQL = `-- GO An Nahl Schema (Prisma-compatible)
DROP TABLE IF EXISTS "pembayaran_spp" CASCADE;
DROP TABLE IF EXISTS "anggota_kelompok" CASCADE;
DROP TABLE IF EXISTS "jadwal_kelompok" CASCADE;
DROP TABLE IF EXISTS "kelompok_belajar" CASCADE;
DROP TABLE IF EXISTS "santri" CASCADE;
DROP TABLE IF EXISTS "kelas" CASCADE;
DROP TABLE IF EXISTS "ustaz" CASCADE;
DROP TABLE IF EXISTS "pesan_log" CASCADE;
DROP TABLE IF EXISTS "pesan_template" CASCADE;
DROP TABLE IF EXISTS "pengaturan" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "username" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'admin',
  "email" TEXT,
  "phone" TEXT,
  "avatar" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "lastLogin" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "pengaturan" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT UNIQUE NOT NULL,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "pesan_template" (
  "id" TEXT PRIMARY KEY,
  "kode" TEXT UNIQUE NOT NULL,
  "nama" TEXT NOT NULL,
  "isi" TEXT NOT NULL,
  "kategori" TEXT NOT NULL DEFAULT 'umum',
  "aktif" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "pesan_log" (
  "id" TEXT PRIMARY KEY,
  "penerima" TEXT NOT NULL,
  "namaPenerima" TEXT,
  "pesan" TEXT NOT NULL,
  "kategori" TEXT NOT NULL DEFAULT 'manual',
  "status" TEXT NOT NULL DEFAULT 'terkirim',
  "error" TEXT,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "ustaz" (
  "id" TEXT PRIMARY KEY,
  "nip" TEXT UNIQUE,
  "nama" TEXT NOT NULL,
  "jenisKelamin" TEXT NOT NULL DEFAULT 'L',
  "tempatLahir" TEXT,
  "tanggalLahir" TIMESTAMPTZ,
  "alamat" TEXT,
  "noHp" TEXT,
  "email" TEXT,
  "spesialisasi" TEXT,
  "tanggalMasuk" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "status" TEXT NOT NULL DEFAULT 'aktif',
  "catatan" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "kelas" (
  "id" TEXT PRIMARY KEY,
  "nama" TEXT UNIQUE NOT NULL,
  "tingkat" TEXT NOT NULL,
  "ustazId" TEXT REFERENCES "ustaz"("id") ON DELETE SET NULL,
  "kapasitas" INTEGER NOT NULL DEFAULT 20,
  "keterangan" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "santri" (
  "id" TEXT PRIMARY KEY,
  "nis" TEXT UNIQUE NOT NULL,
  "nama" TEXT NOT NULL,
  "jenisKelamin" TEXT NOT NULL DEFAULT 'L',
  "tempatLahir" TEXT,
  "tanggalLahir" TIMESTAMPTZ,
  "alamat" TEXT,
  "namaAyah" TEXT,
  "namaIbu" TEXT,
  "noHpOrtu" TEXT,
  "kelasId" TEXT REFERENCES "kelas"("id") ON DELETE SET NULL,
  "tanggalMasuk" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "status" TEXT NOT NULL DEFAULT 'aktif',
  "catatan" TEXT,
  "sppBulanan" DOUBLE PRECISION NOT NULL DEFAULT 150000,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "kelompok_belajar" (
  "id" TEXT PRIMARY KEY,
  "nama" TEXT NOT NULL,
  "ustazId" TEXT REFERENCES "ustaz"("id") ON DELETE SET NULL,
  "mataPelajaran" TEXT NOT NULL,
  "ruangan" TEXT,
  "kapasitas" INTEGER NOT NULL DEFAULT 15,
  "catatan" TEXT,
  "status" TEXT NOT NULL DEFAULT 'aktif',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "jadwal_kelompok" (
  "id" TEXT PRIMARY KEY,
  "kelompokId" TEXT NOT NULL REFERENCES "kelompok_belajar"("id") ON DELETE CASCADE,
  "hari" TEXT NOT NULL,
  "jamMulai" TEXT NOT NULL,
  "jamSelesai" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("kelompokId", "hari", "jamMulai")
);

CREATE TABLE "anggota_kelompok" (
  "id" TEXT PRIMARY KEY,
  "kelompokId" TEXT NOT NULL REFERENCES "kelompok_belajar"("id") ON DELETE CASCADE,
  "santriId" TEXT NOT NULL REFERENCES "santri"("id") ON DELETE CASCADE,
  "tanggalBergabung" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "catatan" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("kelompokId", "santriId")
);

CREATE TABLE "pembayaran_spp" (
  "id" TEXT PRIMARY KEY,
  "noPembayaran" TEXT UNIQUE NOT NULL,
  "santriId" TEXT NOT NULL REFERENCES "santri"("id") ON DELETE CASCADE,
  "bulan" TEXT NOT NULL,
  "jumlah" DOUBLE PRECISION NOT NULL,
  "tanggalBayar" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "metodePembayaran" TEXT NOT NULL DEFAULT 'tunai',
  "status" TEXT NOT NULL DEFAULT 'lunas',
  "keterangan" TEXT,
  "diterimaOleh" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("santriId", "bulan")
);

CREATE INDEX IF NOT EXISTS idx_user_username ON "User"("username");
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"("role");
CREATE INDEX IF NOT EXISTS idx_user_active ON "User"("active");
CREATE INDEX IF NOT EXISTS idx_pesan_template_kategori ON "pesan_template"("kategori");
CREATE INDEX IF NOT EXISTS idx_pesan_log_kategori ON "pesan_log"("kategori");
CREATE INDEX IF NOT EXISTS idx_pesan_log_created ON "pesan_log"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_ustaz_status ON "ustaz"("status");
CREATE INDEX IF NOT EXISTS idx_kelas_tingkat ON "kelas"("tingkat");
CREATE INDEX IF NOT EXISTS idx_kelas_ustaz ON "kelas"("ustazId");
CREATE INDEX IF NOT EXISTS idx_santri_kelas ON "santri"("kelasId");
CREATE INDEX IF NOT EXISTS idx_santri_status ON "santri"("status");
CREATE INDEX IF NOT EXISTS idx_santri_nis ON "santri"("nis");
CREATE INDEX IF NOT EXISTS idx_kelompok_ustaz ON "kelompok_belajar"("ustazId");
CREATE INDEX IF NOT EXISTS idx_kelompok_status ON "kelompok_belajar"("status");
CREATE INDEX IF NOT EXISTS idx_jadwal_kelompok ON "jadwal_kelompok"("kelompokId");
CREATE INDEX IF NOT EXISTS idx_anggota_kelompok ON "anggota_kelompok"("kelompokId");
CREATE INDEX IF NOT EXISTS idx_anggota_santri ON "anggota_kelompok"("santriId");
CREATE INDEX IF NOT EXISTS idx_pembayaran_santri ON "pembayaran_spp"("santriId");
CREATE INDEX IF NOT EXISTS idx_pembayaran_bulan ON "pembayaran_spp"("bulan");
CREATE INDEX IF NOT EXISTS idx_pembayaran_status ON "pembayaran_spp"("status");
CREATE INDEX IF NOT EXISTS idx_pembayaran_tanggal ON "pembayaran_spp"("tanggalBayar" DESC);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_updated BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pengaturan_updated BEFORE UPDATE ON "pengaturan"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pesan_template_updated BEFORE UPDATE ON "pesan_template"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ustaz_updated BEFORE UPDATE ON "ustaz"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_kelas_updated BEFORE UPDATE ON "kelas"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_santri_updated BEFORE UPDATE ON "santri"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_kelompok_updated BEFORE UPDATE ON "kelompok_belajar"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_jadwal_kelompok_updated BEFORE UPDATE ON "jadwal_kelompok"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pembayaran_updated BEFORE UPDATE ON "pembayaran_spp"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO "User" ("id", "username", "password", "name", "role", "email", "phone", "active", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'admin', 'admin123', 'Administrator An Nahl', 'admin', 'admin@tahfidzannahl.sch.id', '081200000001', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'bendahara', 'bendahara123', 'Bendahara An Nahl', 'bendahara', 'bendahara@tahfidzannahl.sch.id', '081200000002', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'pengelola', 'pengelola123', 'Pengelola An Nahl', 'pengelola', 'pengelola@tahfidzannahl.sch.id', '081200000003', TRUE, NOW(), NOW())
ON CONFLICT ("username") DO NOTHING;

INSERT INTO "pengaturan" ("id", "key", "value", "updatedAt") VALUES
  (gen_random_uuid()::text, 'wa_enabled', 'true', NOW()),
  (gen_random_uuid()::text, 'wa_sender_name', 'Rumah Tahfidz An Nahl', NOW()),
  (gen_random_uuid()::text, 'wa_sender_number', '6281200000000', NOW()),
  (gen_random_uuid()::text, 'wa_api_url', '', NOW()),
  (gen_random_uuid()::text, 'wa_api_token', '', NOW()),
  (gen_random_uuid()::text, 'wa_use_gateway', 'false', NOW()),
  (gen_random_uuid()::text, 'app_name', 'GO An Nahl', NOW()),
  (gen_random_uuid()::text, 'app_lembaga', 'Rumah Tahfidz An Nahl', NOW()),
  (gen_random_uuid()::text, 'app_address', 'Jl. Pendidikan No. 1, Kota', NOW()),
  (gen_random_uuid()::text, 'app_phone', '081200000000', NOW()),
  (gen_random_uuid()::text, 'app_email', 'info@tahfidzannahl.sch.id', NOW()),
  (gen_random_uuid()::text, 'spp_default_amount', '150000', NOW()),
  (gen_random_uuid()::text, 'spp_due_day', '10', NOW())
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "pesan_template" ("id", "kode", "nama", "isi", "kategori", "aktif", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'bukti_pembayaran', 'Bukti Pembayaran SPP', E'Assalamu''alaikum Wr. Wb.\\n\\nYth. {nama_ortu}\\n\\nKami informasikan bahwa pembayaran SPP putra/putri Bapak/Ibu telah kami terima dengan rincian:\\n\\nNama Santri: {nama}\\nNIS: {nis}\\nKelas: {kelas}\\nBulan: {bulan}\\nJumlah: {jumlah}\\nNo. Pembayaran: {noPembayaran}\\nTanggal: {tanggal}\\n\\nJazakumullah khairan katsira.\\n\\nWassalamu''alaikum Wr. Wb.\\n{lembaga}', 'pembayaran', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'tunggakan_spp', 'Pengingat Tunggakan SPP', E'Assalamu''alaikum Wr. Wb.\\n\\nYth. {nama_ortu}\\n\\nKami informasikan bahwa pembayaran SPP untuk putra/putri Bapak/Ibu pada bulan {bulan} belum diterima.\\n\\nNama Santri: {nama}\\nNIS: {nis}\\nKelas: {kelas}\\nBulan: {bulan}\\nJumlah: {jumlah}\\n\\nMohon dapat segera melakukan pembayaran. Jazakumullah khairan.\\n\\nWassalamu''alaikum Wr. Wb.\\n{lembaga}', 'tunggakan', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'info_jadwal', 'Info Jadwal Kelompok Belajar', E'Assalamu''alaikum Wr. Wb.\\n\\nYth. {nama_ortu}\\n\\nKami informasikan jadwal kelompok belajar putra/putri Bapak/Ibu:\\n\\nNama Santri: {nama}\\nNIS: {nis}\\nHari: {hari}\\nJam: {jam}\\nPembimbing: {ustaz}\\nRuangan: {ruangan}\\n\\nMohon hadir tepat waktu. Jazakumullah khairan.\\n\\nWassalamu''alaikum Wr. Wb.\\n{lembaga}', 'jadwal', TRUE, NOW(), NOW()),
  (gen_random_uuid()::text, 'pengumuman_umum', 'Pengumuman Umum', E'Assalamu''alaikum Wr. Wb.\\n\\nYth. {nama_ortu}\\n\\n{pesan}\\n\\nWassalamu''alaikum Wr. Wb.\\n{lembaga}', 'umum', TRUE, NOW(), NOW())
ON CONFLICT ("kode") DO NOTHING;
`;

interface InitBody {
  url?: string;
  publishableKey?: string;
  serviceRoleKey?: string;
}

export async function POST(req: NextRequest) {
  let body: InitBody = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine — use saved config
  }

  const saved = readSupabaseConfig();
  const url = (body.url || saved.url || "").trim();
  const publishableKey = (body.publishableKey || saved.publishableKey || "").trim();
  const serviceRoleKey = (body.serviceRoleKey || saved.serviceRoleKey || "").trim();

  if (!url || !serviceRoleKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Service Role Key wajib untuk inisialisasi schema. Set SUPABASE_SERVICE_ROLE_KEY atau masukkan via form.",
        sqlForManualRun: SCHEMA_SQL,
      },
      { status: 400 }
    );
  }

  // Try Supabase SQL over HTTP endpoint (works on most Supabase projects).
  // The endpoint is /pg/query (POST with { query: "..." })
  // OR /sql (older). We try both.
  const endpoints = [
    `${url}/pg/query`,
    `${url}/rest/v1/rpc/exec_sql`,
  ];

  let lastError = "";
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ query: SCHEMA_SQL }),
        signal: AbortSignal.timeout(30000),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        // Mark config as initialized
        const updated = markInitialized();
        return NextResponse.json({
          ok: true,
          message: "Schema berhasil diinisialisasi di Supabase.",
          endpoint,
          result: data,
          config: {
            initialized: true,
            initializedAt: updated.initializedAt,
          },
        });
      }

      const text = await res.text().catch(() => "");
      lastError = `${endpoint}: HTTP ${res.status} ${text.slice(0, 200)}`;

      // 404 → try next endpoint
      if (res.status === 404) continue;
      // Other errors → also try next
    } catch (err) {
      lastError = `${endpoint}: ${String(err)}`;
      continue;
    }
  }

  // All endpoints failed → return SQL for manual run
  return NextResponse.json({
    ok: false,
    error:
      "Inisialisasi otomatis gagal (endpoint SQL Supabase tidak tersedia atau diblokir). " +
      "Silakan copy SQL di bawah dan jalankan manual di Supabase Dashboard → SQL Editor.",
    lastError,
    sqlForManualRun: SCHEMA_SQL,
    manualSteps: [
      "Buka https://supabase.com/dashboard/project/kciglknjiosjbxfmtqjo/sql/new",
      "Copy-paste SQL dari field 'sqlForManualRun' ke editor",
      "Klik Run",
      "Kembali ke aplikasi dan klik 'Saya sudah jalankan SQL di Supabase'",
    ],
  }, { status: 200 });
}
