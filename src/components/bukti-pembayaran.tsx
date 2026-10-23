"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, CheckCircle2, Printer } from "lucide-react";
import { formatRupiah, formatDate, getMonthLabel } from "@/lib/format";

interface Pembayaran {
  id: string;
  noPembayaran: string;
  santriId: string;
  bulan: string;
  jumlah: number;
  tanggalBayar: string;
  metodePembayaran: string;
  status: string;
  keterangan: string | null;
  diterimaOleh: string | null;
  santri: {
    id: string;
    nis: string;
    nama: string;
    kelas: { id: string; nama: string } | null;
  };
}

interface BuktiPembayaranProps {
  pembayaran: Pembayaran;
}

export function BuktiPembayaran({ pembayaran }: BuktiPembayaranProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    const payload = JSON.stringify({
      no: pembayaran.noPembayaran,
      santri: pembayaran.santri.nama,
      nis: pembayaran.santri.nis,
      bulan: pembayaran.bulan,
      jumlah: pembayaran.jumlah,
      tanggal: pembayaran.tanggalBayar,
      status: pembayaran.status,
      lembaga: "Rumah Tahfidz An Nahl",
    });
    QRCode.toDataURL(payload, {
      margin: 1,
      width: 200,
      color: { dark: "#1B4332", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [pembayaran]);

  return (
    <div className="px-4 pb-6">
      <div className="rounded-2xl border-2 border-primary/30 overflow-hidden shadow-lg print:shadow-none print:border-primary">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-[oklch(0.28_0.06_150)] text-white p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-12 -translate-x-12" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                <BookOpen size={22} className="text-amber-300" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Rumah Tahfidz An Nahl</h3>
                <p className="text-xs text-white/80">Bukti Pembayaran SPP</p>
              </div>
            </div>
            <Badge className="bg-emerald-400/90 text-emerald-950 border-0 hover:bg-emerald-400">
              <CheckCircle2 size={12} className="mr-1" />
              LUNAS
            </Badge>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* No pembayaran */}
          <div className="text-center pb-3 border-b border-dashed border-primary/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Nomor Pembayaran</p>
            <p className="font-mono font-bold text-base text-primary">{pembayaran.noPembayaran}</p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoItem label="Nama Santri" value={pembayaran.santri.nama} />
            <InfoItem label="NIS" value={pembayaran.santri.nis} mono />
            <InfoItem label="Kelas" value={pembayaran.santri.kelas?.nama || "-"} />
            <InfoItem label="Periode SPP" value={getMonthLabel(pembayaran.bulan)} />
            <InfoItem label="Tanggal Bayar" value={formatDate(pembayaran.tanggalBayar, { day: "numeric", month: "long", year: "numeric" })} />
            <InfoItem label="Metode" value={pembayaran.metodePembayaran} capitalize />
          </div>

          <Separator className="bg-primary/20" />

          {/* Amount */}
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Jumlah Pembayaran</span>
              <span className="text-2xl font-bold text-primary">{formatRupiah(pembayaran.jumlah)}</span>
            </div>
          </div>

          {/* QR & signature */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code Verifikasi"
                  className="w-32 h-32 mx-auto rounded-lg border border-border"
                />
              ) : (
                <div className="w-32 h-32 mx-auto rounded-lg border border-dashed border-muted-foreground/30 animate-pulse" />
              )}
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Scan untuk verifikasi
              </p>
            </div>
            <div className="flex flex-col items-center justify-end text-center">
              <p className="text-xs text-muted-foreground mb-12">Diterima oleh,</p>
              <div className="border-t border-foreground pt-1 w-full">
                <p className="text-xs font-semibold">{pembayaran.diterimaOleh || "Bendahara An Nahl"}</p>
                <p className="text-[10px] text-muted-foreground">Bendahara</p>
              </div>
            </div>
          </div>

          {pembayaran.keterangan && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-[10px] text-amber-700 font-medium uppercase tracking-wider mb-0.5">Catatan</p>
              <p className="text-xs text-amber-900">{pembayaran.keterangan}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-2 border-t border-dashed border-primary/30">
            <p className="text-[10px] text-muted-foreground italic">
              Bersama Al-Qur&apos;an membangun generasi Qur&apos;ani
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Bukti pembayaran ini sah dan tidak memerlukan tanda tangan basah.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  mono,
  capitalize,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p
        className={`text-sm font-medium ${
          mono ? "font-mono" : ""
        } ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
