import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const HARI_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];

// GET: list semua jadwal untuk kelompok
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jadwal = await db.jadwalKelompok.findMany({
      where: { kelompokId: id },
      orderBy: [{ hari: "asc" }, { jamMulai: "asc" }],
    });

    const sorted = [...jadwal].sort(
      (a, b) =>
        HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari) ||
        a.jamMulai.localeCompare(b.jamMulai)
    );

    return NextResponse.json({ data: sorted });
  } catch (err) {
    console.error("[jadwal GET]", err);
    return NextResponse.json({ error: "Gagal memuat jadwal" }, { status: 500 });
  }
}

// POST: tambah jadwal baru ke kelompok
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { hari, jamMulai, jamSelesai } = body ?? {};

    if (!hari || !jamMulai || !jamSelesai) {
      return NextResponse.json(
        { error: "Hari, jam mulai, dan jam selesai wajib diisi" },
        { status: 400 }
      );
    }

    // Cek kelompok exists
    const kelompok = await db.kelompokBelajar.findUnique({ where: { id } });
    if (!kelompok) {
      return NextResponse.json({ error: "Kelompok tidak ditemukan" }, { status: 404 });
    }

    // Cek duplikasi (hari + jamMulai)
    const existing = await db.jadwalKelompok.findUnique({
      where: {
        kelompokId_hari_jamMulai: { kelompokId: id, hari, jamMulai },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Jadwal ${hari} ${jamMulai} sudah ada di kelompok ini` },
        { status: 400 }
      );
    }

    const jadwal = await db.jadwalKelompok.create({
      data: {
        kelompokId: id,
        hari,
        jamMulai,
        jamSelesai,
      },
    });

    return NextResponse.json({ data: jadwal }, { status: 201 });
  } catch (err) {
    console.error("[jadwal POST]", err);
    return NextResponse.json({ error: "Gagal menambah jadwal" }, { status: 500 });
  }
}
