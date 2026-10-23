import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { nama: { contains: q } },
        { nip: { contains: q } },
        { spesialisasi: { contains: q } },
      ];
    }
    if (status && status !== "all") where.status = status;

    const ustaz = await db.ustaz.findMany({
      where,
      include: { kelas: true },
      orderBy: [{ nama: "asc" }],
    });

    return NextResponse.json({ data: ustaz });
  } catch (err) {
    console.error("[ustaz GET]", err);
    return NextResponse.json({ error: "Gagal memuat data ustaz" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ustaz = await db.ustaz.create({
      data: {
        nip: body.nip?.trim() || null,
        nama: body.nama?.trim(),
        jenisKelamin: body.jenisKelamin || "L",
        tempatLahir: body.tempatLahir || null,
        tanggalLahir: body.tanggalLahir ? new Date(body.tanggalLahir) : null,
        alamat: body.alamat || null,
        noHp: body.noHp || null,
        email: body.email || null,
        spesialisasi: body.spesialisasi || null,
        tanggalMasuk: body.tanggalMasuk ? new Date(body.tanggalMasuk) : new Date(),
        status: body.status || "aktif",
        catatan: body.catatan || null,
      },
    });
    return NextResponse.json({ data: ustaz }, { status: 201 });
  } catch (err) {
    console.error("[ustaz POST]", err);
    return NextResponse.json({ error: "Gagal menambah ustaz" }, { status: 500 });
  }
}
