import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decodeToken } from "@/lib/auth";

export const runtime = "nodejs";

async function requireAuth(req: NextRequest) {
  const token = req.cookies.get("an_nahl_session_token")?.value;
  if (!token) return null;
  return decodeToken(token);
}

interface TestResult {
  success: boolean;
  mode: "manual" | "gateway";
  penerima: string;
  namaPenerima: string;
  pesan: string;
  waUrl?: string;
  gatewayResponse?: unknown;
  error?: string;
  durationMs: number;
  timestamp: string;
}

// POST /api/pesan-log/test — test kirim WA
export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { penerima, namaPenerima, pesan, useGateway } = body ?? {};

    if (!penerima || !pesan) {
      return NextResponse.json(
        { error: "Nomor penerima dan pesan wajib diisi" },
        { status: 400 }
      );
    }

    // Normalize nomor: hapus non-digit, convert 08xxx → 628xxx
    let normalized = String(penerima).replace(/[^0-9]/g, "");
    if (normalized.startsWith("0")) {
      normalized = "62" + normalized.substring(1);
    } else if (normalized.startsWith("8")) {
      normalized = "62" + normalized;
    } else if (!normalized.startsWith("62") && normalized.length >= 10) {
      // assume already includes country code
    }

    if (normalized.length < 10) {
      return NextResponse.json(
        { error: "Nomor WhatsApp tidak valid (minimal 10 digit)" },
        { status: 400 }
      );
    }

    const finalNama = namaPenerima || "Penerima Test";
    const finalPesan = String(pesan);

    // Ambil pengaturan WhatsApp
    const pengaturan = await db.pengaturan.findMany();
    const settings: Record<string, string> = {};
    pengaturan.forEach((p) => (settings[p.key] = p.value));

    const waEnabled = settings.wa_enabled !== "false";
    const useGatewayMode = useGateway === true || settings.wa_use_gateway === "true";
    const apiUrl = settings.wa_api_url || "";
    const apiToken = settings.wa_api_token || "";

    if (!waEnabled) {
      return NextResponse.json(
        {
          error: "WhatsApp dinonaktifkan di pengaturan. Aktifkan terlebih dahulu.",
        },
        { status: 400 }
      );
    }

    // === MODE GATEWAY (kirim otomatis via API) ===
    if (useGatewayMode) {
      if (!apiUrl) {
        return NextResponse.json(
          {
            error: "API URL Gateway belum diisi. Atur di tab Pengaturan.",
          },
          { status: 400 }
        );
      }
      if (!apiToken) {
        return NextResponse.json(
          {
            error: "API Token Gateway belum diisi. Atur di tab Pengaturan.",
          },
          { status: 400 }
        );
      }

      try {
        // Format payload — support beberapa gateway populer
        // Default format Fonnte
        const gatewayPayload: Record<string, unknown> = {
          target: normalized,
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

        const result: TestResult = {
          success: gatewayRes.ok,
          mode: "gateway",
          penerima: normalized,
          namaPenerima: finalNama,
          pesan: finalPesan,
          gatewayResponse: gatewayData,
          durationMs,
          timestamp: new Date().toISOString(),
          error: gatewayRes.ok ? undefined : `HTTP ${gatewayRes.status}: ${gatewayRes.statusText}`,
        };

        // Simpan ke log
        await db.pesanLog.create({
          data: {
            penerima: normalized,
            namaPenerima: finalNama,
            pesan: finalPesan,
            kategori: "test",
            status: gatewayRes.ok ? "terkirim" : "gagal",
            error: result.error || null,
            userId: session.id,
          },
        });

        return NextResponse.json({ data: result });
      } catch (err) {
        const durationMs = Date.now() - startTime;
        const errMsg = err instanceof Error ? err.message : String(err);
        const isTimeout = errMsg.includes("aborted");

        const result: TestResult = {
          success: false,
          mode: "gateway",
          penerima: normalized,
          namaPenerima: finalNama,
          pesan: finalPesan,
          durationMs,
          timestamp: new Date().toISOString(),
          error: isTimeout
            ? "Timeout: Gateway tidak merespons dalam 15 detik. Periksa API URL atau koneksi."
            : `Gateway error: ${errMsg}`,
        };

        // Simpan ke log
        await db.pesanLog.create({
          data: {
            penerima: normalized,
            namaPenerima: finalNama,
            pesan: finalPesan,
            kategori: "test",
            status: "gagal",
            error: result.error,
            userId: session.id,
          },
        });

        return NextResponse.json({ data: result });
      }
    }

    // === MODE MANUAL (wa.me link) ===
    const waUrl = `https://wa.me/${normalized}?text=${encodeURIComponent(finalPesan)}`;
    const durationMs = Date.now() - startTime;

    const result: TestResult = {
      success: true,
      mode: "manual",
      penerima: normalized,
      namaPenerima: finalNama,
      pesan: finalPesan,
      waUrl,
      durationMs,
      timestamp: new Date().toISOString(),
    };

    // Simpan ke log
    await db.pesanLog.create({
      data: {
        penerima: normalized,
        namaPenerima: finalNama,
        pesan: finalPesan,
        kategori: "test",
        status: "terkirim",
        userId: session.id,
      },
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[pesan-log test POST]", err);
    return NextResponse.json(
      { error: "Gagal test kirim: " + String(err).slice(0, 200) },
      { status: 500 }
    );
  }
}
