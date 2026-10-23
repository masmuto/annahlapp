"use client";

import { AppShell } from "@/components/app-shell";
import { useEffect, useState } from "react";
import { Database, Loader2, Sparkles, Cloud } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnNahlLogo, AnNahlTagline } from "@/components/an-nahl-logo";
import { SetupSupabaseView } from "@/components/views/setup-supabase-view";
import { toast } from "sonner";

type AppPhase =
  | "loading"            // checking status
  | "needs-setup"        // first-run wizard
  | "needs-seed"         // DB has no users, but Supabase already configured — quick seed
  | "ready";             // normal app

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>("loading");
  const [seeding, setSeeding] = useState(false);

  // Check overall app status on mount
  useEffect(() => {
    let active = true;

    const checkStatus = async () => {
      try {
        // First, check if session exists (already logged in)
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();

        if (meData.user) {
          // Already logged in → go straight to app
          if (active) setPhase("ready");
          return;
        }

        // Check setup status
        const statusRes = await fetch("/api/setup/status");
        const status = await statusRes.json();

        if (active) {
          if (status.needsSetup) {
            // First-time setup needed
            if (status.needsSupabaseSetup) {
              // Show full wizard
              setPhase("needs-setup");
            } else {
              // Supabase already configured & initialized — just need seed
              setPhase("needs-seed");
            }
          } else {
            // Database has users → check if login possible
            // Try default admin login to see if seed is actually present
            const loginRes = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: "admin", password: "admin123" }),
            });
            if (loginRes.ok) {
              setPhase("ready");
            } else {
              setPhase("needs-seed");
            }
          }
        }
      } catch (err) {
        console.error("Status check failed:", err);
        if (active) setPhase("needs-seed");
      }
    };

    checkStatus();
    return () => {
      active = false;
    };
  }, []);

  const runSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Gagal seed");
      toast.success(
        `Berhasil! ${d.summary.santri} santri, ${d.summary.ustaz} ustaz, ${d.summary.kelas} kelas, 3 akun demo`
      );
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSeeding(false);
    }
  };

  // ---- Loading ----
  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat GO An Nahl...</p>
        </div>
      </div>
    );
  }

  // ---- Setup Wizard (first-run, when Supabase not yet configured) ----
  if (phase === "needs-setup") {
    return <SetupSupabaseView onComplete={() => window.location.reload()} />;
  }

  // ---- Seed prompt (DB empty but Supabase configured OR using local SQLite) ----
  if (phase === "needs-seed") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-background to-emerald-50">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <AnNahlLogo variant="dark" size="lg" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Sparkles size={18} className="text-amber-500" />
              Selamat Datang di GO An Nahl
            </CardTitle>
            <CardDescription>
              Sistem Manajemen Data Santri & SPP Rumah Tahfidz An Nahl.
              <br />
              Klik tombol di bawah untuk mengisi data contoh (85 santri, 8 ustaz, 6 kelas, dan 3 akun demo).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-primary/5 border border-primary/15 p-3 space-y-2 text-xs">
              <p className="font-medium text-primary">Akun demo yang akan dibuat:</p>
              <ul className="space-y-1 text-muted-foreground font-mono">
                <li>• admin / admin123 (Administrator)</li>
                <li>• bendahara / bendahara123 (Bendahara)</li>
                <li>• pengelola / pengelola123 (Pengelola)</li>
              </ul>
            </div>
            <Button onClick={runSeed} disabled={seeding} className="w-full" size="lg">
              {seeding ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Menyiapkan data...
                </>
              ) : (
                <>
                  <Database size={16} className="mr-2" />
                  Inisialisasi Data Contoh
                </>
              )}
            </Button>
            <div className="pt-3 border-t border-border">
              <AnNahlTagline className="justify-center" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- Ready: normal app ----
  return <AppShell />;
}
