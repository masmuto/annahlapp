// Supabase client for GO An Nahl
//
// Two layers:
//   1. Browser-side (publishable/anon key) — subject to RLS.
//   2. Server-side (service role key) — bypasses RLS, server-only.
//
// Both layers read from `supabase-config.json` (written by the setup wizard)
// first, then fall back to env vars. This allows runtime reconfiguration
// without restarting the dev server.

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { readSupabaseConfig } from "@/lib/supabase-config";

function loadConfig() {
  // Only read the file on the server. On the browser, fall back to env vars
  // (NEXT_PUBLIC_* are inlined at build time).
  if (typeof window === "undefined") {
    try {
      return readSupabaseConfig();
    } catch {
      // fall through to env vars
    }
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    configured: false,
    configuredAt: "",
  };
}

const cfg = loadConfig();

const SUPABASE_URL = cfg.url;
const SUPABASE_ANON_KEY = cfg.publishableKey;
const SUPABASE_SERVICE_KEY = cfg.serviceRoleKey;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[supabase] Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or use the Setup Wizard on first run."
  );
}

/**
 * Browser-side Supabase client.
 * Uses anon/publishable key — subject to Row Level Security policies.
 * Safe to use in 'use client' components.
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: { params: { eventsPerSecond: 2 } },
  }
);

/**
 * Server-side Supabase client with service role key.
 * Bypasses RLS — ONLY use in API routes / server components.
 * NEVER import this in 'use client' code.
 */
export function createServerClient(): SupabaseClient {
  if (!SUPABASE_SERVICE_KEY) {
    console.warn(
      "[supabase] SUPABASE_SERVICE_ROLE_KEY not set. Server client will use anon key (RLS applies)."
    );
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Helper: check if Supabase is configured
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Table name constants — single source of truth for table references.
 */
export const TABLES = {
  USERS: "User",
  USTAZ: "ustaz",
  KELAS: "kelas",
  SANTRI: "santri",
  KELOMPOK_BELAJAR: "kelompok_belajar",
  JADWAL_KELOMPOK: "jadwal_kelompok",
  ANGGOTA_KELOMPOK: "anggota_kelompok",
  PEMBAYARAN_SPP: "pembayaran_spp",
  PENGATURAN: "pengaturan",
  PESAN_TEMPLATE: "pesan_template",
  PESAN_LOG: "pesan_log",
} as const;

/**
 * View name constants
 */
export const VIEWS = {
  SANTRI_LENGKAP: "v_santri_lengkap",
  KELOMPOK_SUMMARY: "v_kelompok_summary",
  PEMBAYARAN_LENGKAP: "v_pembayaran_lengkap",
} as const;
