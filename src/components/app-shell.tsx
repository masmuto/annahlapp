"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/session-store";
import { useAppNav } from "@/lib/use-app-nav";
import { LoginPage } from "@/components/views/login-page";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { Topbar } from "@/components/topbar";
import { DashboardView } from "@/components/views/dashboard-view";
import { SantriView } from "@/components/views/santri-view";
import { UstazView } from "@/components/views/ustaz-view";
import { KelasView } from "@/components/views/kelas-view";
import { KelompokView } from "@/components/views/kelompok-view";
import { PembayaranView } from "@/components/views/pembayaran-view";
import { LaporanView } from "@/components/views/laporan-view";
import { ProfilView } from "@/components/views/profil-view";
import { UserManagerView } from "@/components/views/users-view";
import { DatabaseView } from "@/components/views/database-view";
import { WhatsAppView } from "@/components/views/whatsapp-view";
import { SupabaseSetupView } from "@/components/views/supabase-setup-view";
import { AnNahlTagline } from "@/components/an-nahl-logo";
import { Loader2 } from "lucide-react";

export function AppShell() {
  const { user, isAuthed, hydrated, logout } = useSession();
  const { view, navigate } = useAppNav();
  const [collapsed, setCollapsed] = useState(false);
  const [booting, setBooting] = useState(true);
  const [showSeedPrompt, setShowSeedPrompt] = useState(false);

  // Verify session with backend on mount
  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (active && d.user) {
          useSession.getState().login(d.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setBooting(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    useSession.getState().logout();
  };

  if (booting || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat GO An Nahl...</p>
        </div>
      </div>
    );
  }

  if (!isAuthed || !user) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar
        view={view}
        onNavigate={(v) => navigate(v)}
        onLogout={handleLogout}
        user={user}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          view={view}
          onNavigate={(v) => navigate(v)}
          onLogout={handleLogout}
          user={user}
        />

        <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {view === "dashboard" && <DashboardView />}
            {view === "santri" && <SantriView />}
            {view === "ustaz" && <UstazView />}
            {view === "kelas" && <KelasView />}
            {view === "kelompok" && <KelompokView />}
            {view === "pembayaran" && <PembayaranView />}
            {view === "laporan" && <LaporanView />}
            {view === "profil" && <ProfilView />}
            {view === "users" && <UserManagerView />}
            {view === "database" && <DatabaseView />}
            {view === "whatsapp" && <WhatsAppView />}
            {view === "supabase-setup" && <SupabaseSetupView />}
          </div>

          {/* Footer */}
          <footer className="max-w-7xl mx-auto mt-8 pt-6 border-t border-border">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <p>© {new Date().getFullYear()} Rumah Tahfidz An Nahl — Sistem Manajemen Santri & SPP</p>
              <AnNahlTagline />
            </div>
          </footer>
        </main>
      </div>

      <BottomNav view={view} onNavigate={(v) => navigate(v)} />

      {/* Seed prompt for first-time use */}
      {showSeedPrompt && (
        <SeedPrompt onClose={() => setShowSeedPrompt(false)} />
      )}
    </div>
  );
}

import { useState as useState2 } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button as Button2 } from "@/components/ui/button";
import { Database, Loader2 as Loader2Icon } from "lucide-react";
import { toast as sonnerToast } from "sonner";

function SeedPrompt({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState2(false);
  const runSeed = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Gagal seed");
      sonnerToast.success(`Seed berhasil! ${d.summary?.santri || 0} santri, ${d.summary?.ustaz || 0} ustaz, ${d.summary?.kelas || 0} kelas`);
      onClose();
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      sonnerToast.error(String(err));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={18} className="text-primary" />
            Inisialisasi Data
          </CardTitle>
          <CardDescription>
            Database masih kosong. Klik tombol di bawah untuk mengisi data contoh (85 santri, 8 ustaz, 6 kelas, dan riwayat pembayaran SPP).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button2 variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            Nanti saja
          </Button2>
          <Button2 className="flex-1" onClick={runSeed} disabled={loading}>
            {loading ? (
              <>
                <Loader2Icon size={14} className="mr-1 animate-spin" />
                Menyiapkan...
              </>
            ) : (
              "Isi Data Contoh"
            )}
          </Button2>
        </CardContent>
      </Card>
    </div>
  );
}
