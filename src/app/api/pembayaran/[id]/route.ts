import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const pembayaran = await db.pembayaranSPP.update({
      where: { id },
      data: {
        jumlah: body.jumlah ? Number(body.jumlah) : undefined,
        metodePembayaran: body.metodePembayaran,
        keterangan: body.keterangan ?? undefined,
        diterimaOleh: body.diterimaOleh ?? undefined,
        tanggalBayar: body.tanggalBayar ? new Date(body.tanggalBayar) : undefined,
        status: body.status,
      },
      include: { santri: { include: { kelas: true } } },
    });
    return NextResponse.json({ data: pembayaran });
  } catch (err) {
    console.error("[pembayaran PUT]", err);
    return NextResponse.json({ error: "Gagal mengupdate pembayaran" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.pembayaranSPP.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[pembayaran DELETE]", err);
    return NextResponse.json({ error: "Gagal menghapus pembayaran" }, { status: 500 });
  }
}
