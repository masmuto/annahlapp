import { NextRequest, NextResponse } from "next/server";
import {
  readSupabaseConfig,
  writeSupabaseConfig,
  markInitialized,
  maskConfig,
} from "@/lib/supabase-config";

export const runtime = "nodejs";

// GET /api/setup/config — return current config (masked) + connection status
export async function GET() {
  const config = readSupabaseConfig();
  return NextResponse.json({
    config: maskConfig(config),
  });
}

// POST /api/setup/config — save new credentials
// Body: { url, publishableKey, serviceRoleKey, markInitialized?: boolean }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = (body.url || "").trim();
    const publishableKey = (body.publishableKey || "").trim();
    const serviceRoleKey = (body.serviceRoleKey || "").trim();

    if (!url || !publishableKey) {
      return NextResponse.json(
        { error: "URL dan Publishable Key wajib diisi" },
        { status: 400 }
      );
    }

    if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
      return NextResponse.json(
        { error: "URL Supabase tidak valid (harus https://xxx.supabase.co)" },
        { status: 400 }
      );
    }

    const updated = writeSupabaseConfig({
      url,
      publishableKey,
      serviceRoleKey,
    });

    if (body.markInitialized) {
      const withInit = markInitialized();
      return NextResponse.json({
        ok: true,
        config: maskConfig(withInit),
        message: "Konfigurasi disimpan & ditandai sebagai terinisialisasi.",
      });
    }

    return NextResponse.json({
      ok: true,
      config: maskConfig(updated),
      message: "Konfigurasi disimpan. Klik 'Test Koneksi' untuk verifikasi.",
    });
  } catch (err) {
    console.error("[setup/config POST]", err);
    return NextResponse.json(
      { error: "Gagal menyimpan konfigurasi: " + String(err) },
      { status: 500 }
    );
  }
}

// DELETE /api/setup/config — reset config (back to env vars)
export async function DELETE() {
  const fs = await import("fs");
  const path = await import("path");
  const configFile = path.join(process.cwd(), "supabase-config.json");
  try {
    if (fs.existsSync(configFile)) fs.unlinkSync(configFile);
  } catch (err) {
    console.warn("[setup/config DELETE]", err);
  }
  return NextResponse.json({ ok: true, message: "Konfigurasi direset." });
}
