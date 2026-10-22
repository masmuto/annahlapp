import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured, TABLES } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * GET /api/supabase-test
 * Test koneksi Supabase — return status konfigurasi & jumlah record per tabel
 */
export async function GET(_req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      {
        configured: false,
        error: "NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum di-set di .env",
      },
      { status: 200 }
    );
  }

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json(
      {
        configured: true,
        connected: false,
        error: "Gagal membuat Supabase client",
      },
      { status: 500 }
    );
  }

  try {
    // Test koneksi dengan query sederhana ke setiap tabel utama
    const tables = [
      TABLES.USERS,
      TABLES.USTAZ,
      TABLES.KELAS,
      TABLES.SANTRI,
      TABLES.KELOMPOK_BELAJAR,
      TABLES.JADWAL_KELOMPOK,
      TABLES.ANGGOTA_KELOMPOK,
      TABLES.PEMBAYARAN_SPP,
      TABLES.PENGATURAN,
      TABLES.PESAN_TEMPLATE,
      TABLES.PESAN_LOG,
    ];

    const counts: Record<string, number> = {};
    let totalErrors = 0;

    for (const t of tables) {
      const { count, error } = await supabase
        .from(t)
        .select("*", { count: "exact", head: true });
      if (error) {
        counts[t] = -1;
        totalErrors++;
      } else {
        counts[t] = count || 0;
      }
    }

    return NextResponse.json({
      configured: true,
      connected: totalErrors === 0,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKeyConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      counts,
      summary: {
        totalTables: tables.length,
        successfulQueries: tables.length - totalErrors,
        failedQueries: totalErrors,
      },
    });
  } catch (err) {
    console.error("[supabase-test]", err);
    return NextResponse.json(
      {
        configured: true,
        connected: false,
        error: "Gagal koneksi: " + String(err),
      },
      { status: 500 }
    );
  }
}
