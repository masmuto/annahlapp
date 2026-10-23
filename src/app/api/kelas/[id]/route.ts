import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const kelas = await db.kelas.findUnique({
      where: { id },
      include: {
        ustaz: true,
        santri: { orderBy: [{ nis: "asc" }] },
      },
    });
    if (!kelas) {
      return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ data: kelas });
  } catch (err) {
    console.error("[kelas GET id]", err);
    return NextResponse.json({ error: "Gagal memuat kelas" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const kelas = await db.kelas.update({
      where: { id },
      data: {
        nama: body.nama?.trim(),
        tingkat: body.tingkat,
        ustazId: body.ustazId || null,
        kapasitas: Number(body.kapasitas) || 20,
        keterangan: body.keterangan || null,
      },
      include: { ustaz: true },
    });
    return NextResponse.json({ data: kelas });
  } catch (err) {
    console.error("[kelas PUT]", err);
    return NextResponse.json({ error: "Gagal mengupdate kelas" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.kelas.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[kelas DELETE]", err);
    return NextResponse.json({ error: "Gagal menghapus kelas" }, { status: 500 });
  }
}
