import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ustaz = await db.ustaz.findUnique({
      where: { id },
      include: { kelas: true, jadwal: { include: { kelas: true } } },
    });
    if (!ustaz) {
      return NextResponse.json({ error: "Ustaz tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ data: ustaz });
  } catch (err) {
    console.error("[ustaz GET id]", err);
    return NextResponse.json({ error: "Gagal memuat ustaz" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const ustaz = await db.ustaz.update({
      where: { id },
      data: {
        nip: body.nip?.trim() || null,
        nama: body.nama?.trim(),
        jenisKelamin: body.jenisKelamin,
        tempatLahir: body.tempatLahir || null,
        tanggalLahir: body.tanggalLahir ? new Date(body.tanggalLahir) : null,
        alamat: body.alamat || null,
        noHp: body.noHp || null,
        email: body.email || null,
        spesialisasi: body.spesialisasi || null,
        status: body.status,
        catatan: body.catatan || null,
      },
    });
    return NextResponse.json({ data: ustaz });
  } catch (err) {
    console.error("[ustaz PUT]", err);
    return NextResponse.json({ error: "Gagal mengupdate ustaz" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.ustaz.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ustaz DELETE]", err);
    return NextResponse.json({ error: "Gagal menghapus ustaz" }, { status: 500 });
  }
}
