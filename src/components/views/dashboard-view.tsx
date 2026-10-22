"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  GraduationCap,
  School,
  Wallet,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatRupiah, formatNumber, formatDate, getMonthLabel, getCurrentYearMonth } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardData {
  totals: {
    santri: number;
    santriAktif: number;
    ustaz: number;
    kelas: number;
    sppThisMonth: number;
    expectedThisMonth: number;
    collectionRate: number;
    paidCount: number;
    unpaidCount: number;
  };
  trend: Array<{ bulan: string; label: string; total: number; count: number }>;
  kelasStats: Array<{ nama: string; jumlah: number }>;
  recent: Array<{
    id: string;
    noPembayaran: string;
    jumlah: number;
    tanggalBayar: string;
    santri: { nama: string; nis: string };
  }>;
  tunggakan: Array<{
    id: string;
    nis: string;
    nama: string;
    kelas: { nama: string } | null;
    sppBulanan: number;
  }>;
  bulan: string;
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulan, setBulan] = useState(getCurrentYearMonth());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?bulan=${bulan}`);
      const d = await res.json();
      if (d.data) setData(d.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [bulan]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const { totals, trend, kelasStats, recent, tunggakan } = data;

  const pieData = [
    { name: "Sudah Bayar", value: totals.paidCount, color: "oklch(0.45 0.09 150)" },
    { name: "Tunggakan", value: totals.unpaidCount, color: "oklch(0.7 0.15 50)" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero greeting + month selector */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary to-[oklch(0.28_0.06_150)] text-white">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 right-12 w-32 h-32 rounded-full bg-white/5 translate-y-16" />
        <CardContent className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-medium mb-3">
                <Sparkles size={12} className="text-amber-300" />
                <span>Assalamu&apos;alaikum</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-1">Dashboard An Nahl</h2>
              <p className="text-white/80 text-sm">
                Ringkasan data santri & SPP bulan {getMonthLabel(bulan)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-white/70" />
              <input
                type="month"
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                className="bg-white/10 backdrop-blur border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white [color-scheme:dark]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Santri"
          value={formatNumber(totals.santri)}
          subtitle={`${formatNumber(totals.santriAktif)} aktif`}
          icon={Users}
          accent="primary"
          trend={{ value: "+3", label: "bulan ini", up: true }}
        />
        <StatCard
          title="Ustaz/Ustazah"
          value={formatNumber(totals.ustaz)}
          subtitle="Pengajar aktif"
          icon={GraduationCap}
          accent="teal"
        />
        <StatCard
          title="Kelas Tahfidz"
          value={formatNumber(totals.kelas)}
          subtitle="Iqra • Tahsin • Tahfidz"
          icon={School}
          accent="gold"
        />
        <StatCard
          title="SPP Bulan Ini"
          value={formatRupiah(totals.sppThisMonth)}
          subtitle={`dari ${formatRupiah(totals.expectedThisMonth)}`}
          icon={Wallet}
          accent="green"
          trend={{
            value: `${totals.collectionRate}%`,
            label: "terkumpul",
            up: totals.collectionRate >= 70,
          }}
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Bar chart - SPP trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Tren Penerimaan SPP</CardTitle>
                <CardDescription className="text-xs">
                  6 bulan terakhir
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <TrendingUp size={14} />
                <span>Tren meningkat</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.45 0.09 150)" />
                    <stop offset="100%" stopColor="oklch(0.62 0.12 145)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "oklch(0.85 0 0)" }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip
                  formatter={(v: number) => formatRupiah(v)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid oklch(0.9 0 0)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="total" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut chart - SPP collection rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tingkat Penagihan SPP</CardTitle>
            <CardDescription className="text-xs">Bulan {getMonthLabel(bulan)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, n: string) => [`${v} santri`, n]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid oklch(0.9 0 0)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-foreground">
                  {totals.collectionRate}%
                </span>
                <span className="text-xs text-muted-foreground">terkumpul</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "oklch(0.45 0.09 150)" }} />
                <div className="leading-tight">
                  <p className="text-xs font-medium">{totals.paidCount} santri</p>
                  <p className="text-[10px] text-muted-foreground">Sudah bayar</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "oklch(0.7 0.15 50)" }} />
                <div className="leading-tight">
                  <p className="text-xs font-medium">{totals.unpaidCount} santri</p>
                  <p className="text-[10px] text-muted-foreground">Tunggakan</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: kelas distribution + tunggakan */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribusi Santri per Kelas</CardTitle>
            <CardDescription className="text-xs">Jumlah santri aktif di setiap kelas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {kelasStats.map((k) => {
              const max = Math.max(...kelasStats.map((x) => x.jumlah), 1);
              const pct = Math.round((k.jumlah / max) * 100);
              return (
                <div key={k.nama} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{k.nama}</span>
                    <span className="text-muted-foreground">{k.jumlah} santri</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  Tunggakan SPP
                </CardTitle>
                <CardDescription className="text-xs">
                  {tunggakan.length} santri belum membayar
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-72 overflow-y-auto scroll-area-an">
              {tunggakan.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 size={40} className="text-emerald-500 mb-3" />
                  <p className="text-sm font-medium">Semua santri sudah bayar!</p>
                  <p className="text-xs text-muted-foreground">Tidak ada tunggakan bulan ini</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {tunggakan.map((s) => (
                    <li key={s.id} className="px-6 py-3 flex items-center justify-between gap-3 hover:bg-muted/50 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-semibold shrink-0">
                          {s.nama.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{s.nama}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.nis} • {s.kelas?.nama || "Tanpa kelas"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 shrink-0">
                        {formatRupiah(s.sppBulanan)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent payments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Pembayaran SPP Terbaru</CardTitle>
              <CardDescription className="text-xs">5 transaksi terakhir</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary">
              Lihat semua
              <ArrowUpRight size={14} className="ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">No. Pembayaran</th>
                  <th className="text-left px-6 py-3 font-medium">Santri</th>
                  <th className="text-left px-6 py-3 font-medium hidden sm:table-cell">Tanggal</th>
                  <th className="text-right px-6 py-3 font-medium">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground text-sm">
                      Belum ada pembayaran bulan ini
                    </td>
                  </tr>
                ) : (
                  recent.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/40 transition">
                      <td className="px-6 py-3 font-mono text-xs">{p.noPembayaran}</td>
                      <td className="px-6 py-3">
                        <div className="font-medium">{p.santri.nama}</div>
                        <div className="text-xs text-muted-foreground">{p.santri.nis}</div>
                      </td>
                      <td className="px-6 py-3 hidden sm:table-cell text-muted-foreground">
                        {formatDate(p.tanggalBayar, { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-emerald-700">
                        {formatRupiah(p.jumlah)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "primary" | "teal" | "gold" | "green";
  trend?: { value: string; label: string; up: boolean };
}

function StatCard({ title, value, subtitle, icon: Icon, accent, trend }: StatCardProps) {
  const accents = {
    primary: "bg-primary/10 text-primary",
    teal: "bg-teal-100 text-teal-700",
    gold: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
  };
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accents[accent]}`}>
            <Icon size={18} />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-0.5 text-xs font-medium ${
                trend.up ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {trend.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trend.value}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        {trend && (
          <p className="text-[10px] text-muted-foreground mt-1">{trend.label}</p>
        )}
      </CardContent>
    </Card>
  );
}
