import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateNoPembayaran, getCurrentYearMonth } from "@/lib/format";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bulan = searchParams.get("bulan");
    const santriId = searchParams.get("santriId");
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.trim();

    const where: Record<string, unknown> = {};
    if (bulan) where.bulan = bulan;
    if (santriId) where.santriId = santriId;
    if (status) where.status = status;
    if (q) {
      where.santri = {
        OR: [
          { nama: { contains: q } },
          { nis: { contains: q } },
        ],
      };
    }

    const pembayaran = await db.pembayaranSPP.findMany({
      where,
      include: { santri: { include: { kelas: true } } },
      orderBy: [{ tanggalBayar: "desc" }],
    });

    return NextResponse.json({ data: pembayaran });
  } catch (err) {
    console.error("[pembayaran GET]", err);
    return NextResponse.json({ error: "Gagal memuat pembayaran" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { santriId, bulan, jumlah, metodePembayaran, keterangan, diterimaOleh } = body ?? {};

    if (!santriId || !bulan || !jumlah) {
      return NextResponse.json(
        { error: "Santri, bulan, dan jumlah wajib diisi" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await db.pembayaranSPP.findUnique({
      where: { santriId_bulan: { santriId, bulan } },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Pembayaran SPP untuk ${bulan} sudah ada` },
        { status: 400 }
      );
    }

    // Generate no pembayaran
    const count = await db.pembayaranSPP.count();
    const noPembayaran = generateNoPembayaran(count + 1);

    const pembayaran = await db.pembayaranSPP.create({
      data: {
        noPembayaran,
        santriId,
        bulan,
        jumlah: Number(jumlah),
        metodePembayaran: metodePembayaran || "tunai",
        status: "lunas",
        keterangan: keterangan || null,
        diterimaOleh: diterimaOleh || null,
        tanggalBayar: body.tanggalBayar ? new Date(body.tanggalBayar) : new Date(),
      },
      include: { santri: { include: { kelas: true } } },
    });

    return NextResponse.json({ data: pembayaran }, { status: 201 });
  } catch (err) {
    console.error("[pembayaran POST]", err);
    return NextResponse.json({ error: "Gagal membuat pembayaran" }, { status: 500 });
  }
}
