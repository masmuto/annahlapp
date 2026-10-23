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
import { toast } from "sonner";
import { safeFetchJson } from "@/lib/safe-fetch";
import {
  Cloud,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Server,
  Database,
  Sparkles,
} from "lucide-react";

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

export function SupabaseSetupView() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const [url, setUrl] = useState("");
  const [publishableKey, setPublishableKey] = useState("");
  const [serviceRoleKey, setServiceRoleKey] = useState("");
  const [showServiceKey, setShowServiceKey] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const result = await safeFetchJson<SetupStatus>("/api/setup/status");
      if (!result.data) {
        toast.error("Gagal memuat status: " + result.error);
        return;
      }
      const d = result.data;
      setStatus(d);
      setUrl(d.supabase.url || "");
      // Don't pre-fill keys from server (they're masked); leave empty for user to re-enter
      setPublishableKey("");
      setServiceRoleKey("");
    } catch (err) {
      toast.error("Gagal memuat status: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSave = async () => {
    if (!url || !publishableKey) {
      toast.error("URL dan Publishable Key wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const result = await safeFetchJson<any>(
        "/api/setup/config",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, publishableKey, serviceRoleKey }),
        },
        15000
      );
      if (!result.data) throw new Error(result.error);
      const d = result.data;
      if (!result.ok) throw new Error(d.error || "Gagal simpan");
      toast.success(d.message || "Konfigurasi disimpan");
      await refresh();
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await safeFetchJson<any>(
        "/api/setup/test",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: url || undefined,
            publishableKey: publishableKey || undefined,
            serviceRoleKey: serviceRoleKey || undefined,
            save: false,
          }),
        },
        60000 // 60s — Supabase tests can be slow
      );
      if (!result.data) {
        toast.error("Gagal test koneksi: " + result.error);
        return;
      }
      const d = result.data;
      setTestResult(d);
      if (d.ok) toast.success(d.message || "Koneksi berhasil");
      else toast.error(d.message || "Koneksi gagal");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setTesting(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset konfigurasi Supabase? Aplikasi akan kembali pakai env vars.")) return;
    setLoading(true);
    try {
      const result = await safeFetchJson<any>(
        "/api/setup/config",
        { method: "DELETE" },
        10000
      );
      if (!result.data) throw new Error(result.error);
      toast.success("Konfigurasi direset");
      await refresh();
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Cloud className="size-6 text-primary" />
          Koneksi Supabase
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola kredensial Supabase untuk database cloud PostgreSQL.
          Perubahan langsung aktif tanpa perlu restart server.
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Status Koneksi</p>
              {status.supabase.configured ? (
                <CheckCircle2 className="size-4 text-emerald-600" />
              ) : (
                <XCircle className="size-4 text-destructive" />
              )}
            </div>
            <p className="text-lg font-bold mt-1">
              {status.supabase.configured ? "Terhubung" : "Belum"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Schema Init</p>
              {status.supabase.initialized ? (
                <CheckCircle2 className="size-4 text-emerald-600" />
              ) : (
                <AlertCircle className="size-4 text-amber-600" />
              )}
            </div>
            <p className="text-lg font-bold mt-1">
              {status.supabase.initialized ? "Sudah" : "Belum"}
            </p>
            {status.supabase.initializedAt && (
              <p className="text-[10px] text-muted-foreground">
                {new Date(status.supabase.initializedAt).toLocaleString("id-ID")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Service Role Key</p>
              <Server className="size-4 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold mt-1">
              {status.supabase.hasServiceRoleKey ? "Tersedia" : "Kosong"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Total User di DB</p>
              <Database className="size-4 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold mt-1">{status.database.userCount}</p>
            {status.database.error && (
              <p className="text-[10px] text-destructive">Error: DB lokal</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current config display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Cloud className="size-4" />
              Konfigurasi Aktif
            </span>
            <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </CardTitle>
          <CardDescription>
            Konfigurasi yang sedang dipakai aplikasi (disimpan di{" "}
            <code className="bg-muted px-1 rounded text-xs">supabase-config.json</code>).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
            <span className="text-muted-foreground text-xs">Supabase URL</span>
            <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
              {status.supabase.url || "(tidak dikonfigurasi)"}
            </code>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
            <span className="text-muted-foreground text-xs">Publishable Key</span>
            <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
              {status.supabase.publishableKey || "(tidak dikonfigurasi)"}
            </code>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
            <span className="text-muted-foreground text-xs">Service Role Key</span>
            <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
              {status.supabase.serviceRoleKey || "(tidak dikonfigurasi)"}
            </code>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
            <span className="text-muted-foreground text-xs">Disimpan pada</span>
            <span className="text-xs">
              {status.supabase.configuredAt &&
              status.supabase.configuredAt !== "from-env"
                ? new Date(status.supabase.configuredAt).toLocaleString("id-ID")
                : status.supabase.configuredAt === "from-env"
                ? "Dari .env (built-in)"
                : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Update form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-500" />
            Update Konfigurasi
          </CardTitle>
          <CardDescription>
            Isi kredensial baru di bawah untuk mengganti konfigurasi. Kosongkan
            field jika tidak ingin mengubahnya (kecuali URL & Publishable Key
            yang wajib diisi saat submit).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url2">Supabase URL</Label>
            <Input
              id="url2"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxx.supabase.co"
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pub2">Publishable Key (anon)</Label>
            <Input
              id="pub2"
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
              placeholder={status.supabase.hasPublishableKey ? "(sudah disimpan, isi untuk ganti)" : "sb_publishable_xxx"}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="svc2">Service Role Key</Label>
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
              id="svc2"
              type={showServiceKey ? "text" : "password"}
              value={serviceRoleKey}
              onChange={(e) => setServiceRoleKey(e.target.value)}
              placeholder={status.supabase.hasServiceRoleKey ? "(sudah disimpan, isi untuk ganti)" : "eyJxxx..."}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Ambil dari{" "}
              <a
                href="https://supabase.com/dashboard/project/kciglknjiosjbxfmtqjo/settings/api"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center"
              >
                Dashboard → Settings → API <ExternalLink size={10} className="ml-0.5" />
              </a>
            </p>
          </div>

          {testResult && (
            <Alert variant={testResult.ok ? "default" : "destructive"}>
              {testResult.ok ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <XCircle className="size-4" />
              )}
              <AlertTitle>{testResult.ok ? "Koneksi Berhasil" : "Koneksi Gagal"}</AlertTitle>
              <AlertDescription className="text-xs">
                <p>{testResult.message}</p>
                {testResult.results?.errors?.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {testResult.results.errors.map((e: string, i: number) => (
                      <li key={i}>• {e}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={loading}>
              Reset ke Default
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleTest}
              disabled={testing || !url}
            >
              {testing ? (
                <Loader2 size={14} className="mr-1 animate-spin" />
              ) : (
                <RefreshCw size={14} className="mr-1" />
              )}
              Test Koneksi
            </Button>
            <Button onClick={handleSave} disabled={loading || !url || !publishableKey}>
              {loading ? (
                <Loader2 size={14} className="mr-1 animate-spin" />
              ) : (
                <CheckCircle2 size={14} className="mr-1" />
              )}
              Simpan Konfigurasi
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Help block */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="size-4" />
            Cara Mendapatkan Kredensial Supabase
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2 text-muted-foreground">
          <p>
            1. Buka{" "}
            <a
              href="https://supabase.com/dashboard/project/kciglknjiosjbxfmtqjo/settings/api"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline inline-flex items-center"
            >
              Supabase Dashboard → Settings → API <ExternalLink size={10} className="ml-0.5" />
            </a>
          </p>
          <p>2. Salin <strong>Project URL</strong> → tempel di field "Supabase URL"</p>
          <p>3. Salin <strong>Project API keys → publishable</strong> → tempel di "Publishable Key"</p>
          <p>4. Salin <strong>Project API keys → service_role</strong> (klik reveal) → tempel di "Service Role Key"</p>
          <p>5. Klik "Test Koneksi" lalu "Simpan Konfigurasi"</p>
        </CardContent>
      </Card>
    </div>
  );
}
