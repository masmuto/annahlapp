"use client";

import { AppShell } from "@/components/app-shell";
import { useEffect, useState } from "react";
import { Database, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnNahlLogo, AnNahlTagline } from "@/components/an-nahl-logo";
import { toast } from "sonner";

export default function Home() {
  const [needsSeed, setNeedsSeed] = useState<boolean | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Check if database has users
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(() => {
        // If we get here, the API is working. Try login as admin to see if seed needed.
        return fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "admin", password: "admin123" }),
        });
      })
      .then((r) => {
        if (r.ok) {
          setNeedsSeed(false);
        } else {
          setNeedsSeed(true);
        }
      })
      .catch(() => setNeedsSeed(true));
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
      setNeedsSeed(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSeeding(false);
    }
  };

  if (needsSeed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat GO An Nahl...</p>
        </div>
      </div>
    );
  }

  if (needsSeed) {
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

  return <AppShell />;
}
