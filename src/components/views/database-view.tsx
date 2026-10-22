"use client";

import { useEffect, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  Database,
  Download,
  Upload,
  Trash2,
  Shield,
  AlertTriangle,
  Loader2,
  HardDrive,
  CheckCircle2,
  FileJson,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Stats {
  users: number;
  santri: number;
  ustaz: number;
  kelas: number;
  kelompokBelajar: number;
  anggotaKelompok: number;
  pembayaranSPP: number;
  pengaturan: number;
  pesanTemplate: number;
  pesanLog: number;
}

export function DatabaseView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [backing, setBacking] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDialog, setResetDialog] = useState<"keepUsers" | "full" | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<{ counts: Record<string, number>; meta?: Record<string, unknown> } | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      // Use dashboard API + extend with extra counts via direct fetches
      const [dashRes, usersRes, tplRes, logRes, setRes] = await Promise.all([
        fetch("/api/dashboard").then((r) => r.json()),
        fetch("/api/users").then((r) => r.json()).catch(() => ({ data: [] })),
        fetch("/api/pesan-template").then((r) => r.json()).catch(() => ({ data: [] })),
        fetch("/api/pesan-log?limit=1").then((r) => r.json()).catch(() => ({ data: [] })),
        fetch("/api/pengaturan").then((r) => r.json()).catch(() => ({ data: {} })),
      ]);
      const d = dashRes.data?.totals;
      setStats({
        users: Array.isArray(usersRes.data) ? usersRes.data.length : 0,
        santri: d?.santri || 0,
        ustaz: d?.ustaz || 0,
        kelas: d?.kelas || 0,
        kelompokBelajar: 0, // not in dashboard
        anggotaKelompok: 0,
        pembayaranSPP: 0,
        pengaturan: typeof setRes.data === "object" ? Object.keys(setRes.data).length : 0,
        pesanTemplate: Array.isArray(tplRes.data) ? tplRes.data.length : 0,
        pesanLog: Array.isArray(logRes.data) ? logRes.data.length : 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleBackup = async () => {
    setBacking(true);
    try {
      const res = await fetch("/api/database/backup");
      if (!res.ok) throw new Error("Gagal backup");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] || "backup.json";
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup berhasil diunduh");
    } catch (err) {
      toast.error("Gagal backup: " + String(err));
    } finally {
      setBacking(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFile(file);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!json.data) {
        toast.error("Format file tidak valid");
        setRestoreFile(null);
        return;
      }
      const counts: Record<string, number> = {};
      Object.entries(json.data).forEach(([k, v]) => {
        counts[k] = Array.isArray(v) ? v.length : 0;
      });
      setRestorePreview({ counts, meta: json._meta });
      toast.info("File siap di-restore. Tinjau ringkasan lalu konfirmasi.");
    } catch {
      toast.error("File bukan JSON valid");
      setRestoreFile(null);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    setRestoring(true);
    try {
      const text = await restoreFile.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/database/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(`Restore berhasil: ${JSON.stringify(d.counts)}`);
      setRestoreFile(null);
      setRestorePreview(null);
      refresh();
    } catch (err) {
      toast.error("Gagal restore: " + String(err).replace("Error: ", ""));
    } finally {
      setRestoring(false);
    }
  };

  const handleReset = async (keepUsers: boolean) => {
    setResetting(true);
    try {
      const res = await fetch(`/api/database/reset?keepUsers=${keepUsers}`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(d.message);
      setResetDialog(null);
      refresh();
    } catch (err) {
      toast.error(String(err).replace("Error: ", ""));
    } finally {
      setResetting(false);
    }
  };

  const totalRecords = stats
    ? stats.users + stats.santri + stats.ustaz + stats.kelas + stats.pembayaranSPP + stats.pesanTemplate + stats.pesanLog + stats.pengaturan
    : 0;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Stats overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive size={16} className="text-primary" />
            Statistik Database
          </CardTitle>
          <CardDescription>Ringkasan jumlah record per tabel</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                <StatBox label="Users" value={stats?.users || 0} color="primary" />
                <StatBox label="Santri" value={stats?.santri || 0} color="teal" />
                <StatBox label="Ustaz" value={stats?.ustaz || 0} color="gold" />
                <StatBox label="Kelas" value={stats?.kelas || 0} color="green" />
                <StatBox label="Pembayaran" value={stats?.pembayaranSPP || 0} color="primary" />
                <StatBox label="Pengaturan" value={stats?.pengaturan || 0} color="teal" />
                <StatBox label="Template WA" value={stats?.pesanTemplate || 0} color="gold" />
                <StatBox label="Log WA" value={stats?.pesanLog || 0} color="green" />
                <StatBox label="Kelompok" value={stats?.kelompokBelajar || 0} color="primary" />
                <StatBox label="Anggota" value={stats?.anggotaKelompok || 0} color="teal" />
              </div>
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Record</p>
                  <p className="text-2xl font-bold">{totalRecords}</p>
                </div>
                <Button variant="outline" size="sm" onClick={refresh}>
                  <RefreshCw size={12} className="mr-1" />
                  Refresh
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Backup section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download size={16} className="text-primary" />
            Backup Database
          </CardTitle>
          <CardDescription>
            Unduh seluruh data aplikasi dalam format JSON untuk arsip atau pemulihan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-primary/5 border border-primary/15 p-4 mb-4">
            <div className="flex items-start gap-3">
              <FileJson size={20} className="text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Backup JSON lengkap</p>
                <p className="text-xs text-muted-foreground mt-1">
                  File berisi semua data: users, santri, ustaz, kelas, kelompok belajar,
                  anggota, pembayaran SPP, pengaturan, template pesan, dan log pesan.
                  Disimpan dengan metadata (timestamp, exporter).
                </p>
              </div>
            </div>
          </div>
          <Button onClick={handleBackup} disabled={backing} size="lg" className="w-full sm:w-auto">
            {backing ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Download size={16} className="mr-2" />
            )}
            Unduh Backup JSON
          </Button>
        </CardContent>
      </Card>

      {/* Restore section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload size={16} className="text-amber-600" />
            Restore Database
          </CardTitle>
          <CardDescription>
            Pulihkan data dari file backup JSON. <strong>Semua data saat ini akan ditimpa.</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary/40 transition cursor-pointer">
              <input
                type="file"
                accept="application/json,.json"
                onChange={handleFileSelect}
                className="hidden"
                id="restore-file"
              />
              <label htmlFor="restore-file" className="cursor-pointer block">
                <Upload size={28} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">
                  {restoreFile ? restoreFile.name : "Klik untuk pilih file JSON"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  File backup dari hasil unduhan GO An Nahl
                </p>
              </label>
            </div>

            {restorePreview && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Ringkasan isi backup:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {Object.entries(restorePreview.counts).map(([k, v]) => (
                    <div key={k} className="flex justify-between bg-white rounded px-2 py-1">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
                {restorePreview.meta && (
                  <p className="text-[10px] text-amber-700 mt-2">
                    Diexport: {String(restorePreview.meta.exportedAt || "?")} oleh {String(restorePreview.meta.exportedBy || "?")}
                  </p>
                )}
              </div>
            )}

            {restoreFile && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setRestoreFile(null);
                    setRestorePreview(null);
                  }}
                  disabled={restoring}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleRestore}
                  disabled={restoring || !restorePreview}
                >
                  {restoring ? (
                    <Loader2 size={14} className="mr-2 animate-spin" />
                  ) : (
                    <Upload size={14} className="mr-2" />
                  )}
                  Restore Sekarang
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reset section */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle size={16} />
            Reset Database (Berbahaya)
          </CardTitle>
          <CardDescription>
            Hapus data permanen. Tindakan ini tidak dapat dibatalkan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4">
            <p className="text-xs text-destructive/90 mb-3">
              Pilih opsi reset dengan hati-hati:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                onClick={() => setResetDialog("keepUsers")}
                disabled={resetting}
              >
                <Shield size={14} className="mr-2" />
                Reset Data (Tetap Login)
              </Button>
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/5"
                onClick={() => setResetDialog("full")}
                disabled={resetting}
              >
                <Trash2 size={14} className="mr-2" />
                Reset Penuh (Hapus Semua)
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              <strong>Reset Data</strong>: Hapus santri, ustaz, kelas, pembayaran, dll. Akun user dipertahankan.<br />
              <strong>Reset Penuh</strong>: Hapus semua termasuk akun user (kecuali yang sedang login).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reset confirm dialog */}
      <AlertDialog open={resetDialog !== null} onOpenChange={(o) => !o && setResetDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resetDialog === "full" ? "Reset Penuh Database?" : "Reset Data?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resetDialog === "full"
                ? "SEMUA data akan dihapus permanen, termasuk akun user lain. Anda tetap bisa login dengan akun saat ini. Tindakan ini TIDAK DAPAT DIBATALKAN."
                : "Semua data santri, ustaz, kelas, kelompok, pembayaran, pengaturan, dan template pesan akan dihapus. Akun user tetap dipertahankan. Tindakan ini TIDAK DAPAT DIBATALKAN."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleReset(resetDialog === "keepUsers")}
              className="bg-destructive hover:bg-destructive/90"
              disabled={resetting}
            >
              {resetting ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
              Ya, Reset Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "primary" | "teal" | "gold" | "green";
}) {
  const colors = {
    primary: "bg-primary/10 text-primary border-primary/20",
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    gold: "bg-amber-50 text-amber-700 border-amber-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[color]}`}>
      <p className="text-[10px] font-medium opacity-80">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
