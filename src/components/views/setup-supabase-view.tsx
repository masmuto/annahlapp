"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnNahlLogo, AnNahlTagline } from "@/components/an-nahl-logo";
import { safeFetchJson } from "@/lib/safe-fetch";
import { toast } from "sonner";
import {
  Cloud,
  Database,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Server,
} from "lucide-react";

type Step = "choose" | "configure" | "test" | "init" | "done";

interface SetupStatus {
  supabase: {
    url: string;
    publishableKey: string;
    serviceRoleKey: string;
    hasPublishableKey: boolean;
    hasServiceRoleKey: boolean;
    configured: boolean;
    configuredAt: string;
    initialized: boolean;
    initializedAt: string | null;
  };
  database: {
    hasUsers: boolean;
    userCount: number;
    error: string | null;
  };
  needsSetup: boolean;
  needsSupabaseSetup: boolean;
}

interface TestResult {
  ok: boolean;
  results?: {
    reachable: boolean;
    anonWorks: boolean;
    serviceRoleWorks: boolean;
    canListTables: boolean;
    tableCount: number;
    existingTables: string[];
    errors: string[];
  };
  message?: string;
  error?: string;
}

interface InitResult {
  ok: boolean;
  message?: string;
  error?: string;
  lastError?: string;
  sqlForManualRun?: string;
  manualSteps?: string[];
  config?: { initialized: boolean; initializedAt: string };
}

// Pre-filled with the credentials from the user's message
const PREFILLED = {
  url: "https://kciglknjiosjbxfmtqjo.supabase.co",
  publishableKey: "sb_publishable_mTLpKPR7YyTpcrgMW6ySjw_iD3rsG7B",
  serviceRoleKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjaWdsa25qaW9zamJ4Zm10cWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MDk2NzIsImV4cCI6MjEwODI4NTY3Mn0.tlq9TULqXxquKlIiNlMECp0rBcdIhuJnyrNkaKgkQe8",
};

