import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decodeToken } from "@/lib/auth";
import { getMonthLabel, formatRupiah } from "@/lib/format";

export const runtime = "nodejs";

async function requireAuth(req: NextRequest) {
  const token = req.cookies.get("an_nahl_session_token")?.value;
  if (!token) return null;
  return decodeToken(token);
}

// Replace placeholders in template: {nama}, {nis}, {bulan}, {jumlah}, {noPembayaran}, {lembaga}
function renderTemplate(
  isi: string,
  ctx: Record<string, string | number>
): string {
  let out = isi;
  for (const [k, v] of Object.entries(ctx)) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

// GET: list log
export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
    const kategori = searchParams.get("kategori");
    const where: Record<string, unknown> = {};
    if (kategori && kategori !== "all") where.kategori = kategori;

    const logs = await db.pesanLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ data: logs });
  } catch (err) {
    console.error("[pesan-log GET]", err);
    return NextResponse.json({ error: "Gagal memuat log" }, { status: 500 });
  }
}

// POST: kirim pesan WA (atau simpan sebagai log + buka wa.me)
export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { penerima, namaPenerima, pesan, kategori, pembayaranId, templateKode } = body ?? {};

    let finalPesan = pesan || "";
    let finalPenerima = (penerima || "").replace(/[^0-9]/g, "");
    let finalNama = namaPenerima || "";

    // Jika ada pembayaranId, ambil konteks dari pembayaran
    if (pembayaranId) {
      const pemb = await db.pembayaranSPP.findUnique({
        where: { id: pembayaranId },
        include: { santri: { include: { kelas: true } } },
      });
      if (!pemb) {
        return NextResponse.json({ error: "Pembayaran tidak ditemukan" }, { status: 404 });
      }
      finalPenerima = (pemb.santri.noHpOrtu || "").replace(/[^0-9]/g, "");
      finalNama = pemb.santri.namaAyah || `Ortu ${pemb.santri.nama}`;

      // Cari template jika ada
      let templateIsi = "";
      if (templateKode) {
        const tpl = await db.pesanTemplate.findUnique({ where: { kode: templateKode } });
        if (tpl) templateIsi = tpl.isi;
      }
      if (!templateIsi) {
        // Default template untuk bukti pembayaran
        templateIsi = `Assalamu'alaikum Wr. Wb.

Yth. {nama_ortu}

Kami informasikan bahwa pembayaran SPP putra/putri Bapak/Ibu telah kami terima dengan rincian:

Nama Santri: {nama}
NIS: {nis}
Bulan: {bulan}
Jumlah: {jumlah}
No. Pembayaran: {noPembayaran}
Tanggal: {tanggal}

Jazakumullah khairan katsira.

Wassalamu'alaikum Wr. Wb.
Rumah Tahfidz An Nahl`;
      }

      finalPesan = renderTemplate(templateIsi, {
        nama: pemb.santri.nama,
        nis: pemb.santri.nis,
        bulan: getMonthLabel(pemb.bulan),
        jumlah: formatRupiah(pemb.jumlah),
        noPembayaran: pemb.noPembayaran,
        tanggal: new Date(pemb.tanggalBayar).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        nama_ortu: finalNama,
        kelas: pemb.santri.kelas?.nama || "-",
        lembaga: "Rumah Tahfidz An Nahl",
      });
    }

    if (!finalPenerima || finalPenerima.length < 10) {
      return NextResponse.json(
        { error: "Nomor WhatsApp tidak valid atau belum diisi" },
        { status: 400 }
      );
    }

    // Convert 08xxx → 628xxx
    if (finalPenerima.startsWith("0")) {
      finalPenerima = "62" + finalPenerima.substring(1);
    } else if (finalPenerima.startsWith("8")) {
      finalPenerima = "62" + finalPenerima;
    }

    // Generate wa.me URL
    const waUrl = `https://wa.me/${finalPenerima}?text=${encodeURIComponent(finalPesan)}`;

    // Simpan ke log
    const log = await db.pesanLog.create({
      data: {
        penerima: finalPenerima,
        namaPenerima: finalNama,
        pesan: finalPesan,
        kategori: kategori || (pembayaranId ? "pembayaran" : "manual"),
        status: "terkirim",
        userId: session.id,
      },
    });

    return NextResponse.json({
      data: log,
      waUrl,
      penerima: finalPenerima,
      pesan: finalPesan,
    });
  } catch (err) {
    console.error("[pesan-log POST]", err);
    return NextResponse.json({ error: "Gagal mengirim pesan" }, { status: 500 });
  }
}
