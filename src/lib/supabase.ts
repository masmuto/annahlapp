// Supabase client for GO An Nahl
// Lazy initialization — Supabase client hanya dibuat saat pertama kali dipakai.
// Ini mencegah crash saat build time jika env vars belum di-set.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Flag: apakah Supabase terkonfigurasi (URL + anon key sudah di-set)
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Helper: log warning jika Supabase belum dikonfigurasi
 */
function warnNotConfigured(context: string) {
  if (!isSupabaseConfigured) {
    console.warn(
      `[supabase:${context}] Not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local`
    );
  }
}

// === BROWSER CLIENT (lazy singleton) ===
let _browserClient: SupabaseClient | null = null;

/**
 * Browser-side Supabase client (anon/publishable key, subject to RLS).
 * Safe to call from 'use client' components.
 *
 * Returns null if not configured — caller harus cek isSupabaseConfigured dulu.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    warnNotConfigured("getSupabase");
    return null;
  }
  if (!_browserClient) {
    _browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: { params: { eventsPerSecond: 2 } },
    });
  }
  return _browserClient;
}

/**
 * Backward-compat: `supabase` named export.
 * Throws helpful error if accessed saat belum configured (lebih informatif daripada crash di createClient).
 *
 * Prefer pakai `getSupabase()` untuk code baru.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    if (!client) {
      throw new Error(
        `supabase.${String(prop)} called but Supabase is not configured. ` +
          `Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY env vars.`
      );
    }
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

// === SERVER CLIENT (lazy factory) ===
let _serverClient: SupabaseClient | null = null;

/**
 * Server-side Supabase client with service role key (bypass RLS).
 * ONLY use in API routes / server components. NEVER import in 'use client'.
 *
 * Returns browser client (anon key) if service role key not set.
 * Returns null if neither configured.
 */
export function createServerClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    warnNotConfigured("createServerClient");
    return null;
  }
  if (!_serverClient) {
    const key = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
    _serverClient = createClient(SUPABASE_URL, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _serverClient;
}

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
