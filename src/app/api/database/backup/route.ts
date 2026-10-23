import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decodeToken } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("an_nahl_session_token")?.value;
  if (!token) return null;
  const s = decodeToken(token);
  if (!s || s.role !== "admin") return null;
  return s;
}

// GET /api/database/backup — download JSON backup
export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  try {
    const [
      users, santri, ustaz, kelas, kelompokBelajar,
      anggotaKelompok, pembayaranSPP, pengaturan, pesanTemplate, pesanLog,
    ] = await Promise.all([
      db.user.findMany(),
      db.santri.findMany(),
      db.ustaz.findMany(),
      db.kelas.findMany(),
      db.kelompokBelajar.findMany(),
      db.anggotaKelompok.findMany(),
      db.pembayaranSPP.findMany(),
      db.pengaturan.findMany(),
      db.pesanTemplate.findMany(),
      db.pesanLog.findMany(),
    ]);

    const backup = {
      _meta: {
        app: "GO An Nahl",
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        exportedBy: session.name,
        counts: {
          users: users.length,
          santri: santri.length,
          ustaz: ustaz.length,
          kelas: kelas.length,
          kelompokBelajar: kelompokBelajar.length,
          anggotaKelompok: anggotaKelompok.length,
          pembayaranSPP: pembayaranSPP.length,
          pengaturan: pengaturan.length,
          pesanTemplate: pesanTemplate.length,
          pesanLog: pesanLog.length,
        },
      },
      data: {
        users,
        santri,
        ustaz,
        kelas,
        kelompokBelajar,
        anggotaKelompok,
        pembayaranSPP,
        pengaturan,
        pesanTemplate,
        pesanLog,
      },
    };

    const json = JSON.stringify(backup, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `an-nahl-backup-${timestamp}.json`;

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[database backup GET]", err);
    return NextResponse.json({ error: "Gagal backup database" }, { status: 500 });
  }
}
