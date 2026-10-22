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
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  UserCog,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Shield,
  Calendar,
  Eye,
  EyeOff,
  Loader2,
  Lock,
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
import { formatDate } from "@/lib/format";
import { useSession } from "@/lib/session-store";

interface UserRow {
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

const ROLE_COLORS: Record<string, string> = {
  admin: "border-primary/40 bg-primary/10 text-primary",
  bendahara: "border-amber-300 bg-amber-50 text-amber-700",
  pengelola: "border-teal-300 bg-teal-50 text-teal-700",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  bendahara: "Bendahara",
  pengelola: "Pengelola",
};

export function UserManagerView() {
  const { user: currentUser } = useSession();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const d = await res.json();
      if (res.ok) {
        setUsers(d.data || []);
      } else {
        toast.error(d.error || "Gagal memuat users");
        setUsers([]);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSave = async (formData: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const url = editing ? `/api/users/${editing.id}` : "/api/users";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(editing ? "User diperbarui" : "User baru ditambahkan");
      setFormOpen(false);
      setEditing(null);
      refresh();
    } catch (err) {
      toast.error("Gagal: " + String(err).replace("Error: ", ""));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(`User ${deleteTarget.name} dihapus`);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(String(err).replace("Error: ", ""));
    }
  };

  const toggleActive = async (u: UserRow) => {
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !u.active }),
      });
      if (!res.ok) throw new Error("Gagal");
      toast.success(`${u.name} ${u.active ? "dinonaktifkan" : "diaktifkan"}`);
      refresh();
    } catch (err) {
      toast.error(String(err));
    }
  };

  const stats = {
    total: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    bendahara: users.filter((u) => u.role === "bendahara").length,
    pengelola: users.filter((u) => u.role === "pengelola").length,
    active: users.filter((u) => u.active).length,
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="Total User" value={stats.total} color="primary" />
        <MiniStat label="Admin" value={stats.admin} color="gold" />
        <MiniStat label="Bendahara" value={stats.bendahara} color="green" />
        <MiniStat label="Pengelola" value={stats.pengelola} color="teal" />
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Daftar Pengguna</h2>
            <p className="text-xs text-muted-foreground">
              Kelola akun admin, bendahara, dan pengelola aplikasi
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} className="mr-1" />
            Tambah User
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <UserCog size={40} className="text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">Belum ada user</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>User</TableHead>
                    <TableHead className="hidden md:table-cell">Role</TableHead>
                    <TableHead className="hidden lg:table-cell">Kontak</TableHead>
                    <TableHead className="hidden xl:table-cell">Dibuat</TableHead>
                    <TableHead className="text-center">Aktif</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {u.name}
                              {currentUser?.id === u.id && (
                                <span className="ml-2 text-[10px] text-primary">(Anda)</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">@{u.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={ROLE_COLORS[u.role] || ""}>
                          <Shield size={10} className="mr-1" />
                          {ROLE_LABELS[u.role] || u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-xs space-y-0.5">
                          {u.email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail size={10} /> {u.email}
                            </div>
                          )}
                          {u.phone && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone size={10} /> {u.phone}
                            </div>
                          )}
                          {!u.email && !u.phone && <span className="text-muted-foreground">-</span>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar size={10} />
                          {formatDate(u.createdAt, { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={u.active}
                          onCheckedChange={() => toggleActive(u)}
                          disabled={currentUser?.id === u.id}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditing(u);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteTarget(u)}
                            disabled={currentUser?.id === u.id}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UserForm
        key={editing?.id || "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSubmit={handleSave}
        submitting={submitting}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus user?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun <strong>{deleteTarget?.name}</strong> (@{deleteTarget?.username}) akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: "primary" | "teal" | "gold" | "green" }) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    teal: "bg-teal-100 text-teal-700",
    gold: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${colors[color]} mb-2`}>
          <UserCog size={14} />
        </div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

interface UserFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: UserRow | null;
  onSubmit: (data: Record<string, unknown>) => void;
  submitting: boolean;
}

function UserForm({ open, onOpenChange, editing, onSubmit, submitting }: UserFormProps) {
  const [form, setForm] = useState<Record<string, string>>(() => ({
    username: editing?.username || "",
    name: editing?.name || "",
    role: editing?.role || "pengelola",
    email: editing?.email || "",
    phone: editing?.phone || "",
    password: "",
    passwordConfirm: "",
  }));
  const [showPassword, setShowPassword] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password && form.password !== form.passwordConfirm) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    const payload: Record<string, unknown> = {
      username: form.username,
      name: form.name,
      role: form.role,
      email: form.email,
      phone: form.phone,
    };
    if (form.password) payload.password = form.password;
    if (editing) {
      delete payload.username; // can't change username
    }
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit User" : "Tambah User Baru"}</DialogTitle>
          <DialogDescription>
            {editing
              ? `Perbarui informasi akun ${editing.name}.`
              : "Buat akun baru untuk admin, bendahara, atau pengelola."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                required
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
                disabled={!!editing}
                className={editing ? "bg-muted/50" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={form.role} onValueChange={(v) => set("role", v)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="bendahara">Bendahara</SelectItem>
                  <SelectItem value="pengelola">Pengelola</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap *</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor HP</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-sm font-medium">
              <Lock size={12} />
              {editing ? "Password Baru (kosongkan jika tidak diubah)" : "Password *"}
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={editing ? "••••••••" : "Min 4 karakter"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required={!editing}
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
            {form.password && (
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Konfirmasi password"
                value={form.passwordConfirm}
                onChange={(e) => set("passwordConfirm", e.target.value)}
              />
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
              {editing ? "Simpan" : "Tambah User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
