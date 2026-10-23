"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Download,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Printer,
} from "lucide-react";
import { formatRupiah, getMonthLabel, getShortMonth, getCurrentYearMonth } from "@/lib/format";
import { toast } from "sonner";

interface LaporanRow {
  nis: string;
  nama: string;
  kelas: string;
  sppBulanan: number;
  months: Array<{ bulan: string; label: string; jumlah: number; status: string }>;
  totalPaid: number;
  totalExpected: number;
  tunggakan: number;
  status: string;
}

interface LaporanSummary {
  totalSantri: number;
  lunasCount: number;
  tunggakanCount: number;
  totalPaid: number;
  totalExpected: number;
  totalTunggakan: number;
  months: string[];
}

interface Kelas {
  id: string;
  nama: string;
}

export function LaporanView() {
  const [data, setData] = useState<{ rows: LaporanRow[]; summary: LaporanSummary; months: string[] } | null>(null);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [startBulan, setStartBulan] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [endBulan, setEndBulan] = useState(getCurrentYearMonth());
  const [kelasId, setKelasId] = useState("all");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startBulan,
        endBulan,
        kelasId,
      });
      const res = await fetch(`/api/laporan?${params}`);
      const d = await res.json();
      if (d.data) setData(d.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startBulan, endBulan, kelasId]);

  useEffect(() => {
    fetch("/api/kelas")
      .then((r) => r.json())
      .then((d) => setKelas(d.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const t = setTimeout(refresh, 300);
    return () => clearTimeout(t);
  }, [refresh]);

  const exportCSV = () => {
    const params = new URLSearchParams({
      startBulan,
      endBulan,
      kelasId,
      format: "csv",
    });
    window.open(`/api/laporan?${params.toString()}`, "_blank");
    toast.success("Mengekspor laporan ke CSV...");
  };

  const exportPDF = () => {
    // Use browser print to PDF
    window.print();
    toast.info("Gunakan opsi 'Save as PDF' pada dialog cetak");
  };

  const stats = useMemo(() => {
    if (!data) return null;
    return {
      total: data.summary.totalSantri,
      lunas: data.summary.lunasCount,
      tunggakan: data.summary.tunggakanCount,
      collected: data.summary.totalPaid,
      expected: data.summary.totalExpected,
      outstanding: data.summary.totalTunggakan,
      rate: data.summary.totalExpected > 0
        ? Math.round((data.summary.totalPaid / data.summary.totalExpected) * 100)
        : 0,
    };
  }, [data]);

  return (
    <div className="space-y-5">
      {/* Filter & actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText size={16} />
            Laporan Pembayaran SPP
          </CardTitle>
          <CardDescription className="text-xs">
            Rekap pembayaran dan tunggakan santri per periode
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Dari Bulan</Label>
              <input
                type="month"
                value={startBulan}
                onChange={(e) => setStartBulan(e.target.value)}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sampai Bulan</Label>
              <input
                type="month"
                value={endBulan}
                onChange={(e) => setEndBulan(e.target.value)}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Kelas</Label>
              <Select value={kelasId} onValueChange={setKelasId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {kelas.map((k) => (
                    <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={exportCSV} variant="outline" className="flex-1">
                <Download size={14} className="mr-1" />
                Excel/CSV
              </Button>
              <Button onClick={exportPDF} variant="outline" className="flex-1">
                <Printer size={14} className="mr-1" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      {loading || !stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            label="Total Santri"
            value={String(stats.total)}
            subtitle={`${stats.lunas} lunas, ${stats.tunggakan} tunggakan`}
            icon={CheckCircle2}
            color="primary"
          />
          <SummaryCard
            label="SPP Terkumpul"
            value={formatRupiah(stats.collected)}
            subtitle={`dari ${formatRupiah(stats.expected)}`}
            icon={Wallet}
            color="green"
          />
          <SummaryCard
            label="Total Tunggakan"
            value={formatRupiah(stats.outstanding)}
            subtitle={`${stats.tunggakan} santri`}
            icon={AlertTriangle}
            color="gold"
          />
          <SummaryCard
            label="Tingkat Penagihan"
            value={`${stats.rate}%`}
            subtitle="Tercapai"
            icon={TrendingUp}
            color="teal"
          />
        </div>
      )}

      {/* Progress bar */}
      {stats && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Progress Penagihan SPP</span>
              <span className="text-muted-foreground">
                {formatRupiah(stats.collected)} / {formatRupiah(stats.expected)}
              </span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all"
                style={{ width: `${stats.rate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs mt-1.5 text-muted-foreground">
              <span>{stats.rate}% terkumpul</span>
              <span>{100 - stats.rate}% tunggakan</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rincian per Santri</CardTitle>
          <CardDescription className="text-xs">
            Periode {getMonthLabel(startBulan)} — {getMonthLabel(endBulan)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading || !data ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : data.rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText size={40} className="text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">Tidak ada data</p>
              <p className="text-xs text-muted-foreground">Ubah filter periode atau kelas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="sticky left-0 bg-muted/40 z-10 min-w-[140px]">Santri</TableHead>
                    <TableHead className="hidden md:table-cell">Kelas</TableHead>
                    {data.months.map((m) => (
                      <TableHead key={m} className="text-center min-w-[80px]">{getShortMonth(m)}</TableHead>
                    ))}
                    <TableHead className="text-right">Total Dibayar</TableHead>
                    <TableHead className="text-right">Tunggakan</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((r) => (
                    <TableRow key={r.nis} className="hover:bg-muted/30">
                      <TableCell className="sticky left-0 bg-card z-10">
                        <div className="font-medium text-sm">{r.nama}</div>
                        <div className="text-xs text-muted-foreground font-mono">{r.nis}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{r.kelas}</TableCell>
                      {r.months.map((m) => (
                        <TableCell key={m.bulan} className="text-center">
                          {m.jumlah > 0 ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">
                              ✓
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px]">
                              -
                            </Badge>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-semibold text-emerald-700 text-sm">
                        {formatRupiah(r.totalPaid)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {r.tunggakan > 0 ? (
                          <span className="text-amber-700 font-medium">{formatRupiah(r.tunggakan)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            r.status === "lunas"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-amber-300 bg-amber-50 text-amber-700"
                          }
                        >
                          {r.status === "lunas" ? "Lunas" : "Tunggakan"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableHeader>
                  <TableRow className="bg-primary/10 font-semibold">
                    <TableCell colSpan={2} className="font-semibold sticky left-0 bg-primary/10 z-10">
                      Total ({data.summary.totalSantri} santri)
                    </TableCell>
                    {data.months.map((m) => {
                      const monthTotal = data.rows.reduce(
                        (s, r) => s + (r.months.find((x) => x.bulan === m)?.jumlah || 0),
                        0
                      );
                      return (
                        <TableCell key={m} className="text-center text-xs font-semibold">
                          {monthTotal > 0 ? `${monthTotal / 1000}k` : "-"}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right font-bold text-emerald-700">
                      {formatRupiah(data.summary.totalPaid)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-amber-700">
                      {formatRupiah(data.summary.totalTunggakan)}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {data.summary.lunasCount}/{data.summary.totalSantri}
                    </TableCell>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "primary" | "teal" | "gold" | "green";
}) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    teal: "bg-teal-100 text-teal-700",
    gold: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
            <Icon size={14} />
          </div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
        </div>
        <p className="text-lg sm:text-xl font-bold truncate">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
