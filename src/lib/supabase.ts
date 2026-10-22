// Supabase client for GO An Nahl
// Browser client uses NEXT_PUBLIC_ env vars (exposed to client).
// Server client uses SUPABASE_SERVICE_ROLE_KEY for admin operations (server-only).

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[supabase] Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local"
  );
}

/**
 * Browser-side Supabase client.
 * Uses anon/publishable key — subject to Row Level Security policies.
 * Safe to use in 'use client' components.
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
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
  USERS: "users",
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
