// Server-only Supabase config storage.
// Persists runtime Supabase credentials to a JSON file so they can be
// changed from the UI without restarting the dev server.
//
// File: /home/z/my-project/supabase-config.json
//
// IMPORTANT: This module reads/writes the filesystem. NEVER import from
// client components — only from API routes / server components.

import fs from "fs";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), "supabase-config.json");

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
  serviceRoleKey: string;
  configured: boolean;
  configuredAt: string;
  initialized?: boolean; // true if SQL schema has been applied
  initializedAt?: string;
}

const EMPTY_CONFIG: SupabaseConfig = {
  url: "",
  publishableKey: "",
  serviceRoleKey: "",
  configured: false,
  configuredAt: "",
};

/**
 * Read current Supabase config from file.
 * Falls back to env vars if no config file exists.
 */
export function readSupabaseConfig(): SupabaseConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(raw) as SupabaseConfig;
      return {
        ...EMPTY_CONFIG,
        ...parsed,
        configured: Boolean(parsed.url && parsed.publishableKey),
      };
    }
  } catch (err) {
    console.warn("[supabase-config] Failed to read config file:", err);
  }

  // Fallback to env vars
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const configured = Boolean(url && publishableKey);
  return {
    url,
    publishableKey,
    serviceRoleKey,
    configured,
    configuredAt: configured ? "from-env" : "",
  };
}

/**
 * Persist Supabase config to file.
 */
export function writeSupabaseConfig(config: Partial<SupabaseConfig>): SupabaseConfig {
  const current = readSupabaseConfig();
  const next: SupabaseConfig = {
    ...current,
    ...config,
    configured: Boolean(config.url && config.publishableKey),
    configuredAt: new Date().toISOString(),
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2), "utf-8");
  console.log("[supabase-config] Saved to", CONFIG_FILE);
  return next;
}

/**
 * Mark schema as initialized.
 */
export function markInitialized(): SupabaseConfig {
  return writeSupabaseConfig({
    initialized: true,
    initializedAt: new Date().toISOString(),
  });
}

/**
 * Returns a config with sensitive keys masked — safe to send to the browser.
 */
export function maskConfig(config: SupabaseConfig) {
  return {
    url: config.url,
    publishableKey: maskKey(config.publishableKey),
    serviceRoleKey: maskKey(config.serviceRoleKey),
    hasPublishableKey: Boolean(config.publishableKey),
    hasServiceRoleKey: Boolean(config.serviceRoleKey),
    configured: config.configured,
    configuredAt: config.configuredAt,
    initialized: config.initialized || false,
    initializedAt: config.initializedAt || null,
  };
}

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 12) return "•".repeat(key.length);
  return key.slice(0, 8) + "•".repeat(20) + key.slice(-4);
}

/**
 * Path to config file (for debugging).
 */
export const CONFIG_PATH = CONFIG_FILE;
