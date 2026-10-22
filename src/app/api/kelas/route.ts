import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const kelas = await db.kelas.findMany({
      include: {
        _count: { select: { santri: true, jadwal: true } },
        ustaz: true,
      },
      orderBy: [{ nama: "asc" }],
    });
    return NextResponse.json({ data: kelas });
  } catch (err) {
    console.error("[kelas GET]", err);
    return NextResponse.json({ error: "Gagal memuat kelas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const kelas = await db.kelas.create({
      data: {
        nama: body.nama?.trim(),
        tingkat: body.tingkat || "Umum",
        ustazId: body.ustazId || null,
        kapasitas: Number(body.kapasitas) || 20,
        keterangan: body.keterangan || null,
      },
      include: { ustaz: true, _count: { select: { santri: true } } },
    });
    return NextResponse.json({ data: kelas }, { status: 201 });
  } catch (err) {
    console.error("[kelas POST]", err);
    return NextResponse.json({ error: "Gagal menambah kelas" }, { status: 500 });
  }
}
