"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnNahlLogo, AnNahlTagline } from "@/components/an-nahl-logo";
import { useSession } from "@/lib/session-store";
import { BookOpen, Eye, EyeOff, Loader2, LogIn, ShieldCheck, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const DEMO_ACCOUNTS = [
  { username: "admin", password: "admin123", role: "Administrator", icon: ShieldCheck },
  { username: "bendahara", password: "bendahara123", role: "Bendahara", icon: Users },
  { username: "pengelola", password: "pengelola123", role: "Pengelola", icon: Sparkles },
];

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const login = useSession((s) => s.login);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login gagal");
        return;
      }
      login(data.user);
      toast.success(`Selamat datang, ${data.user.name}!`);
      onLoginSuccess();
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: branding */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 pattern-islamic text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-[oklch(0.32_0.07_150)] to-[oklch(0.22_0.05_150)]" />
        <div className="absolute top-10 right-10 w-48 h-48 rounded-full border-2 border-white/10" />
        <div className="absolute top-16 right-16 w-36 h-36 rounded-full border border-white/15" />
        <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full border-2 border-white/10" />
        <div className="absolute bottom-24 left-14 w-48 h-48 rounded-full border border-white/15" />

        <div className="relative z-10">
          <AnNahlLogo variant="light" size="lg" />
        </div>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-medium mb-6">
            <BookOpen size={14} />
            <span>Sistem Manajemen Rumah Tahfidz</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Bersama Al-Qur&apos;an
            <br />
            Membangun Generasi
            <br />
            <span className="text-amber-300">Qur&apos;ani</span>
          </h2>
          <p className="text-white/80 text-base leading-relaxed">
            Platform terpadu untuk pengelolaan data santri, pembayaran SPP,
            jadwal pembelajaran, dan laporan keuangan Rumah Tahfidz An Nahl.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 max-w-md">
          {[
            { label: "Santri Aktif", value: "85+" },
            { label: "Ustaz/Ustazah", value: "8" },
            { label: "Kelas Tahfidz", value: "6" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10"
            >
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-white/70">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <AnNahlLogo variant="dark" size="lg" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Selamat Datang</h1>
            <p className="text-sm text-muted-foreground">
              Masuk ke akun Anda untuk mengakses dashboard GO An Nahl.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                autoComplete="username"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  autoComplete="current-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-base font-semibold"
              size="lg"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <LogIn size={18} className="mr-2" />
                  Masuk
                </>
              )}
            </Button>
          </form>

          <div className="mt-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">
                Akun demo (klik untuk isi otomatis)
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => quickLogin(acc.username, acc.password)}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition text-center"
                  >
                    <Icon size={18} className="text-primary" />
                    <span className="text-xs font-medium">{acc.role}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {acc.username}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <AnNahlTagline className="justify-center" />
          </div>
        </div>
      </div>
    </div>
  );
}
