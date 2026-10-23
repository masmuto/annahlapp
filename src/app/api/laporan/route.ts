import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMonthsRange, getShortMonth, formatRupiah } from "@/lib/format";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startBulan = searchParams.get("startBulan");
    const endBulan = searchParams.get("endBulan");
    const kelasId = searchParams.get("kelasId");

    if (!startBulan || !endBulan) {
      return NextResponse.json(
        { error: "startBulan dan endBulan wajib diisi" },
        { status: 400 }
      );
    }

    const months = getMonthsRange(startBulan, endBulan);

    // Get all santri (with optional kelas filter)
    const santriWhere: Record<string, unknown> = { status: "aktif" };
    if (kelasId && kelasId !== "all") santriWhere.kelasId = kelasId;

    const santriList = await db.santri.findMany({
      where: santriWhere,
      include: { kelas: true },
      orderBy: [{ nis: "asc" }],
    });

    // Get payments in range
    const payments = await db.pembayaranSPP.findMany({
      where: {
        bulan: { in: months },
        santri: santriWhere as never,
      },
    });

    // Build matrix: santri -> { bulan -> jumlah }
    const matrix = new Map<string, Record<string, number>>();
    for (const p of payments) {
      if (!matrix.has(p.santriId)) matrix.set(p.santriId, {});
      matrix.get(p.santriId)![p.bulan] = p.jumlah;
    }

    const rows = santriList.map((s) => {
      const row = matrix.get(s.id) || {};
      const paidMonths = months.filter((m) => row[m] !== undefined);
      const totalPaid = paidMonths.reduce((sum, m) => sum + row[m], 0);
      const totalExpected = s.sppBulanan * months.length;
      const tunggakan = Math.max(0, totalExpected - totalPaid);
      return {
        nis: s.nis,
        nama: s.nama,
        kelas: s.kelas?.nama || "-",
        sppBulanan: s.sppBulanan,
        months: months.map((m) => ({
          bulan: m,
          label: getShortMonth(m),
          jumlah: row[m] || 0,
          status: row[m] !== undefined ? "lunas" : "tunggakan",
        })),
        totalPaid,
        totalExpected,
        tunggakan,
        status: tunggakan > 0 ? "tunggakan" : "lunas",
      };
    });

    const summary = {
      totalSantri: rows.length,
      lunasCount: rows.filter((r) => r.status === "lunas").length,
      tunggakanCount: rows.filter((r) => r.status === "tunggakan").length,
      totalPaid: rows.reduce((s, r) => s + r.totalPaid, 0),
      totalExpected: rows.reduce((s, r) => s + r.totalExpected, 0),
      totalTunggakan: rows.reduce((s, r) => s + r.tunggakan, 0),
      months,
    };

    // CSV export
    if (searchParams.get("format") === "csv") {
      const header = [
        "NIS",
        "Nama",
        "Kelas",
        ...months.map((m) => getShortMonth(m)),
        "Total Dibayar",
        "Tunggakan",
        "Status",
      ];
      const csvLines = [header.join(",")];
      for (const r of rows) {
        csvLines.push(
          [
            r.nis,
            `"${r.nama}"`,
            `"${r.kelas}"`,
            ...r.months.map((m) => m.jumlah || ""),
            r.totalPaid,
            r.tunggakan,
            r.status,
          ].join(",")
        );
      }
      csvLines.push("");
      csvLines.push(
        `Summary,,,,,,${formatRupiah(summary.totalPaid)},${formatRupiah(
          summary.totalTunggakan
        )},`
      );

      const csv = csvLines.join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="laporan-spp-${startBulan}-${endBulan}.csv"`,
        },
      });
    }

    return NextResponse.json({ data: { rows, summary, months } });
  } catch (err) {
    console.error("[laporan GET]", err);
    return NextResponse.json({ error: "Gagal membuat laporan" }, { status: 500 });
  }
}
