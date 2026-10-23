import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// POST: tambah santri ke kelompok
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { santriId, catatan } = body ?? {};

    if (!santriId) {
      return NextResponse.json({ error: "santriId wajib diisi" }, { status: 400 });
    }

    // Check kelompok exists and capacity
    const kelompok = await db.kelompokBelajar.findUnique({
      where: { id },
      include: { _count: { select: { anggota: true } } },
    });
    if (!kelompok) {
      return NextResponse.json({ error: "Kelompok tidak ditemukan" }, { status: 404 });
    }
    if (kelompok._count.anggota >= kelompok.kapasitas) {
      return NextResponse.json(
        { error: `Kapasitas kelompok penuh (maks ${kelompok.kapasitas} santri)` },
        { status: 400 }
      );
    }

    // Check if already a member
    const existing = await db.anggotaKelompok.findUnique({
      where: { kelompokId_santriId: { kelompokId: id, santriId } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Santri sudah terdaftar di kelompok ini" },
        { status: 400 }
      );
    }

    // Check santri exists
    const santri = await db.santri.findUnique({ where: { id: santriId } });
    if (!santri) {
      return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 });
    }

    const anggota = await db.anggotaKelompok.create({
      data: {
        kelompokId: id,
        santriId,
        catatan: catatan || null,
      },
      include: {
        santri: { include: { kelas: true } },
      },
    });

    return NextResponse.json({ data: anggota }, { status: 201 });
  } catch (err) {
    console.error("[anggota POST]", err);
    return NextResponse.json({ error: "Gagal menambah anggota" }, { status: 500 });
  }
}

// GET: daftar anggota kelompok
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const anggota = await db.anggotaKelompok.findMany({
      where: { kelompokId: id },
      include: {
        santri: { include: { kelas: true } },
      },
      orderBy: { tanggalBergabung: "asc" },
    });
    return NextResponse.json({ data: anggota });
  } catch (err) {
    console.error("[anggota GET]", err);
    return NextResponse.json({ error: "Gagal memuat anggota" }, { status: 500 });
  }
}
