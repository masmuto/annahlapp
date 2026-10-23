import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const HARI_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hari = searchParams.get("hari");
    const ustazId = searchParams.get("ustazId");
    const mataPelajaran = searchParams.get("mataPelajaran");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (ustazId) where.ustazId = ustazId;
    if (mataPelajaran) where.mataPelajaran = mataPelajaran;
    if (status && status !== "all") where.status = status;
    // Filter by hari membutuhkan relasi jadwal
    if (hari) {
      where.jadwal = { some: { hari } };
    }

    const kelompok = await db.kelompokBelajar.findMany({
      where,
      include: {
        ustaz: true,
        jadwal: true,
        _count: { select: { anggota: true } },
      },
      orderBy: [{ nama: "asc" }],
    });

    // Sort jadwal per kelompok by hari
    const withSortedJadwal = kelompok.map((k) => ({
      ...k,
      jadwal: [...k.jadwal].sort(
        (a, b) =>
          HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari) ||
          a.jamMulai.localeCompare(b.jamMulai)
      ),
    }));

    return NextResponse.json({ data: withSortedJadwal });
  } catch (err) {
    console.error("[kelompok-belajar GET]", err);
    return NextResponse.json({ error: "Gagal memuat kelompok belajar" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const kelompok = await db.kelompokBelajar.create({
      data: {
        nama: body.nama?.trim(),
        ustazId: body.ustazId || null,
        mataPelajaran: body.mataPelajaran,
        ruangan: body.ruangan || null,
        kapasitas: Number(body.kapasitas) || 15,
        catatan: body.catatan || null,
        status: body.status || "aktif",
      },
      include: {
        ustaz: true,
        jadwal: true,
        _count: { select: { anggota: true } },
      },
    });

    // Jika body.jadwalList diberikan (array of {hari, jamMulai, jamSelesai}),
    // buat jadwal otomatis
    if (Array.isArray(body.jadwalList) && body.jadwalList.length > 0) {
      await db.jadwalKelompok.createMany({
        data: body.jadwalList.map((j: { hari: string; jamMulai: string; jamSelesai: string }) => ({
          kelompokId: kelompok.id,
          hari: j.hari,
          jamMulai: j.jamMulai,
          jamSelesai: j.jamSelesai,
        })),
        skipDuplicates: true,
      });
    }

    // Re-fetch with jadwal
    const withJadwal = await db.kelompokBelajar.findUnique({
      where: { id: kelompok.id },
      include: { ustaz: true, jadwal: true, _count: { select: { anggota: true } } },
    });

    return NextResponse.json({ data: withJadwal }, { status: 201 });
  } catch (err) {
    console.error("[kelompok-belajar POST]", err);
    return NextResponse.json({ error: "Gagal menambah kelompok belajar" }, { status: 500 });
  }
}