export function SetupSupabaseView({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>("choose");
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [url, setUrl] = useState(PREFILLED.url);
  const [publishableKey, setPublishableKey] = useState(PREFILLED.publishableKey);
  const [serviceRoleKey, setServiceRoleKey] = useState(PREFILLED.serviceRoleKey);
  const [showServiceKey, setShowServiceKey] = useState(false);

  // Test result
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Init result
  const [initResult, setInitResult] = useState<InitResult | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [manualDone, setManualDone] = useState(false);

  useEffect(() => {
    refreshStatus();
  }, []);

  const refreshStatus = async () => {
    try {
      const result = await safeFetchJson<SetupStatus>("/api/setup/status");
      if (!result.data) {
        console.error("Failed to load status:", result.error);
        return;
      }
      const d = result.data;
      setStatus(d);

      // Pre-fill from saved config if available
      if (d.supabase?.url) setUrl(d.supabase.url);
      if (d.supabase?.hasPublishableKey && d.supabase.publishableKey) {
        // The masked key won't be usable; keep pre-filled if config matches
        if (d.supabase.url === PREFILLED.url) {
          setPublishableKey(PREFILLED.publishableKey);
        }
      }
    } catch (err) {
      console.error("Failed to load status:", err);
    }
  };

  const handleTestConnection = async (saveFirst = true) => {
    setLoading(true);
    setTestResult(null);
    try {
      const result = await safeFetchJson<TestResult>(
        "/api/setup/test",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            publishableKey,
            serviceRoleKey,
            save: saveFirst,
          }),
        },
        60000 // 60s timeout — Supabase tests can be slow
      );

      if (!result.data) {
        toast.error("Gagal test koneksi: " + result.error);
        return;
      }

      const d = result.data;
      setTestResult(d);
      if (d.ok) {
        toast.success(d.message || "Koneksi berhasil!");
        setStep("init");
      } else {
        toast.error(d.message || "Koneksi gagal");
      }
    } catch (err) {
      toast.error("Gagal test koneksi: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleInitSchema = async () => {
    setLoading(true);
    setInitResult(null);
    try {
      const result = await safeFetchJson<InitResult>(
        "/api/setup/init",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, publishableKey, serviceRoleKey }),
        },
        60000
      );

      if (!result.data) {
        toast.error("Gagal inisialisasi: " + result.error);
        return;
      }

      const d = result.data;
      setInitResult(d);
      if (d.ok) {
        toast.success("Schema berhasil diinisialisasi di Supabase!");
        await refreshStatus();
        setStep("done");
      } else {
        toast.error(d.error || "Inisialisasi otomatis gagal");
      }
    } catch (err) {
      toast.error("Gagal inisialisasi: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkManualDone = async () => {
    setLoading(true);
    try {
      // Save config + mark as initialized
      await fetch("/api/setup/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          publishableKey,
          serviceRoleKey,
          markInitialized: true,
        }),
      });
      await refreshStatus();
      setStep("done");
      toast.success("Schema ditandai sebagai terinisialisasi.");
    } catch (err) {
      toast.error("Gagal: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleFinishAndSeed = async () => {
    setLoading(true);
    try {
      // Trigger seed to fill Supabase with demo data
      const result = await safeFetchJson<any>(
        "/api/seed?force=true",
        { method: "POST" },
        120000 // 2 min — seed can take a while (85 santri + payments)
      );
      if (!result.data) throw new Error(result.error);
      const d = result.data;
      if (!result.ok) throw new Error(d.error || "Gagal seed");
      toast.success(
        `Berhasil! ${d.summary?.santri || 0} santri, ${d.summary?.ustaz || 0} ustaz dimuat.`
      );
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast.error(String(err));
      setLoading(false);
    }
  };

  const handleSkipToLocal = async () => {
    // User chooses local SQLite — just run seed
    setLoading(true);
    try {
      const result = await safeFetchJson<any>(
        "/api/seed",
        { method: "POST" },
        120000
      );
      if (!result.data) throw new Error(result.error);
      const d = result.data;
      if (!result.ok) throw new Error(d.error || "Gagal seed");
      toast.success(`Berhasil! ${d.summary?.santri || 0} santri dimuat.`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast.error(String(err));
      setLoading(false);
    }
  };

  const copySql = async () => {
    if (!initResult?.sqlForManualRun) return;
    try {
      await navigator.clipboard.writeText(initResult.sqlForManualRun);
      setSqlCopied(true);
      toast.success("SQL disalin ke clipboard");
      setTimeout(() => setSqlCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin. Copy manual dari textarea di bawah.");
    }
  };

  // ---- Step: Choose DB mode ----
  if (step === "choose") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-background to-amber-50">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <AnNahlLogo variant="dark" size="lg" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Selamat Datang di GO An Nahl
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Sebelum mulai, pilih mode database yang ingin Anda gunakan.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Local SQLite */}
            <Card className="border-2 hover:border-primary/50 transition cursor-pointer group" >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Database className="size-10 text-emerald-600" />
                  <Badge variant="secondary">Cepat</Badge>
                </div>
                <CardTitle className="mt-3">Database Lokal (SQLite)</CardTitle>
                <CardDescription>
                  Mulai langsung tanpa konfigurasi. Data disimpan di file lokal.
                  Cocok untuk uji coba & demo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Tanpa setup, langsung jalan
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Data demo sudah tersedia (85 santri)
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-amber-600" />
                  Tidak bisa diakses dari device lain
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleSkipToLocal}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Database size={16} className="mr-2" />
                  )}
                  Gunakan Lokal
                </Button>
              </CardFooter>
            </Card>

            {/* Supabase */}
            <Card className="border-2 border-primary/30 bg-primary/5 hover:border-primary transition cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Cloud className="size-10 text-primary" />
                  <Badge>Recommended</Badge>
                </div>
                <CardTitle className="mt-3">Supabase (PostgreSQL Cloud)</CardTitle>
                <CardDescription>
                  Database cloud yang bisa diakses dari mana saja. Cocok untuk
                  produksi & multi-device.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-primary" />
                  Cloud PostgreSQL, akses multi-device
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-primary" />
                  Backup otomatis & RLS security
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-primary" />
                  Kredensial sudah pre-filled
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => setStep("configure")}
                  disabled={loading}
                >
                  <Cloud size={16} className="mr-2" />
                  Konek ke Supabase
                  <ArrowRight size={14} className="ml-2" />
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <AnNahlTagline className="justify-center" />
          </div>
        </div>
      </div>
    );
  }

  // ---- Step: Configure credentials ----
  if (step === "configure") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-background to-amber-50">
        <Card className="max-w-2xl w-full shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("choose")}
              >
                <ArrowLeft size={14} className="mr-1" />
                Kembali
              </Button>
              <Badge variant="outline">Step 1 of 3</Badge>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Cloud className="size-6 text-primary" />
              <CardTitle>Konfigurasi Supabase</CardTitle>
            </div>
            <CardDescription>
              Masukkan kredensial Supabase Anda. Kredensial sudah diisi otomatis
              dari konfigurasi sebelumnya — Anda bisa langsung klik "Test Koneksi".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Supabase URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xxx.supabase.co"
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Dashboard → Project Settings → API → Project URL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pub">Publishable Key (anon)</Label>
              <Input
                id="pub"
                value={publishableKey}
                onChange={(e) => setPublishableKey(e.target.value)}
                placeholder="sb_publishable_xxx atau eyJxxx"
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Dashboard → Project Settings → API → Project API keys → publishable
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="svc">Service Role Key <span className="text-destructive">*</span></Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowServiceKey((s) => !s)}
                  type="button"
                >
                  {showServiceKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showServiceKey ? "Sembunyikan" : "Tampilkan"}
                </Button>
              </div>
              <Input
                id="svc"
                type={showServiceKey ? "text" : "password"}
                value={serviceRoleKey}
                onChange={(e) => setServiceRoleKey(e.target.value)}
                placeholder="eyJxxx..."
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle size={12} />
                Wajib untuk inisialisasi schema. Dashboard → Settings → API →
                service_role key.{" "}
                <a
                  href="https://supabase.com/dashboard/project/kciglknjiosjbxfmtqjo/settings/api"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  Buka Dashboard <ExternalLink size={10} className="ml-0.5" />
                </a>
              </p>
            </div>

            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>Catatan Keamanan</AlertTitle>
              <AlertDescription className="text-xs">
                Service Role Key bypass RLS. Jangan pernah expose ke browser
                selain di halaman setup ini. Disimpan di{" "}
                <code className="bg-muted px-1 rounded">supabase-config.json</code>{" "}
                (server-side only).
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("choose")} disabled={loading}>
              Batal
            </Button>
            <Button
              className="flex-1"
              onClick={() => handleTestConnection(true)}
              disabled={loading || !url || !publishableKey}
            >
              {loading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Sparkles size={16} className="mr-2" />
              )}
              Simpan & Test Koneksi
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ---- Step: Test result (only shown briefly before moving to init) ----
  if (step === "test" && testResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-background to-amber-50">
        <Card className="max-w-2xl w-full shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.ok ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : (
                <XCircle className="size-5 text-destructive" />
              )}
              Hasil Test Koneksi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {testResult.results && (
              <>
                <TestRow
                  label="Supabase URL dapat dijangkau"
                  ok={testResult.results.reachable}
                />
                <TestRow
                  label="Publishable/Anon key valid"
                  ok={testResult.results.anonWorks}
                />
                <TestRow
                  label="Service Role key valid"
                  ok={testResult.results.serviceRoleWorks}
                />
                <TestRow
                  label="Dapat membaca daftar tabel"
                  ok={testResult.results.canListTables}
                />
                {testResult.results.tableCount > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Ditemukan {testResult.results.tableCount} tabel di schema public.
                  </div>
                )}
                {testResult.results.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertTitle>Detail Error</AlertTitle>
                    <AlertDescription>
                      <ul className="text-xs space-y-1 mt-2">
                        {testResult.results.errors.map((e, i) => (
                          <li key={i}>• {e}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("configure")} disabled={loading}>
              Ubah Kredensial
            </Button>
            {testResult.ok ? (
              <Button className="flex-1" onClick={() => setStep("init")}>
                Lanjut: Inisialisasi Schema
                <ArrowRight size={14} className="ml-2" />
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={() => handleTestConnection(false)}
                disabled={loading}
              >
                {loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                Coba Lagi
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ---- Step: Initialize schema ----
  if (step === "init") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-background to-amber-50">
        <Card className="max-w-2xl w-full shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep("configure")}>
                <ArrowLeft size={14} className="mr-1" />
                Kembali
              </Button>
              <Badge variant="outline">Step 2 of 3</Badge>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Server className="size-6 text-primary" />
              <CardTitle>Inisialisasi Schema di Supabase</CardTitle>
            </div>
            <CardDescription>
              Klik tombol di bawah untuk membuat 11 tabel di database Supabase
              Anda. Aplikasi akan otomatis menjalankan DDL via SQL-over-HTTP.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResult?.ok && (
              <Alert>
                <CheckCircle2 className="size-4" />
                <AlertTitle>Koneksi Sukses</AlertTitle>
                <AlertDescription className="text-xs">
                  Supabase {url} siap. Klik "Inisialisasi Schema" untuk membuat tabel.
                </AlertDescription>
              </Alert>
            )}

            <div className="rounded-lg border border-border p-3 space-y-2 text-xs">
              <p className="font-medium text-foreground">Yang akan dibuat:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 11 tabel: User, pengaturan, pesan_template, pesan_log, ustaz, kelas, santri, kelompok_belajar, jadwal_kelompok, anggota_kelompok, pembayaran_spp</li>
                <li>• Indexes untuk performa query</li>
                <li>• Trigger auto-update <code className="bg-muted px-1 rounded">updatedAt</code></li>
                <li>• Seed awal: 3 akun demo + 13 pengaturan + 4 template WA</li>
              </ul>
            </div>

            {initResult && !initResult.ok && (
              <Alert variant="destructive">
                <XCircle className="size-4" />
                <AlertTitle>Inisialisasi Otomatis Gagal</AlertTitle>
                <AlertDescription className="text-xs space-y-2">
                  <p>{initResult.error}</p>
                  {initResult.lastError && (
                    <p className="font-mono text-[10px] opacity-70">
                      Detail: {initResult.lastError}
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {initResult && !initResult.ok && initResult.sqlForManualRun && (
              <div className="space-y-3">
                <Alert>
                  <AlertCircle className="size-4" />
                  <AlertTitle>Jalankan Manual di Supabase Dashboard</AlertTitle>
                  <AlertDescription className="text-xs space-y-2">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>
                        Buka{" "}
                        <a
                          href="https://supabase.com/dashboard/project/kciglknjiosjbxfmtqjo/sql/new"
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline inline-flex items-center"
                        >
                          Supabase SQL Editor <ExternalLink size={10} className="ml-0.5" />
                        </a>
                      </li>
                      <li>Copy SQL di bawah, paste ke editor, klik Run</li>
                      <li>
                        Setelah selesai, klik "Saya sudah jalankan SQL" di bawah
                      </li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">SQL Schema ({initResult.sqlForManualRun.length} chars):</p>
                  <Button variant="outline" size="sm" onClick={copySql}>
                    {sqlCopied ? (
                      <><Check size={14} className="mr-1" /> Tersalin</>
                    ) : (
                      <><Copy size={14} className="mr-1" /> Copy SQL</>
                    )}
                  </Button>
                </div>
                <textarea
                  readOnly
                  value={initResult.sqlForManualRun}
                  className="w-full h-48 p-3 text-[10px] font-mono bg-muted rounded border border-border resize-y"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />

                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={handleMarkManualDone}
                  disabled={loading || manualDone}
                >
                  {manualDone ? (
                    <><CheckCircle2 size={14} className="mr-2" /> Sudah Ditandai</>
                  ) : (
                    <><CheckCircle2 size={14} className="mr-2" /> Saya sudah jalankan SQL di Supabase</>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleTestConnection(false)}
              disabled={loading}
            >
              <RefreshCw size={14} className="mr-1" />
              Test Ulang
            </Button>
            <Button
              className="flex-1"
              onClick={handleInitSchema}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Database size={16} className="mr-2" />
              )}
              Inisialisasi Schema Otomatis
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ---- Step: Done ----
  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-background to-amber-50">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className="size-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="size-10 text-emerald-600" />
              </div>
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              Supabase Siap!
            </CardTitle>
            <CardDescription>
              Schema sudah dibuat di Supabase. Sekarang, isi dengan data contoh
              (85 santri, 8 ustaz, 6 kelas) untuk mulai menggunakan aplikasi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-primary/5 border border-primary/15 p-3 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge className="bg-emerald-600">Terhubung</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">URL:</span>
                <code className="font-mono text-[10px]">{url}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tabel dibuat:</span>
                <span className="font-medium">11 tabel</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleFinishAndSeed} disabled={loading}>
              {loading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Database size={16} className="mr-2" />
              )}
              Isi Data Contoh & Mulai
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );
}

function TestRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="size-4 text-emerald-600" />
      ) : (
        <XCircle className="size-4 text-destructive" />
      )}
      <span className={ok ? "text-foreground" : "text-muted-foreground line-through"}>
        {label}
      </span>
    </div>
  );
}
