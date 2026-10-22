"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export type SupabaseStatus =
  | "idle"
  | "checking"
  | "connected"
  | "disconnected"
  | "error";

export interface SupabaseHealth {
  status: SupabaseStatus;
  url: string | null;
  serviceKeyConfigured: boolean;
  counts: Record<string, number> | null;
  error: string | null;
  lastChecked: Date | null;
  retryCount: number;
}

interface SupabaseTestResponse {
  configured: boolean;
  connected?: boolean;
  url?: string;
  serviceKeyConfigured?: boolean;
  counts?: Record<string, number>;
  summary?: { totalTables: number; successfulQueries: number; failedQueries: number };
  error?: string;
}

const INITIAL_STATE: SupabaseHealth = {
  status: "idle",
  url: null,
  serviceKeyConfigured: false,
  counts: null,
  error: null,
  lastChecked: null,
  retryCount: 0,
};

const RECHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 menit
const MAX_RETRIES = 3;

/**
 * Hook: cek koneksi Supabase otomatis saat app pertama load.
 * Re-check setiap 5 menit. Bisa retry manual.
 */
export function useSupabaseHealth(autoCheck = true) {
  const [health, setHealth] = useState<SupabaseHealth>(INITIAL_STATE);
  const retryCountRef = useRef(0);

  const check = useCallback(async () => {
    setHealth((h) => ({ ...h, status: "checking", error: null }));

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch("/api/supabase-test", {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);

      const data: SupabaseTestResponse = await res.json();

      if (!data.configured) {
        setHealth({
          status: "disconnected",
          url: null,
          serviceKeyConfigured: false,
          counts: null,
          error: data.error || "Supabase belum dikonfigurasi",
          lastChecked: new Date(),
          retryCount: retryCountRef.current,
        });
        return;
      }

      if (data.connected) {
        retryCountRef.current = 0;
        setHealth({
          status: "connected",
          url: data.url || null,
          serviceKeyConfigured: Boolean(data.serviceKeyConfigured),
          counts: data.counts || null,
          error: null,
          lastChecked: new Date(),
          retryCount: 0,
        });
      } else {
        retryCountRef.current += 1;
        setHealth({
          status: "error",
          url: data.url || null,
          serviceKeyConfigured: Boolean(data.serviceKeyConfigured),
          counts: data.counts || null,
          error: data.error || "Koneksi gagal",
          lastChecked: new Date(),
          retryCount: retryCountRef.current,
        });
      }
    } catch (err) {
      retryCountRef.current += 1;
      const errMsg = err instanceof Error ? err.message : String(err);
      const isTimeout = errMsg.includes("aborted");

      setHealth({
        status: "error",
        url: null,
        serviceKeyConfigured: false,
        counts: null,
        error: isTimeout
          ? "Timeout: server tidak merespons dalam 10 detik"
          : `Network error: ${errMsg}`,
        lastChecked: new Date(),
        retryCount: retryCountRef.current,
      });
    }
  }, []);

  // Auto-check saat mount — pakai IIFE async untuk hindari setState sync di effect
  useEffect(() => {
    if (!autoCheck) return;
    let active = true;
    (async () => {
      await check();
      // useEffect cleanup pattern — tidak ada setState sync
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [autoCheck, check]);

  // Periodic recheck setiap 5 menit
  useEffect(() => {
    if (!autoCheck) return;
    const interval = setInterval(() => {
      check();
    }, RECHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [autoCheck, check]);

  // Auto-retry jika error dan belum max retry
  useEffect(() => {
    if (
      health.status === "error" &&
      health.retryCount > 0 &&
      health.retryCount < MAX_RETRIES
    ) {
      const retryTimeout = setTimeout(() => {
        check();
      }, 3000 * health.retryCount); // backoff: 3s, 6s, 9s
      return () => clearTimeout(retryTimeout);
    }
  }, [health.status, health.retryCount, check]);

  return { health, check };
}
