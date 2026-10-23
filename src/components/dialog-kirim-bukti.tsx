"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MessageCircle,
  Sparkles,
  AlertCircle,
  Clock,
  Zap,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface PembayaranForWA {
  id: string;
  noPembayaran: string;
  jumlah: number;
  bulan: string;
  tanggalBayar: string;
  santri: {
    id: string;
    nis: string;
    nama: string;
    noHpOrtu: string | null;
    namaAyah: string | null;
    kelas: { nama: string } | null;
  };
}

interface KirimBuktiResult {
  success: boolean;
  mode: "manual" | "gateway";
  penerima: string;
  namaPenerima: string;
  pesan: string;
  waUrl?: string;
  gatewayResponse?: unknown;
  error?: string;
  durationMs: number;
  timestamp: string;
}

interface DialogKirimBuktiProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pembayaran: PembayaranForWA | null;
  onSent?: () => void;
}

export function DialogKirimBukti({
  open,
  onOpenChange,
  pembayaran,
  onSent,
}: DialogKirimBuktiProps) {
  const [settings, setSettings] = useState<{
    wa_enabled: string;
    wa_use_gateway: string;
    wa_api_url: string;
    wa_api_token: string;
  } | null>(null);
  const [useGateway, setUseGateway] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<KirimBuktiResult | null>(null);

  // Load pengaturan saat dialog buka
  useEffect(() => {
    if (!open) return;
    fetch("/api/pengaturan")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setSettings(d.data);
          setUseGateway(d.data.wa_use_gateway === "true");
        }
      })
      .catch(console.error);
  }, [open]);

  // Reset saat tutup
  useEffect(() => {
    if (!open) {
      setResult(null);
      setSending(false);
    }
  }, [open]);

  const waEnabled = settings?.wa_enabled !== "false";
  const gatewayConfigured = !!(settings?.wa_api_url && settings?.wa_api_token);
  const hasPhone = !!(pembayaran?.santri.noHpOrtu);

  const handleKirim = async () => {
    if (!pembayaran) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch(`/api/pembayaran/${pembayaran.id}/kirim-wa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useGateway }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error || "Gagal kirim WA");
        setResult({
          success: false,
          mode: useGateway ? "gateway" : "manual",
          penerima: pembayaran.santri.noHpOrtu || "",
          namaPenerima: pembayaran.santri.namaAyah || `Ortu ${pembayaran.santri.nama}`,
          pesan: "",
          durationMs: 0,
          timestamp: new Date().toISOString(),
          error: d.error,
        });
        return;
      }
      setResult(d.data as KirimBuktiResult);
      if (d.data.success) {
        toast.success(
          d.data.mode === "gateway"
            ? "✓ Bukti pembayaran terkirim via Gateway!"
            : "✓ Link WhatsApp siap dibuka!"
        );
        onSent?.();
      } else {
        toast.error("Gagal kirim. Lihat detail error.");
      }
    } catch (err) {
      toast.error("Gagal: " + String(err));
    } finally {
      setSending(false);
    }
  };

  const openWaUrl = () => {
    if (result?.waUrl) {
      window.open(result.waUrl, "_blank");
    }
  };

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n || 0);

  const formatBulan = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    return new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
    }).format(new Date(y, m - 1, 1));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle size={18} className="text-primary" />
            Kirim Bukti Pembayaran
          </DialogTitle>
          <DialogDescription>
            Kirim konfirmasi penerimaan SPP ke orang tua santri via WhatsApp.
          </DialogDescription>
        </DialogHeader>

        {pembayaran && (
          <div className="space-y-4">
            {/* Info pembayaran */}
            <div className="rounded-lg bg-gradient-to-br from-primary/10 to-emerald-50 border border-primary/20 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-xs text-muted-foreground">No. Pembayaran</p>
                  <p className="font-mono font-bold text-primary text-sm">
                    {pembayaran.noPembayaran}
                  </p>
                </div>
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0">
                  <CheckCircle2 size={10} className="mr-1" />
                  LUNAS
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Santri</p>
                  <p className="font-semibold">{pembayaran.santri.nama}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">NIS</p>
                  <p className="font-mono">{pembayaran.santri.nis}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bulan</p>
                  <p className="font-semibold">{formatBulan(pembayaran.bulan)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jumlah</p>
                  <p className="font-bold text-emerald-700">
                    {formatRupiah(pembayaran.jumlah)}
                  </p>
                </div>
              </div>
            </div>

            {/* Info penerima */}
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Penerima WhatsApp
              </p>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {pembayaran.santri.namaAyah || `Ortu ${pembayaran.santri.nama}`}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {pembayaran.santri.noHpOrtu || "— belum diisi —"}
                  </p>
                </div>
                {hasPhone ? (
                  <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 shrink-0">
                    <CheckCircle2 size={10} className="mr-1" />
                    Siap
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 shrink-0">
                    <AlertCircle size={10} className="mr-1" />
                    No. HP kosong
                  </Badge>
                )}
              </div>
            </div>

            {/* Warning: WA disabled atau no HP kosong */}
            {!waEnabled && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">
                  WhatsApp dinonaktifkan. Aktifkan di <strong>Pengaturan → WhatsApp</strong>.
                </p>
              </div>
            )}

            {hasPhone && waEnabled && !result && (
              <>
                {/* Mode toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div className="flex-1">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Zap size={14} className={useGateway ? "text-sky-600" : "text-muted-foreground"} />
                      Mode Gateway (Otomatis)
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {useGateway
                        ? "Pesan dikirim langsung via API Gateway tanpa membuka WhatsApp"
                        : "Pesan dibuka via wa.me (Anda klik kirim manual di WhatsApp)"}
                    </p>
                  </div>
                  <Switch
                    checked={useGateway}
                    onCheckedChange={setUseGateway}
                    disabled={!gatewayConfigured && !useGateway}
                  />
                </div>

                {useGateway && !gatewayConfigured && (
                  <p className="text-xs text-amber-700 -mt-2">
                    ⚠ Gateway belum dikonfigurasi. Atur di Pengaturan → WhatsApp, atau matikan toggle ini.
                  </p>
                )}

                {/* Preview info */}
                <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
                  <p className="text-xs font-semibold text-sky-800 mb-1 flex items-center gap-1">
                    <Sparkles size={12} />
                    {useGateway ? "Pesan akan dikirim otomatis" : "Link wa.me akan dibuat"}
                  </p>
                  <p className="text-xs text-sky-700">
                    Template <code className="bg-white/50 px-1 rounded">bukti_pembayaran</code> akan
                    dipakai dengan data santri &amp; pembayaran terisi otomatis.
                  </p>
                </div>
              </>
            )}

            {/* Hasil kirim */}
            {result && (
              <div className={`rounded-lg border p-4 ${result.success ? "border-emerald-300 bg-emerald-50" : "border-destructive/40 bg-destructive/5"}`}>
                <div className="flex items-center gap-2 mb-3">
                  {result.success ? (
                    <CheckCircle2 size={20} className="text-emerald-600" />
                  ) : (
                    <XCircle size={20} className="text-destructive" />
                  )}
                  <p className={`font-semibold text-sm ${result.success ? "text-emerald-700" : "text-destructive"}`}>
                    {result.success ? "Berhasil Terkirim!" : "Gagal Kirim"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="outline" className="text-[10px] bg-white">
                    <Clock size={9} className="mr-1" />
                    {result.durationMs}ms
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-white">
                    Mode: {result.mode === "gateway" ? "Gateway" : "Manual"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-white font-mono">
                    → {result.penerima}
                  </Badge>
                </div>

                {result.error && (
                  <div className="rounded bg-white/60 p-2 text-xs text-destructive mb-2">
                    {result.error}
                  </div>
                )}

                {result.gatewayResponse !== undefined && (
                  <details className="text-xs mb-2">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Response Gateway
                    </summary>
                    <pre className="mt-1 text-[10px] bg-white/80 rounded p-2 max-h-32 overflow-y-auto whitespace-pre-wrap font-mono">
                      {typeof result.gatewayResponse === "string"
                        ? result.gatewayResponse
                        : JSON.stringify(result.gatewayResponse, null, 2)}
                    </pre>
                  </details>
                )}

                {result.waUrl && result.success && (
                  <Button
                    type="button"
                    onClick={openWaUrl}
                    className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white"
                    size="sm"
                  >
                    <ExternalLink size={14} className="mr-2" />
                    Buka WhatsApp
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {!result ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={sending}
              >
                Nanti Saja
              </Button>
              <Button
                type="button"
                onClick={handleKirim}
                disabled={sending || !hasPhone || !waEnabled || (useGateway && !gatewayConfigured)}
                className="bg-[#25D366] hover:bg-[#1ebe5d] text-white"
              >
                {sending ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send size={14} className="mr-2" />
                    {useGateway ? "Kirim Otomatis" : "Buka WhatsApp"}
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              <CheckCircle2 size={14} className="mr-2" />
              Selesai
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
