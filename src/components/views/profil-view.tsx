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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  UserCircle,
  Mail,
  Phone,
  Lock,
  Save,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Calendar,
} from "lucide-react";
import { useSession } from "@/lib/session-store";
import { ROLE_LABELS } from "@/lib/auth";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

interface ProfilData {
  id: string;
  username: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  active: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export function ProfilView() {
  const { user, login } = useSession();
  const [profil, setProfil] = useState<ProfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
    password: "",
    passwordConfirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch("/api/pengaturan/profil")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setProfil(d.data);
          setForm({
            name: d.data.name || "",
            email: d.data.email || "",
            phone: d.data.phone || "",
            avatar: d.data.avatar || "",
            password: "",
            passwordConfirm: "",
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password && form.password !== form.passwordConfirm) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/pengaturan/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          avatar: form.avatar,
          password: form.password || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setProfil(d.data);
      // Update session store
      if (d.token && d.data) {
        login({
          id: d.data.id,
          username: d.data.username,
          name: d.data.name,
          role: d.data.role,
        });
      }
      setForm((f) => ({ ...f, password: "", passwordConfirm: "" }));
      toast.success("Profil berhasil diperbarui");
    } catch (err) {
      toast.error("Gagal: " + String(err).replace("Error: ", ""));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!profil) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Gagal memuat profil</p>
        </CardContent>
      </Card>
    );
  }

  const initials = profil.name.charAt(0).toUpperCase();

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-[oklch(0.28_0.06_150)] h-24 relative">
          <div className="absolute inset-0 pattern-islamic opacity-30" />
        </div>
        <CardContent className="p-6 -mt-12 relative">
          <div className="flex items-end gap-4">
            <div className="h-24 w-24 rounded-full bg-card border-4 border-card flex items-center justify-center text-3xl font-bold text-primary shadow-lg">
              {initials}
            </div>
            <div className="flex-1 pb-2">
              <h2 className="text-xl font-bold">{profil.name}</h2>
              <p className="text-sm text-muted-foreground">@{profil.username}</p>
              <Badge className="mt-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
                <Shield size={10} className="mr-1" />
                {ROLE_LABELS[profil.role as keyof typeof ROLE_LABELS] || profil.role}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar size={12} />
              <span>Bergabung sejak {formatDate(profil.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail size={12} />
              <span>{profil.email || "Belum ada email"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCircle size={16} />
            Edit Profil
          </CardTitle>
          <CardDescription>Perbarui informasi akun Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap *</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username (tidak bisa diubah)</Label>
                <Input
                  id="username"
                  value={profil.username}
                  disabled
                  className="bg-muted/50"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail size={12} /> Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@contoh.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone size={12} /> Nomor HP
                </Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-sm font-medium">
                <Lock size={12} /> Ubah Password
              </Label>
              <p className="text-xs text-muted-foreground">
                Kosongkan jika tidak ingin mengubah password.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password baru"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Konfirmasi password baru"
                  value={form.passwordConfirm}
                  onChange={(e) => setForm((f) => ({ ...f, passwordConfirm: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
