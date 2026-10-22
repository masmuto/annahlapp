import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateNIS } from "@/lib/format";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const kelasId = searchParams.get("kelasId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { nama: { contains: q } },
        { nis: { contains: q } },
        { namaAyah: { contains: q } },
      ];
    }
    if (kelasId && kelasId !== "all") where.kelasId = kelasId;
    if (status && status !== "all") where.status = status;

    const santri = await db.santri.findMany({
      where,
      include: { kelas: true },
      orderBy: [{ nis: "asc" }],
    });

    return NextResponse.json({ data: santri });
  } catch (err) {
    console.error("[santri GET]", err);
    return NextResponse.json(
      { error: "Gagal memuat data santri" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Generate NIS automatically if not provided
    let nis = body.nis?.trim();
    if (!nis) {
      const year = body.tanggalMasuk
        ? new Date(body.tanggalMasuk).getFullYear()
        : new Date().getFullYear();
      const count = await db.santri.count();
      nis = generateNIS(count + 1, year);
    }

    const santri = await db.santri.create({
      data: {
        nis,
        nama: body.nama?.trim(),
        jenisKelamin: body.jenisKelamin || "L",
        tempatLahir: body.tempatLahir || null,
        tanggalLahir: body.tanggalLahir
          ? new Date(body.tanggalLahir)
          : null,
        alamat: body.alamat || null,
        namaAyah: body.namaAyah || null,
        namaIbu: body.namaIbu || null,
        noHpOrtu: body.noHpOrtu || null,
        kelasId: body.kelasId || null,
        tanggalMasuk: body.tanggalMasuk
          ? new Date(body.tanggalMasuk)
          : new Date(),
        status: body.status || "aktif",
        catatan: body.catatan || null,
        sppBulanan: Number(body.sppBulanan) || 150000,
      },
      include: { kelas: true },
    });

    return NextResponse.json({ data: santri }, { status: 201 });
  } catch (err) {
    console.error("[santri POST]", err);
    return NextResponse.json(
      { error: "Gagal menambahkan santri" },
      { status: 500 }
    );
  }
}
