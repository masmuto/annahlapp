import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const santri = await db.santri.findUnique({
      where: { id },
      include: {
        kelas: true,
        pembayaran: { orderBy: { bulan: "desc" } },
      },
    });
    if (!santri) {
      return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ data: santri });
  } catch (err) {
    console.error("[santri GET id]", err);
    return NextResponse.json({ error: "Gagal memuat santri" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const santri = await db.santri.update({
      where: { id },
      data: {
        nama: body.nama?.trim(),
        jenisKelamin: body.jenisKelamin,
        tempatLahir: body.tempatLahir || null,
        tanggalLahir: body.tanggalLahir ? new Date(body.tanggalLahir) : null,
        alamat: body.alamat || null,
        namaAyah: body.namaAyah || null,
        namaIbu: body.namaIbu || null,
        noHpOrtu: body.noHpOrtu || null,
        kelasId: body.kelasId || null,
        status: body.status,
        catatan: body.catatan || null,
        sppBulanan: Number(body.sppBulanan) || 150000,
      },
      include: { kelas: true },
    });
    return NextResponse.json({ data: santri });
  } catch (err) {
    console.error("[santri PUT]", err);
    return NextResponse.json({ error: "Gagal mengupdate santri" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.santri.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[santri DELETE]", err);
    return NextResponse.json({ error: "Gagal menghapus santri" }, { status: 500 });
  }
}
