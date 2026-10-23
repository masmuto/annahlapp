import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// PUT: update jadwal
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; jadwalId: string }> }
) {
  try {
    const { id, jadwalId } = await params;
    const body = await req.json();
    const { hari, jamMulai, jamSelesai } = body ?? {};

    const data: Record<string, unknown> = {};
    if (hari) data.hari = hari;
    if (jamMulai) data.jamMulai = jamMulai;
    if (jamSelesai) data.jamSelesai = jamSelesai;

    const jadwal = await db.jadwalKelompok.update({
      where: { id: jadwalId, kelompokId: id },
      data,
    });
    return NextResponse.json({ data: jadwal });
  } catch (err) {
    console.error("[jadwal PUT]", err);
    return NextResponse.json({ error: "Gagal update jadwal" }, { status: 500 });
  }
}

// DELETE: hapus jadwal
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; jadwalId: string }> }
) {
  try {
    const { id, jadwalId } = await params;
    await db.jadwalKelompok.delete({
      where: { id: jadwalId, kelompokId: id },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[jadwal DELETE]", err);
    return NextResponse.json({ error: "Gagal menghapus jadwal" }, { status: 500 });
  }
}
