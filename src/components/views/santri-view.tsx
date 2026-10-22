"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
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
  Users,
  Pencil,
  Trash2,
  Eye,
  Phone,
  MapPin,
  Calendar,
  User,
  UserCircle,
  Filter,
  Wallet,
} from "lucide-react";
import { formatDate, formatRupiah } from "@/lib/format";
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

interface Santri {
  id: string;
  nis: string;
  nama: string;
  jenisKelamin: string;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  alamat: string | null;
  namaAyah: string | null;
  namaIbu: string | null;
  noHpOrtu: string | null;
  kelasId: string | null;
  kelas: { id: string; nama: string; tingkat: string } | null;
  tanggalMasuk: string;
  status: string;
  catatan: string | null;
  sppBulanan: number;
}

interface Kelas {
  id: string;
  nama: string;
  tingkat: string;
}

export function SantriView() {
  const [santri, setSantri] = useState<Santri[]>([]);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [detailSantri, setDetailSantri] = useState<Santri | null>(null);
  const [editing, setEditing] = useState<Santri | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Santri | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (filterKelas !== "all") params.set("kelasId", filterKelas);
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/santri?${params}`);
      const d = await res.json();
      setSantri(d.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, filterKelas, filterStatus]);

  useEffect(() => {
    refresh();
    fetch("/api/kelas")
      .then((r) => r.json())
      .then((d) => setKelas(d.data || []))
      .catch(console.error);
  }, [refresh]);

  useEffect(() => {
    const t = setTimeout(refresh, 300);
    return () => clearTimeout(t);
  }, [refresh]);

  const handleSave = async (formData: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const url = editing ? `/api/santri/${editing.id}` : "/api/santri";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(editing ? "Data santri diperbarui" : "Santri baru ditambahkan");
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
      const res = await fetch(`/api/santri/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success(`Santri ${deleteTarget.nama} dihapus`);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(String(err));
    }
  };

  const stats = useMemo(
    () => ({
      total: santri.length,
      aktif: santri.filter((s) => s.status === "aktif").length,
      laki: santri.filter((s) => s.jenisKelamin === "L").length,
      perempuan: santri.filter((s) => s.jenisKelamin === "P").length,
    }),
    [santri]
  );

  return (
    <div className="space-y-5">
      {/* Header & stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="Total Santri" value={stats.total} icon={Users} color="primary" />
        <MiniStat label="Santri Aktif" value={stats.aktif} icon={UserCircle} color="green" />
        <MiniStat label="Santri Laki-laki" value={stats.laki} icon={User} color="teal" />
        <MiniStat label="Santri Perempuan" value={stats.perempuan} icon={User} color="gold" />
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
                placeholder="Cari nama, NIS, nama ayah..."
                className="pl-9"
              />
            </div>
            <Select value={filterKelas} onValueChange={setFilterKelas}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter size={14} className="mr-1" />
                <SelectValue placeholder="Semua kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kelas</SelectItem>
                {kelas.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="nonaktif">Nonaktif</SelectItem>
                <SelectItem value="lulus">Lulus</SelectItem>
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
              Tambah Santri
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : santri.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users size={40} className="text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">Belum ada data santri</p>
              <p className="text-xs text-muted-foreground">Tambahkan santri pertama Anda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[120px]">NIS</TableHead>
                    <TableHead>Nama Santri</TableHead>
                    <TableHead className="hidden md:table-cell">L/P</TableHead>
                    <TableHead className="hidden lg:table-cell">Kelas</TableHead>
                    <TableHead className="hidden xl:table-cell">No. HP Ortu</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {santri.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs">{s.nis}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => setDetailSantri(s)}
                          className="font-medium text-left hover:text-primary transition"
                        >
                          {s.nama}
                        </button>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={s.jenisKelamin === "L" ? "border-sky-300 bg-sky-50 text-sky-700" : "border-pink-300 bg-pink-50 text-pink-700"}>
                          {s.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {s.kelas?.nama || "-"}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                        {s.noHpOrtu || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            s.status === "aktif"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : s.status === "lulus"
                              ? "border-blue-300 bg-blue-50 text-blue-700"
                              : "border-gray-300 bg-gray-50 text-gray-600"
                          }
                        >
                          {s.status === "aktif" ? "Aktif" : s.status === "lulus" ? "Lulus" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDetailSantri(s)}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditing(s);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(s)}
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

      {/* Form Dialog */}
      {formOpen && (
        <SantriForm
          key={editing?.id || "new"}
          open={formOpen}
          onOpenChange={setFormOpen}
          editing={editing}
          kelasList={kelas}
          onSubmit={handleSave}
          submitting={submitting}
        />
      )}

      {/* Detail Sheet */}
      <SantriDetail santri={detailSantri} onClose={() => setDetailSantri(null)} />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data santri?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data santri{" "}
              <strong>{deleteTarget?.nama}</strong> ({deleteTarget?.nis}) akan dihapus permanen.
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

function MiniStat({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "primary" | "teal" | "gold" | "green";
}) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    teal: "bg-teal-100 text-teal-700",
    gold: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
  };
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface SantriFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Santri | null;
  kelasList: Kelas[];
  onSubmit: (data: Record<string, unknown>) => void;
  submitting: boolean;
}

