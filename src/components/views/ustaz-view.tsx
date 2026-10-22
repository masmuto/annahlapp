"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
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
import {
  Plus,
  Search,
  GraduationCap,
  Pencil,
  Trash2,
  Phone,
  Mail,
  BookMarked,
  Calendar,
  Users,
} from "lucide-react";
import { formatDate } from "@/lib/format";
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

interface Ustaz {
  id: string;
  nip: string | null;
  nama: string;
  jenisKelamin: string;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  alamat: string | null;
  noHp: string | null;
  email: string | null;
  spesialisasi: string | null;
  tanggalMasuk: string;
  status: string;
  catatan: string | null;
  kelas?: Array<{ id: string; nama: string }>;
}

export function UstazView() {
  const [ustaz, setUstaz] = useState<Ustaz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ustaz | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ustaz | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/ustaz?${params}`);
      const d = await res.json();
      setUstaz(d.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    const t = setTimeout(refresh, 300);
    return () => clearTimeout(t);
  }, [refresh]);

  const handleSave = async (formData: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const url = editing ? `/api/ustaz/${editing.id}` : "/api/ustaz";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(editing ? "Data ustaz diperbarui" : "Ustaz baru ditambahkan");
      setFormOpen(false);
      setEditing(null);
      refresh();
    } catch (err) {
      toast.error("Gagal menyimpan: " + String(err).replace("Error: ", ""));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/ustaz/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success(`Ustaz ${deleteTarget.nama} dihapus`);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(String(err));
    }
  };

  const stats = {
    total: ustaz.length,
    aktif: ustaz.filter((u) => u.status === "aktif").length,
    laki: ustaz.filter((u) => u.jenisKelamin === "L").length,
    perempuan: ustaz.filter((u) => u.jenisKelamin === "P").length,
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="Total Ustaz/Ustazah" value={stats.total} />
        <MiniStat label="Pengajar Aktif" value={stats.aktif} />
        <MiniStat label="Ustaz (L)" value={stats.laki} />
        <MiniStat label="Ustazah (P)" value={stats.perempuan} />
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, NIP, spesialisasi..."
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="nonaktif">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="shrink-0"
            >
              <Plus size={16} className="mr-1" />
              Tambah Ustaz
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards grid for ustaz */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : ustaz.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GraduationCap size={40} className="text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">Belum ada data ustaz/ustazah</p>
            <p className="text-xs text-muted-foreground">Tambahkan pengajar pertama Anda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ustaz.map((u) => (
            <Card key={u.id} className="overflow-hidden hover:shadow-md transition">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 border-b border-border">
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-semibold shrink-0 ${
                        u.jenisKelamin === "L" ? "bg-primary" : "bg-[oklch(0.5_0.1_330)]"
                      }`}
                    >
                      {u.nama.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{u.nama}</h3>
                      <p className="text-xs text-muted-foreground font-mono">
                        {u.nip || "Tanpa NIP"}
                      </p>
                      <Badge
                        variant="outline"
                        className={`mt-1 ${
                          u.status === "aktif"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-gray-300 bg-gray-50 text-gray-600"
                        }`}
                      >
                        {u.status === "aktif" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <BookMarked size={12} className="text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Spesialisasi:</span>
                    <span className="font-medium">{u.spesialisasi || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Phone size={12} className="text-muted-foreground shrink-0" />
                    <span className="font-medium">{u.noHp || "-"}</span>
                  </div>
                  {u.email && (
                    <div className="flex items-center gap-2 text-xs">
                      <Mail size={12} className="text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">{u.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar size={12} className="text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Bergabung:</span>
                    <span className="font-medium">{formatDate(u.tanggalMasuk)}</span>
                  </div>
                  {u.kelas && u.kelas.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <Users size={12} className="text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{u.kelas.length} kelas diampu</span>
                    </div>
                  )}
                  <div className="flex gap-1 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => {
                        setEditing(u);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil size={12} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/5"
                      onClick={() => setDeleteTarget(u)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UstazForm
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
            <AlertDialogTitle>Hapus data ustaz?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data{" "}
              <strong>{deleteTarget?.nama}</strong> akan dihapus permanen.
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

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
      </CardContent>
    </Card>
  );
}

interface UstazFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Ustaz | null;
  onSubmit: (data: Record<string, unknown>) => void;
  submitting: boolean;
}

function UstazForm({ open, onOpenChange, editing, onSubmit, submitting }: UstazFormProps) {
  const [form, setForm] = useState<Record<string, string>>(() => ({
    nip: editing?.nip || "",
    nama: editing?.nama || "",
    jenisKelamin: editing?.jenisKelamin || "L",
    tempatLahir: editing?.tempatLahir || "",
    tanggalLahir: editing?.tanggalLahir ? editing.tanggalLahir.split("T")[0] : "",
    alamat: editing?.alamat || "",
    noHp: editing?.noHp || "",
    email: editing?.email || "",
    spesialisasi: editing?.spesialisasi || "Tahfidz",
    tanggalMasuk: editing?.tanggalMasuk ? editing.tanggalMasuk.split("T")[0] : new Date().toISOString().split("T")[0],
    status: editing?.status || "aktif",
    catatan: editing?.catatan || "",
  }));

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Data Ustaz" : "Tambah Ustaz/Ustazah"}</DialogTitle>
          <DialogDescription>
            {editing ? "Perbarui informasi pengajar." : "Lengkapi formulir untuk menambah pengajar baru."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nip">NIP</Label>
              <Input id="nip" value={form.nip || ""} onChange={(e) => set("nip", e.target.value)} placeholder="Nomor induk pengajar" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap *</Label>
              <Input id="nama" required value={form.nama || ""} onChange={(e) => set("nama", e.target.value)} placeholder="Nama lengkap" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
              <Select value={form.jenisKelamin} onValueChange={(v) => set("jenisKelamin", v)}>
                <SelectTrigger id="jenisKelamin">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Laki-laki</SelectItem>
                  <SelectItem value="P">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tempatLahir">Tempat Lahir</Label>
              <Input id="tempatLahir" value={form.tempatLahir || ""} onChange={(e) => set("tempatLahir", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
              <Input id="tanggalLahir" type="date" value={form.tanggalLahir || ""} onChange={(e) => set("tanggalLahir", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat</Label>
            <Input id="alamat" value={form.alamat || ""} onChange={(e) => set("alamat", e.target.value)} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="noHp">No. HP</Label>
              <Input id="noHp" value={form.noHp || ""} onChange={(e) => set("noHp", e.target.value)} placeholder="08xxxxxxxxxx" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spesialisasi">Spesialisasi</Label>
              <Select value={form.spesialisasi} onValueChange={(v) => set("spesialisasi", v)}>
                <SelectTrigger id="spesialisasi">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tahfidz">Tahfidz</SelectItem>
                  <SelectItem value="Tahsin">Tahsin</SelectItem>
                  <SelectItem value="Tajwid">Tajwid</SelectItem>
                  <SelectItem value="Iqra">Iqra</SelectItem>
                  <SelectItem value="Tadarus">Tadarus</SelectItem>
                  <SelectItem value="Tafsir">Tafsir</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggalMasuk">Tanggal Masuk</Label>
              <Input id="tanggalMasuk" type="date" value={form.tanggalMasuk || ""} onChange={(e) => set("tanggalMasuk", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="nonaktif">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan</Label>
            <Input id="catatan" value={form.catatan || ""} onChange={(e) => set("catatan", e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Ustaz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
