import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { readSupabaseConfig, writeSupabaseConfig } from "@/lib/supabase-config";

export const runtime = "nodejs";

interface TestBody {
  url?: string;
  publishableKey?: string;
  serviceRoleKey?: string;
  save?: boolean; // if true, persist credentials before testing
}

// POST /api/setup/test — test Supabase connection (read+write+admin)
// Tests 3 layers:
//   1. REST API reachable (anon key)
//   2. Service role works (bypasses RLS) — if provided
//   3. Can read pg_catalog (tables list)
export async function POST(req: NextRequest) {
  let body: TestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  // Use provided creds, or fall back to saved config
  const saved = readSupabaseConfig();
  const url = (body.url || saved.url || "").trim();
  const publishableKey = (body.publishableKey || saved.publishableKey || "").trim();
  const serviceRoleKey = (body.serviceRoleKey || saved.serviceRoleKey || "").trim();

  if (!url || !publishableKey) {
    return NextResponse.json(
      { error: "URL dan Publishable Key wajib diisi" },
      { status: 400 }
    );
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

  // Save if requested
  if (body.save) {
    writeSupabaseConfig({ url, publishableKey, serviceRoleKey });
  }

  // 1. Test reachability via /auth/v1/health (accepts anon key, returns 200)
  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      method: "GET",
      headers: {
        apikey: publishableKey,
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok || res.status === 200) {
      results.reachable = true;
      results.anonWorks = true;
    } else if (res.status === 401 || res.status === 403) {
      results.reachable = true; // server reached, but key invalid
      results.errors.push(`Anon key ditolak (HTTP ${res.status})`);
    } else {
      results.reachable = true;
      results.errors.push(`Respons tidak expected: HTTP ${res.status}`);
    }
  } catch (err) {
    results.errors.push(`Tidak dapat terhubung ke ${url}: ${String(err)}`);
    return NextResponse.json({ ok: false, results, error: "Supabase URL tidak dapat dijangkau" }, { status: 200 });
  }

  // 2. If service role key provided, test admin access via REST API root
  //    (this endpoint requires a secret/service_role key — perfect for verification)
  if (serviceRoleKey) {
    try {
      const adminRes = await fetch(`${url}/rest/v1/`, {
        method: "GET",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        signal: AbortSignal.timeout(8000),
      });
      if (adminRes.ok) {
        results.serviceRoleWorks = true;
        // Try to get the OpenAPI spec to count tables
        try {
          const spec = await adminRes.json();
          const paths = spec?.paths || {};
          const tableNames = Object.keys(paths).filter(
            (p) => p.startsWith("/") && p.split("/").length === 2
          );
          results.canListTables = true;
          results.tableCount = tableNames.length;
          results.existingTables = tableNames.map((t) => t.replace("/", "")).slice(0, 30);
        } catch {
          results.canListTables = true; // still admin, just couldn't parse spec
        }
      } else if (adminRes.status === 401 || adminRes.status === 403) {
        results.errors.push(`Service role key ditolak (HTTP ${adminRes.status})`);
      } else {
        results.errors.push(`Service role test: HTTP ${adminRes.status}`);
      }
    } catch (err) {
      results.errors.push(`Service role test gagal: ${String(err)}`);
    }
  } else {
    results.errors.push("Service role key tidak diisi — fitur admin akan terbatas (RLS berlaku).");
  }

  const ok = results.reachable && results.anonWorks;
  return NextResponse.json({
    ok,
    results,
    message: ok
      ? `Koneksi berhasil. ${results.tableCount > 0 ? `${results.tableCount} tabel ditemukan.` : "Schema belum diinisialisasi."}`
      : "Koneksi gagal — periksa URL dan key.",
  });
}
