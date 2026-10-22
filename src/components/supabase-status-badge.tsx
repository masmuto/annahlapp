"use client";

import { useSupabaseHealth } from "@/hooks/use-supabase-health";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Database,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SupabaseStatusBadgeProps {
  variant?: "compact" | "full";
  className?: string;
}

export function SupabaseStatusBadge({
  variant = "compact",
  className,
}: SupabaseStatusBadgeProps) {
  const { health, check } = useSupabaseHealth(true);
  const [rechecking, setRechecking] = useState(false);

  const handleRecheck = async () => {
    setRechecking(true);
    await check();
    setTimeout(() => setRechecking(false), 500);
  };

  const config = {
    idle: {
      icon: Database,
      color: "text-muted-foreground",
      bg: "bg-muted/40",
      label: "Idle",
    },
    checking: {
      icon: Loader2,
      color: "text-sky-600",
      bg: "bg-sky-50",
      label: "Menyambung...",
      spin: true,
    },
    connected: {
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      label: "Supabase: Terhubung",
    },
    disconnected: {
      icon: AlertCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      label: "Belum dikonfigurasi",
    },
    error: {
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/5",
      label: "Koneksi gagal",
    },
  }[health.status];

  const Icon = config.icon;
  const isCompact = variant === "compact";

  const tooltipContent = (
    <div className="space-y-1.5 max-w-xs">
      <div className="font-semibold text-xs flex items-center gap-1.5">
        <Database size={11} />
        Status Koneksi Supabase
      </div>
      {health.url && (
        <div className="text-[10px] text-muted-foreground">
          URL: <code className="bg-muted/60 px-1 rounded">{health.url}</code>
        </div>
      )}
      {health.lastChecked && (
        <div className="text-[10px] text-muted-foreground">
          Terakhir cek: {health.lastChecked.toLocaleTimeString("id-ID")}
        </div>
      )}
      {health.error && (
        <div className="text-[10px] text-destructive bg-destructive/10 p-1.5 rounded">
          {health.error}
        </div>
      )}
      {health.counts && (
        <div className="text-[10px] text-muted-foreground">
          {Object.entries(health.counts)
            .filter(([, v]) => v > 0)
            .slice(0, 5)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" · ")}
        </div>
      )}
      {!health.serviceKeyConfigured && health.status === "connected" && (
        <div className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded">
          ⚠ Service role key belum di-set. Operasi admin mungkin terbatas.
        </div>
      )}
      <button
        onClick={handleRecheck}
        disabled={rechecking || health.status === "checking"}
        className="text-[10px] text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
      >
        <RefreshCw size={9} className={rechecking ? "animate-spin" : ""} />
        Cek ulang koneksi
      </button>
    </div>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleRecheck}
            disabled={health.status === "checking" || rechecking}
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition hover:opacity-80",
              config.bg,
              config.color,
              "border border-border/50",
              className
            )}
            aria-label={`Supabase: ${config.label}`}
          >
            <Icon
              size={11}
              className={cn("spin" in config && config.spin && "animate-spin")}
            />
            {!isCompact && <span>{config.label}</span>}
            {isCompact && health.status === "connected" && (
              <span className="hidden sm:inline">Supabase</span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
