import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { readSupabaseConfig, writeSupabaseConfig } from "@/lib/supabase-config";

export const runtime = "nodejs";

interface TestBody {
  url?: string;
  publishableKey?: string;
  serviceRoleKey?: string;
  save?: boolean;
}

// Helper: always-return-JSON response. NEVER send empty body.
function jsonSafe(data: any, status = 200) {
  try {
    return NextResponse.json(data, { status });
  } catch (err) {
    // Failsafe — if JSON serialization itself fails
    return new NextResponse(
      JSON.stringify({ ok: false, error: "Server serialization error: " + String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST /api/setup/test — test Supabase connection
export async function POST(req: NextRequest) {
  // TOP-LEVEL TRY/CATCH — guarantees we always return JSON, never empty body
  try {
    // --- Parse body safely ---
    let body: TestBody = {};
    try {
      const text = await req.text();
      if (text && text.trim()) {
        body = JSON.parse(text) as TestBody;
      }
    } catch (parseErr) {
      return jsonSafe(
        {
          ok: false,
          error: "Body JSON tidak valid: " + String(parseErr),
          results: null,
        },
        400
      );
    }

    // --- Resolve credentials (provided > saved config) ---
    let saved;
    try {
      saved = readSupabaseConfig();
    } catch (err) {
      saved = { url: "", publishableKey: "", serviceRoleKey: "" };
    }

    const url = (body.url || saved.url || "").trim();
    const publishableKey = (body.publishableKey || saved.publishableKey || "").trim();
    const serviceRoleKey = (body.serviceRoleKey || saved.serviceRoleKey || "").trim();

    if (!url || !publishableKey) {
      return jsonSafe(
        {
          ok: false,
          error:
            "URL dan Publishable Key wajib diisi. Saat ini: " +
            (url ? "URL ok" : "URL kosong") +
            ", " +
            (publishableKey ? "Key ok" : "Key kosong") +
            ".",
          results: null,
        },
        400
      );
    }

    // Basic URL validation
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return jsonSafe(
        {
          ok: false,
          error: "URL tidak valid: " + url,
          results: null,
        },
        400
      );
    }
    if (!parsedUrl.hostname.endsWith(".supabase.co")) {
      return jsonSafe(
        {
          ok: false,
          error: "URL harus diakhiri .supabase.co (dapat: " + parsedUrl.hostname + ")",
          results: null,
        },
        400
      );
    }

    // --- Save if requested ---
    if (body.save) {
      try {
        writeSupabaseConfig({ url, publishableKey, serviceRoleKey });
      } catch (err) {
        // Log but continue — saving is not critical for the test itself
        console.error("[setup/test] Failed to save config:", err);
      }
    }

    const results = {
      reachable: false,
      anonWorks: false,
      serviceRoleWorks: false,
      canListTables: false,
      tableCount: 0,
      existingTables: [] as string[],
      errors: [] as string[],
    };

    // --- 1. Test reachability via /auth/v1/health ---
    try {
      const res = await fetch(`${url}/auth/v1/health`, {
        method: "GET",
        headers: { apikey: publishableKey },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        results.reachable = true;
        results.anonWorks = true;
      } else if (res.status === 401 || res.status === 403) {
        results.reachable = true;
        results.errors.push(`Anon key ditolak (HTTP ${res.status})`);
      } else {
        results.reachable = true;
        results.errors.push(`/auth/v1/health return HTTP ${res.status}`);
      }
    } catch (err: any) {
      const msg = err?.name === "TimeoutError" || err?.name === "AbortError"
        ? `Timeout (10s) saat hubungi ${url}/auth/v1/health`
        : `Gagal hubungi ${url}: ${err?.message || String(err)}`;
      results.errors.push(msg);
      return jsonSafe({
        ok: false,
        results,
        message: "Supabase URL tidak dapat dijangkau. Detail: " + msg,
      });
    }

    // --- 2. Test service role key (if provided) ---
    if (serviceRoleKey) {
      try {
        const adminRes = await fetch(`${url}/rest/v1/`, {
          method: "GET",
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          signal: AbortSignal.timeout(10000),
        });
        if (adminRes.ok) {
          results.serviceRoleWorks = true;
          // Try parse OpenAPI spec to count tables
          try {
            const spec = await adminRes.json();
            const paths = spec?.paths || {};
            const tableNames = Object.keys(paths).filter(
              (p) => p.startsWith("/") && p.split("/").length === 2
            );
            results.canListTables = true;
            results.tableCount = tableNames.length;
            results.existingTables = tableNames
              .map((t) => t.replace("/", ""))
              .slice(0, 30);
          } catch {
            // Spec parse failed, but admin key still works
            results.canListTables = true;
          }
        } else if (adminRes.status === 401 || adminRes.status === 403) {
          results.errors.push(`Service role key ditolak (HTTP ${adminRes.status}). Pastikan key yang dimasukkan adalah service_role key, bukan anon key.`);
        } else {
          results.errors.push(`Service role test: HTTP ${adminRes.status}`);
        }
      } catch (err: any) {
        results.errors.push(
          `Service role test error: ${err?.message || String(err)}`
        );
      }
    } else {
      results.errors.push(
        "Service role key tidak diisi — fitur admin akan terbatas (RLS berlaku)."
      );
    }

    const ok = results.reachable && results.anonWorks;
    return jsonSafe({
      ok,
      results,
      message: ok
        ? `Koneksi berhasil. ${
            results.tableCount > 0
              ? `${results.tableCount} tabel ditemukan.`
              : "Schema belum diinisialisasi."
          }`
        : "Koneksi gagal — periksa URL dan key.",
    });
  } catch (topErr: any) {
    // TOP-LEVEL CATCH — guarantees we always return JSON, never empty
    console.error("[setup/test] Unhandled error:", topErr);
    return jsonSafe(
      {
        ok: false,
        error:
          "Server error: " +
          (topErr?.message || String(topErr)) +
          (topErr?.stack ? " | stack: " + topErr.stack.split("\n")[0] : ""),
        results: null,
      },
      500
    );
  }
}
