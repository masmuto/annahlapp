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

// POST /api/database/reset — hapus SEMUA data (kecuali user yang sedang login)
// Query: ?keepUsers=true untuk tetap menyimpan akun user
export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  try {
    const url = new URL(req.url);
    const keepUsers = url.searchParams.get("keepUsers") === "true";

    // Hapus semua data transaksional
    await db.pesanLog.deleteMany();
    await db.pesanTemplate.deleteMany();
    await db.pengaturan.deleteMany();
    await db.anggotaKelompok.deleteMany();
    await db.kelompokBelajar.deleteMany();
    await db.pembayaranSPP.deleteMany();
    await db.santri.deleteMany();
    await db.kelas.deleteMany();
    await db.ustaz.deleteMany();

    if (!keepUsers) {
      // Hapus semua user kecuali user yang sedang login
      await db.user.deleteMany({
        where: { NOT: { id: session.id } },
      });
    }

    return NextResponse.json({
      ok: true,
      message: keepUsers
        ? "Database direset. Data user dipertahankan."
        : "Database direset sepenuhnya. Silakan login ulang.",
    });
  } catch (err) {
    console.error("[database reset POST]", err);
    return NextResponse.json({ error: "Gagal reset database" }, { status: 500 });
  }
}
