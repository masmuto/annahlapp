import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentYearMonth, getMonthsRange, getShortMonth } from "@/lib/format";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bulan = searchParams.get("bulan") || getCurrentYearMonth();

    const [totalSantri, totalUstaz, totalKelas, santriAktif] = await Promise.all([
      db.santri.count(),
      db.ustaz.count({ where: { status: "aktif" } }),
      db.kelas.count(),
      db.santri.count({ where: { status: "aktif" } }),
    ]);

    // Total SPP income for the selected month
    const sppThisMonth = await db.pembayaranSPP.aggregate({
      _sum: { jumlah: true },
      where: { bulan },
    });

    // SPP income trend (last 6 months)
    const [y, m] = bulan.split("-").map(Number);
    const startMonthDate = new Date(y, m - 7, 1);
    const startYM = `${startMonthDate.getFullYear()}-${String(
      startMonthDate.getMonth() + 1
    ).padStart(2, "0")}`;
    const monthRange = getMonthsRange(startYM, bulan);

    const paymentsByMonth = await db.pembayaranSPP.groupBy({
      by: ["bulan"],
      where: { bulan: { in: monthRange } },
      _sum: { jumlah: true },
      _count: true,
    });

    const trend = monthRange.map((ym) => {
      const found = paymentsByMonth.find((p) => p.bulan === ym);
      return {
        bulan: ym,
        label: getShortMonth(ym),
        total: found?._sum.jumlah || 0,
        count: found?._count || 0,
      };
    });

    // SPP collection rate for this month
    const santriAktifList = await db.santri.findMany({
      where: { status: "aktif" },
      select: { id: true, sppBulanan: true },
    });
    const expectedTotal = santriAktifList.reduce((s, x) => s + x.sppBulanan, 0);
    const paidThisMonth = await db.pembayaranSPP.findMany({
      where: { bulan },
      select: { santriId: true },
    });
    const paidCount = new Set(paidThisMonth.map((p) => p.santriId)).size;
    const collectionRate =
      santriAktifList.length > 0
        ? Math.round((paidCount / santriAktifList.length) * 100)
        : 0;

    // Kelas distribution
    const kelasDistribusi = await db.kelas.findMany({
      include: { _count: { select: { santri: true } } },
      orderBy: { nama: "asc" },
    });
    const kelasStats = kelasDistribusi.map((k) => ({
      nama: k.nama,
      jumlah: k._count.santri,
    }));

    // Recent payments
    const recent = await db.pembayaranSPP.findMany({
      take: 5,
      orderBy: { tanggalBayar: "desc" },
      include: { santri: true },
    });

    // Tunggakan list (santri aktif yang belum bayar bulan ini)
    const paidSantriIds = new Set(paidThisMonth.map((p) => p.santriId));
    const tunggakanSantri = santriAktifList.filter(
      (s) => !paidSantriIds.has(s.id)
    );
    const tunggakanDetails = await Promise.all(
      tunggakanSantri.slice(0, 10).map(async (s) => {
        const detail = await db.santri.findUnique({
          where: { id: s.id },
          include: { kelas: true },
        });
        return detail;
      })
    ).then((res) => res.filter(Boolean));

    return NextResponse.json({
      data: {
        totals: {
          santri: totalSantri,
          santriAktif,
          ustaz: totalUstaz,
          kelas: totalKelas,
          sppThisMonth: sppThisMonth._sum.jumlah || 0,
          expectedThisMonth: expectedTotal,
          collectionRate,
          paidCount,
          unpaidCount: santriAktifList.length - paidCount,
        },
        trend,
        kelasStats,
        recent,
        tunggakan: tunggakanDetails,
        bulan,
      },
    });
  } catch (err) {
    console.error("[dashboard GET]", err);
    return NextResponse.json({ error: "Gagal memuat dashboard" }, { status: 500 });
  }
}
