import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decodeToken } from "@/lib/auth";

export const runtime = "nodejs";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("an_nahl_session_token")?.value;
  if (!token) return null;
  const s = decodeToken(token);
  if (!s || s.role !== "admin") return null;
  return s;
}

interface BackupData {
  _meta?: { app?: string; version?: string };
  data?: {
    users?: any[];
    santri?: any[];
    ustaz?: any[];
    kelas?: any[];
    kelompokBelajar?: any[];
    anggotaKelompok?: any[];
    pembayaranSPP?: any[];
    pengaturan?: any[];
    pesanTemplate?: any[];
    pesanLog?: any[];
  };
}

// POST /api/database/restore — restore from JSON backup
export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const backup = body as BackupData;

    if (!backup.data) {
      return NextResponse.json({ error: "Format backup tidak valid: data tidak ditemukan" }, { status: 400 });
    }

    const d = backup.data;

    // Validate minimum structure
    if (!Array.isArray(d.users) || !Array.isArray(d.santri)) {
      return NextResponse.json({ error: "Format backup tidak valid" }, { status: 400 });
    }

    // Wipe existing data (urutan: junction dulu)
    await db.pesanLog.deleteMany();
    await db.pesanTemplate.deleteMany();
    await db.pengaturan.deleteMany();
    await db.anggotaKelompok.deleteMany();
    await db.kelompokBelajar.deleteMany();
    await db.pembayaranSPP.deleteMany();
    await db.santri.deleteMany();
    await db.kelas.deleteMany();
    await db.ustaz.deleteMany();
    await db.user.deleteMany();

    // Restore (urutan: master dulu, junction terakhir)
    if (d.users?.length) await db.user.createMany({ data: d.users as any, skipDuplicates: true });
    if (d.ustaz?.length) await db.ustaz.createMany({ data: d.ustaz as any, skipDuplicates: true });
    if (d.kelas?.length) await db.kelas.createMany({ data: d.kelas as any, skipDuplicates: true });
    if (d.santri?.length) await db.santri.createMany({ data: d.santri as any, skipDuplicates: true });
    if (d.kelompokBelajar?.length) await db.kelompokBelajar.createMany({ data: d.kelompokBelajar as any, skipDuplicates: true });
    if (d.pembayaranSPP?.length) await db.pembayaranSPP.createMany({ data: d.pembayaranSPP as any, skipDuplicates: true });
    if (d.anggotaKelompok?.length) await db.anggotaKelompok.createMany({ data: d.anggotaKelompok as any, skipDuplicates: true });
    if (d.pengaturan?.length) await db.pengaturan.createMany({ data: d.pengaturan as any, skipDuplicates: true });
    if (d.pesanTemplate?.length) await db.pesanTemplate.createMany({ data: d.pesanTemplate as any, skipDuplicates: true });
    if (d.pesanLog?.length) await db.pesanLog.createMany({ data: d.pesanLog as any, skipDuplicates: true });

    return NextResponse.json({
      ok: true,
      message: "Restore berhasil",
      counts: {
        users: d.users?.length || 0,
        santri: d.santri?.length || 0,
        ustaz: d.ustaz?.length || 0,
        kelas: d.kelas?.length || 0,
        kelompokBelajar: d.kelompokBelajar?.length || 0,
        anggotaKelompok: d.anggotaKelompok?.length || 0,
        pembayaranSPP: d.pembayaranSPP?.length || 0,
      },
    });
  } catch (err) {
    console.error("[database restore POST]", err);
    return NextResponse.json(
      { error: "Gagal restore: " + String(err).slice(0, 200) },
      { status: 500 }
    );
  }
}
