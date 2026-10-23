import { NextRequest, NextResponse } from "next/server";
import {
  readSupabaseConfig,
  writeSupabaseConfig,
  markInitialized,
  maskConfig,
} from "@/lib/supabase-config";

export const runtime = "nodejs";

// Helper: always-return-JSON
function jsonSafe(data: any, status = 200) {
  try {
    return NextResponse.json(data, { status });
  } catch (err) {
    return new NextResponse(
      JSON.stringify({ ok: false, error: "Serialization error: " + String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// GET /api/setup/config — return current config (masked)
export async function GET() {
  try {
    const config = readSupabaseConfig();
    return jsonSafe({ config: maskConfig(config) });
  } catch (err: any) {
    return jsonSafe(
      { ok: false, error: "Gagal membaca config: " + (err?.message || String(err)) },
      500
    );
  }
}

// POST /api/setup/config — save new credentials
export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      const text = await req.text();
      body = text?.trim() ? JSON.parse(text) : {};
    } catch (parseErr) {
      return jsonSafe(
        { ok: false, error: "Body JSON tidak valid: " + String(parseErr) },
        400
      );
    }

    const url = (body.url || "").trim();
    const publishableKey = (body.publishableKey || "").trim();
    const serviceRoleKey = (body.serviceRoleKey || "").trim();

    if (!url || !publishableKey) {
      return jsonSafe(
        { ok: false, error: "URL dan Publishable Key wajib diisi" },
        400
      );
    }

    try {
      const parsed = new URL(url);
      if (!parsed.hostname.endsWith(".supabase.co")) {
        return jsonSafe(
          { ok: false, error: "URL harus diakhiri .supabase.co" },
          400
        );
      }
    } catch {
      return jsonSafe({ ok: false, error: "URL tidak valid: " + url }, 400);
    }

    const updated = writeSupabaseConfig({
      url,
      publishableKey,
      serviceRoleKey,
    });

    if (body.markInitialized) {
      const withInit = markInitialized();
      return jsonSafe({
        ok: true,
        config: maskConfig(withInit),
        message: "Konfigurasi disimpan & ditandai sebagai terinisialisasi.",
      });
    }

    return jsonSafe({
      ok: true,
      config: maskConfig(updated),
      message: "Konfigurasi disimpan. Klik 'Test Koneksi' untuk verifikasi.",
    });
  } catch (err: any) {
    console.error("[setup/config POST] Unhandled:", err);
    return jsonSafe(
      { ok: false, error: "Server error: " + (err?.message || String(err)) },
      500
    );
  }
}

// DELETE /api/setup/config — reset config
export async function DELETE() {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const configFile = path.join(process.cwd(), "supabase-config.json");
    try {
      if (fs.existsSync(configFile)) fs.unlinkSync(configFile);
    } catch (err) {
      console.warn("[setup/config DELETE]", err);
    }
    return jsonSafe({ ok: true, message: "Konfigurasi direset." });
  } catch (err: any) {
    return jsonSafe(
      { ok: false, error: "Gagal reset: " + (err?.message || String(err)) },
      500
    );
  }
}
