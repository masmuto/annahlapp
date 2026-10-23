"use client";

import { useState } from "react";
import { useSupabaseHealth } from "@/hooks/use-supabase-health";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  X,
  RefreshCw,
  Settings,
  Database,
  Wifi,
  WifiOff,
} from "lucide-react";

/**
 * Banner yang muncul otomatis saat:
 * - Supabase belum dikonfigurasi
 * - Koneksi gagal (error/disconnected)
 *
 * Tidak muncul saat: status = idle, checking, atau connected
 */
export function SupabaseConnectionBanner() {
  const { health, check } = useSupabaseHealth(true);
  const [dismissed, setDismissed] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const [lastStatus, setLastStatus] = useState(health.status);

  // Track status change untuk auto-reset dismissed (derived state, bukan effect)
  if (health.status !== lastStatus) {
    setLastStatus(health.status);
    if (dismissed) setDismissed(false);
  }

  if (dismissed) return null;
  if (health.status === "idle" || health.status === "checking" || health.status === "connected") {
    return null;
  }

  const handleRecheck = async () => {
    setRechecking(true);
    await check();
    setTimeout(() => setRechecking(false), 500);
  };

  const isDisconnected = health.status === "disconnected";

  return (
    <div
      className={`fixed top-16 left-0 right-0 z-40 border-b px-4 py-2.5 shadow-sm ${
        isDisconnected
          ? "bg-amber-50 border-amber-200"
          : "bg-destructive/5 border-destructive/20"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <div className={`shrink-0 ${isDisconnected ? "text-amber-600" : "text-destructive"}`}>
          {isDisconnected ? <WifiOff size={18} /> : <AlertCircle size={18} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-medium ${isDisconnected ? "text-amber-800" : "text-destructive"}`}>
              {isDisconnected
                ? "Supabase belum dikonfigurasi"
                : "Gagal terhubung ke Supabase"}
            </p>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                isDisconnected
                  ? "border-amber-300 bg-amber-100 text-amber-700"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              Retry: {health.retryCount}
            </Badge>
            {health.lastChecked && (
              <span className="text-[10px] text-muted-foreground">
                Terakhir cek: {health.lastChecked.toLocaleTimeString("id-ID")}
              </span>
            )}
          </div>
          <p className={`text-xs mt-0.5 ${isDisconnected ? "text-amber-700" : "text-destructive/80"}`}>
            {health.error || (
              isDisconnected
                ? "Set NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY di environment variables."
                : "Periksa koneksi internet atau status Supabase Dashboard."
            )}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRecheck}
            disabled={rechecking || health.status === "checking"}
            className={`h-7 text-xs ${
              isDisconnected
                ? "border-amber-300 text-amber-700 hover:bg-amber-100"
                : "border-destructive/30 text-destructive hover:bg-destructive/10"
            }`}
          >
            <RefreshCw size={12} className={`mr-1 ${rechecking ? "animate-spin" : ""}`} />
            Cek Ulang
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="h-7 w-7 p-0"
            aria-label="Tutup banner"
          >
            <X size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Stat cards untuk tampilan status koneksi lengkap.
 * Bisa dipakai di halaman Pengaturan → Database.
 */
export function SupabaseStatusCard() {
  const { health, check } = useSupabaseHealth(true);
  const [rechecking, setRechecking] = useState(false);

  const handleRecheck = async () => {
    setRechecking(true);
    await check();
    setTimeout(() => setRechecking(false), 500);
  };

  const statusConfig = {
    idle: { label: "Idle", color: "bg-gray-100 text-gray-700 border-gray-300" },
    checking: { label: "Menyambung...", color: "bg-sky-100 text-sky-700 border-sky-300" },
    connected: { label: "Terhubung", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
    disconnected: { label: "Belum dikonfigurasi", color: "bg-amber-100 text-amber-700 border-amber-300" },
    error: { label: "Gagal", color: "bg-red-100 text-red-700 border-red-300" },
  }[health.status];

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-primary" />
          <h3 className="text-sm font-semibold">Status Koneksi Supabase</h3>
        </div>
        <Badge variant="outline" className={`text-[10px] ${statusConfig.color}`}>
          {health.status === "connected" && <Wifi size={9} className="mr-1" />}
          {(health.status === "error" || health.status === "disconnected") && (
            <WifiOff size={9} className="mr-1" />
          )}
          {statusConfig.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded bg-muted/40 p-2">
          <p className="text-muted-foreground">URL</p>
          <p className="font-mono truncate">{health.url || "—"}</p>
        </div>
        <div className="rounded bg-muted/40 p-2">
          <p className="text-muted-foreground">Service Key</p>
          <p className={health.serviceKeyConfigured ? "text-emerald-700" : "text-amber-700"}>
            {health.serviceKeyConfigured ? "✓ Terkonfigurasi" : "⚠ Belum di-set"}
          </p>
        </div>
        <div className="rounded bg-muted/40 p-2">
          <p className="text-muted-foreground">Terakhir Cek</p>
          <p className="font-mono">
            {health.lastChecked
              ? health.lastChecked.toLocaleString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "—"}
          </p>
        </div>
        <div className="rounded bg-muted/40 p-2">
          <p className="text-muted-foreground">Retry Count</p>
          <p className="font-mono">{health.retryCount}</p>
        </div>
      </div>

      {health.error && (
        <div className="rounded bg-destructive/10 border border-destructive/20 p-2 text-xs text-destructive">
          <p className="font-semibold mb-0.5">Error:</p>
          <p className="break-words">{health.error}</p>
        </div>
      )}

      {health.counts && (
        <details>
          <summary className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground">
            Jumlah record per tabel ({Object.keys(health.counts).length} tabel)
          </summary>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2">
            {Object.entries(health.counts).map(([t, c]) => (
              <div
                key={t}
                className="flex justify-between text-[10px] bg-muted/40 rounded px-2 py-1"
              >
                <span className="text-muted-foreground">{t}</span>
                <span className={`font-mono font-semibold ${c > 0 ? "text-emerald-700" : "text-muted-foreground"}`}>
                  {c < 0 ? "err" : c}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      <Button
        size="sm"
        variant="outline"
        onClick={handleRecheck}
        disabled={rechecking || health.status === "checking"}
        className="w-full"
      >
        <RefreshCw size={12} className={`mr-1 ${rechecking ? "animate-spin" : ""}`} />
        Cek Ulang Koneksi
      </Button>
    </div>
  );
}
