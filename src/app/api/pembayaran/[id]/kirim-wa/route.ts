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

// Render template dengan placeholder
function renderTemplate(
  isi: string,
  ctx: Record<string, string>
): string {
  let out = isi;
  for (const [k, v] of Object.entries(ctx)) {
    out = out.replaceAll(`{${k}}`, v);
  }
  return out;
}

// POST /api/pembayaran/[id]/kirim-wa
// Body: { useGateway?: boolean, overridePenerima?: string, overridePesan?: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(req);
  if (!session) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { useGateway, overridePenerima, overridePesan } = body ?? {};

    // Ambil data pembayaran lengkap dengan santri & kelas
    const pembayaran = await db.pembayaranSPP.findUnique({
      where: { id },
      include: { santri: { include: { kelas: true } } },
    });

    if (!pembayaran) {
      return NextResponse.json(
        { error: "Pembayaran tidak ditemukan" },
        { status: 404 }
      );
    }

    // Tentukan nomor penerima (HP ortu) — bisa di-override
    let penerima = (overridePenerima || pembayaran.santri.noHpOrtu || "").replace(/[^0-9]/g, "");
    if (!penerima || penerima.length < 10) {
      return NextResponse.json(
        {
          error:
            "Nomor WhatsApp orang tua tidak tersedia atau tidak valid. Lengkapi no. HP ortu di data santri.",
        },
        { status: 400 }
      );
    }

    // Normalize: 08xxx → 628xxx
    if (penerima.startsWith("0")) {
      penerima = "62" + penerima.substring(1);
    } else if (penerima.startsWith("8")) {
      penerima = "62" + penerima;
    }

    const namaOrtu = pembayaran.santri.namaAyah || `Ortu ${pembayaran.santri.nama}`;

    // Ambil pengaturan
    const pengaturanList = await db.pengaturan.findMany();
    const settings: Record<string, string> = {};
    pengaturanList.forEach((p) => (settings[p.key] = p.value));

    const waEnabled = settings.wa_enabled !== "false";
    if (!waEnabled) {
      return NextResponse.json(
        { error: "WhatsApp dinonaktifkan di pengaturan." },
        { status: 400 }
      );
    }

    // Cari template "bukti_pembayaran"
    const template = await db.pesanTemplate.findUnique({
      where: { kode: "bukti_pembayaran" },
    });

    const templateIsi = template?.isi || `Assalamu'alaikum Wr. Wb.

Yth. {nama_ortu}

Kami informasikan bahwa pembayaran SPP putra/putri Bapak/Ibu telah kami terima dengan rincian:

Nama Santri: {nama}
NIS: {nis}
Kelas: {kelas}
Bulan: {bulan}
Jumlah: {jumlah}
No. Pembayaran: {noPembayaran}
Tanggal: {tanggal}

Jazakumullah khairan katsira.

Wassalamu'alaikum Wr. Wb.
{lembaga}`;

    // Konteks placeholder
    const ctx: Record<string, string> = {
      nama: pembayaran.santri.nama,
      nis: pembayaran.santri.nis,
      kelas: pembayaran.santri.kelas?.nama || "-",
      bulan: getMonthLabel(pembayaran.bulan),
      jumlah: formatRupiah(pembayaran.jumlah),
      noPembayaran: pembayaran.noPembayaran,
      tanggal: new Date(pembayaran.tanggalBayar).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      nama_ortu: namaOrtu,
      lembaga: settings.app_lembaga || "Rumah Tahfidz An Nahl",
      hari: "",
      jam: "",
      ustaz: "",
      ruangan: "",
      pesan: "",
    };

    const finalPesan = overridePesan || renderTemplate(templateIsi, ctx);

    // Tentukan mode kirim
    const useGatewayMode = useGateway === true || settings.wa_use_gateway === "true";
    const apiUrl = settings.wa_api_url || "";
    const apiToken = settings.wa_api_token || "";

    // === MODE GATEWAY ===
    if (useGatewayMode) {
      if (!apiUrl || !apiToken) {
        return NextResponse.json(
          {
            error:
              "Mode Gateway dipilih tapi API URL/Token belum diisi. Atur di Pengaturan → WhatsApp, atau gunakan mode Manual.",
          },
          { status: 400 }
        );
      }

      try {
        const gatewayPayload: Record<string, unknown> = {
          target: penerima,
          message: finalPesan,
          countryCode: "62",
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const gatewayRes = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: apiToken,
          },
          body: JSON.stringify(gatewayPayload),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const durationMs = Date.now() - startTime;
        let gatewayData: unknown = null;
        const contentType = gatewayRes.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          gatewayData = await gatewayRes.json();
        } else {
          gatewayData = await gatewayRes.text();
        }

        // Simpan log
        await db.pesanLog.create({
          data: {
            penerima,
            namaPenerima: namaOrtu,
            pesan: finalPesan,
            kategori: "pembayaran",
            status: gatewayRes.ok ? "terkirim" : "gagal",
            error: gatewayRes.ok
              ? null
              : `HTTP ${gatewayRes.status}: ${gatewayRes.statusText}`,
            userId: session.id,
          },
        });

        return NextResponse.json({
          data: {
            success: gatewayRes.ok,
            mode: "gateway",
            penerima,
            namaPenerima: namaOrtu,
            pesan: finalPesan,
            gatewayResponse: gatewayData,
            durationMs,
            timestamp: new Date().toISOString(),
            error: gatewayRes.ok
              ? undefined
              : `HTTP ${gatewayRes.status}: ${gatewayRes.statusText}`,
          },
        });
      } catch (err) {
        const durationMs = Date.now() - startTime;
        const errMsg = err instanceof Error ? err.message : String(err);
        const isTimeout = errMsg.includes("aborted");

        await db.pesanLog.create({
          data: {
            penerima,
            namaPenerima: namaOrtu,
            pesan: finalPesan,
            kategori: "pembayaran",
            status: "gagal",
            error: isTimeout
              ? "Timeout: Gateway tidak merespons dalam 15 detik."
              : `Gateway error: ${errMsg}`,
            userId: session.id,
          },
        });

        return NextResponse.json({
          data: {
            success: false,
            mode: "gateway",
            penerima,
            namaPenerima: namaOrtu,
            pesan: finalPesan,
            durationMs,
            timestamp: new Date().toISOString(),
            error: isTimeout
              ? "Timeout: Gateway tidak merespons dalam 15 detik."
              : `Gateway error: ${errMsg}`,
          },
        });
      }
    }

    // === MODE MANUAL (wa.me) ===
    const waUrl = `https://wa.me/${penerima}?text=${encodeURIComponent(finalPesan)}`;
    const durationMs = Date.now() - startTime;

    await db.pesanLog.create({
      data: {
        penerima,
        namaPenerima: namaOrtu,
        pesan: finalPesan,
        kategori: "pembayaran",
        status: "terkirim",
        userId: session.id,
      },
    });

    return NextResponse.json({
      data: {
        success: true,
        mode: "manual",
        penerima,
        namaPenerima: namaOrtu,
        pesan: finalPesan,
        waUrl,
        durationMs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[kirim-wa POST]", err);
    return NextResponse.json(
      { error: "Gagal kirim WA: " + String(err).slice(0, 200) },
      { status: 500 }
    );
  }
}
