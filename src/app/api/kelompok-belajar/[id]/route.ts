import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const HARI_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const kelompok = await db.kelompokBelajar.findUnique({
      where: { id },
      include: {
        ustaz: true,
        jadwal: {
          orderBy: [{ hari: "asc" }, { jamMulai: "asc" }],
        },
        anggota: {
          include: {
            santri: { include: { kelas: true } },
          },
          orderBy: { tanggalBergabung: "asc" },
        },
      },
    });
    if (!kelompok) {
      return NextResponse.json({ error: "Kelompok belajar tidak ditemukan" }, { status: 404 });
    }

    // Sort jadwal by hari
    const sorted = {
      ...kelompok,
      jadwal: [...kelompok.jadwal].sort(
        (a, b) =>
          HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari) ||
          a.jamMulai.localeCompare(b.jamMulai)
      ),
    };

    return NextResponse.json({ data: sorted });
  } catch (err) {
    console.error("[kelompok-belajar GET id]", err);
    return NextResponse.json({ error: "Gagal memuat kelompok belajar" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const kelompok = await db.kelompokBelajar.update({
      where: { id },
      data: {
        nama: body.nama?.trim(),
        ustazId: body.ustazId || null,
        mataPelajaran: body.mataPelajaran,
        ruangan: body.ruangan || null,
        kapasitas: Number(body.kapasitas) || 15,
        catatan: body.catatan || null,
        status: body.status,
      },
      include: {
        ustaz: true,
        jadwal: true,
        _count: { select: { anggota: true } },
      },
    });
    return NextResponse.json({ data: kelompok });
  } catch (err) {
    console.error("[kelompok-belajar PUT]", err);
    return NextResponse.json({ error: "Gagal mengupdate kelompok belajar" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.kelompokBelajar.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[kelompok-belajar DELETE]", err);
    return NextResponse.json({ error: "Gagal menghapus kelompok belajar" }, { status: 500 });
  }
}