function SantriForm({ open, onOpenChange, editing, kelasList, onSubmit, submitting }: SantriFormProps) {
  const [form, setForm] = useState<Record<string, string>>(() => ({
    nis: editing?.nis || "",
    nama: editing?.nama || "",
    jenisKelamin: editing?.jenisKelamin || "L",
    tempatLahir: editing?.tempatLahir || "",
    tanggalLahir: editing?.tanggalLahir ? editing.tanggalLahir.split("T")[0] : "",
    alamat: editing?.alamat || "",
    namaAyah: editing?.namaAyah || "",
    namaIbu: editing?.namaIbu || "",
    noHpOrtu: editing?.noHpOrtu || "",
    kelasId: editing?.kelasId || "",
    tanggalMasuk: editing?.tanggalMasuk ? editing.tanggalMasuk.split("T")[0] : new Date().toISOString().split("T")[0],
    status: editing?.status || "aktif",
    catatan: editing?.catatan || "",
    sppBulanan: String(editing?.sppBulanan || 150000),
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
          <DialogTitle>{editing ? "Edit Data Santri" : "Tambah Santri Baru"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Perbarui informasi santri di bawah ini."
              : "Lengkapi formulir berikut untuk menambah santri baru. NIS akan dibuat otomatis jika dikosongkan."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nis">NIS (opsional)</Label>
              <Input
                id="nis"
                value={form.nis || ""}
                onChange={(e) => set("nis", e.target.value)}
                placeholder="Auto: SN-2025-001"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap *</Label>
              <Input
                id="nama"
                required
                value={form.nama || ""}
                onChange={(e) => set("nama", e.target.value)}
                placeholder="Nama lengkap santri"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jenisKelamin">Jenis Kelamin *</Label>
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
              <Input
                id="tempatLahir"
                value={form.tempatLahir || ""}
                onChange={(e) => set("tempatLahir", e.target.value)}
                placeholder="Kota kelahiran"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
              <Input
                id="tanggalLahir"
                type="date"
                value={form.tanggalLahir || ""}
                onChange={(e) => set("tanggalLahir", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat</Label>
            <Input
              id="alamat"
              value={form.alamat || ""}
              onChange={(e) => set("alamat", e.target.value)}
              placeholder="Alamat lengkap"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="namaAyah">Nama Ayah</Label>
              <Input
                id="namaAyah"
                value={form.namaAyah || ""}
                onChange={(e) => set("namaAyah", e.target.value)}
                placeholder="Nama lengkap ayah"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="namaIbu">Nama Ibu</Label>
              <Input
                id="namaIbu"
                value={form.namaIbu || ""}
                onChange={(e) => set("namaIbu", e.target.value)}
                placeholder="Nama lengkap ibu"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="noHpOrtu">No. HP Orang Tua</Label>
              <Input
                id="noHpOrtu"
                value={form.noHpOrtu || ""}
                onChange={(e) => set("noHpOrtu", e.target.value)}
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kelasId">Kelas</Label>
              <Select value={form.kelasId || "none"} onValueChange={(v) => set("kelasId", v === "none" ? "" : v)}>
                <SelectTrigger id="kelasId">
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tidak ada —</SelectItem>
                  {kelasList.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <SelectItem value="lulus">Lulus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tanggalMasuk">Tanggal Masuk</Label>
              <Input
                id="tanggalMasuk"
                type="date"
                value={form.tanggalMasuk || ""}
                onChange={(e) => set("tanggalMasuk", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sppBulanan">SPP Bulanan (Rp)</Label>
              <Input
                id="sppBulanan"
                type="number"
                min={0}
                value={form.sppBulanan || ""}
                onChange={(e) => set("sppBulanan", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan</Label>
            <Input
              id="catatan"
              value={form.catatan || ""}
              onChange={(e) => set("catatan", e.target.value)}
              placeholder="Catatan tambahan (opsional)"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Santri"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SantriDetail({ santri, onClose }: { santri: Santri | null; onClose: () => void }) {
  return (
    <Sheet open={!!santri} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detail Santri</SheetTitle>
        </SheetHeader>
        {santri && (
          <div className="px-4 pb-6 space-y-5">
            {/* Header card */}
            <div className="rounded-xl bg-gradient-to-br from-primary to-[oklch(0.28_0.06_150)] text-white p-5 -mx-1">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold ring-2 ring-white/30">
                  {santri.nama.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{santri.nama}</h3>
                  <p className="text-white/80 text-sm font-mono">{santri.nis}</p>
                  <Badge className="mt-1 bg-white/20 text-white border-white/20 hover:bg-white/30">
                    {santri.status === "aktif" ? "Aktif" : santri.status === "lulus" ? "Lulus" : "Nonaktif"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="space-y-3">
              <DetailRow icon={User} label="Jenis Kelamin" value={santri.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"} />
              <DetailRow icon={MapPin} label="Tempat, Tanggal Lahir" value={`${santri.tempatLahir || "-"}, ${formatDate(santri.tanggalLahir)}`} />
              <DetailRow icon={MapPin} label="Alamat" value={santri.alamat || "-"} />
              <DetailRow icon={User} label="Nama Ayah" value={santri.namaAyah || "-"} />
              <DetailRow icon={User} label="Nama Ibu" value={santri.namaIbu || "-"} />
              <DetailRow icon={Phone} label="No. HP Ortu" value={santri.noHpOrtu || "-"} />
              <DetailRow icon={UserCircle} label="Kelas" value={santri.kelas?.nama || "-"} />
              <DetailRow icon={Calendar} label="Tanggal Masuk" value={formatDate(santri.tanggalMasuk)} />
              <DetailRow icon={Wallet} label="SPP Bulanan" value={formatRupiah(santri.sppBulanan)} />
            </div>

            {santri.catatan && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Catatan</p>
                <p className="text-sm">{santri.catatan}</p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}
