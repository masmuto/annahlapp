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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  School,
  Pencil,
  Trash2,
  Users,
  GraduationCap,
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

interface Kelas {
  id: string;
  nama: string;
  tingkat: string;
  ustazId: string | null;
  ustaz?: { id: string; nama: string } | null;
  kapasitas: number;
  keterangan: string | null;
  _count?: { santri: number };
}

interface Ustaz {
  id: string;
  nama: string;
  spesialisasi: string | null;
}

const TINGKAT_LIST = ["Iqra", "Tahsin", "Tahfidz", "Tadarus", "Tajwid", "Tafsir"];
const TINGKAT_COLORS: Record<string, string> = {
  Iqra: "border-sky-300 bg-sky-50 text-sky-700",
  Tahsin: "border-teal-300 bg-teal-50 text-teal-700",
  Tahfidz: "border-primary/40 bg-primary/10 text-primary",
  Tadarus: "border-amber-300 bg-amber-50 text-amber-700",
  Tajwid: "border-purple-300 bg-purple-50 text-purple-700",
  Tafsir: "border-rose-300 bg-rose-50 text-rose-700",
};

export function KelasView() {
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [ustaz, setUstaz] = useState<Ustaz[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Kelas | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Kelas | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kelas");
      const d = await res.json();
      setKelas(d.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    fetch("/api/ustaz")
      .then((r) => r.json())
      .then((d) => setUstaz(d.data || []))
      .catch(console.error);
  }, []);

  const handleSave = async (formData: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const url = editing ? `/api/kelas/${editing.id}` : "/api/kelas";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(editing ? "Kelas diperbarui" : "Kelas baru ditambahkan");
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
      const res = await fetch(`/api/kelas/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Gagal menghapus");
      }
      toast.success(`Kelas ${deleteTarget.nama} dihapus`);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(String(err));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pengaturan Kelas</h2>
          <p className="text-sm text-muted-foreground">Kelola kelas-kelas Tahfidz An Nahl</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} className="mr-1" />
          Tambah Kelas
        </Button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : kelas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <School size={40} className="text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">Belum ada kelas</p>
            <p className="text-xs text-muted-foreground">Tambahkan kelas pertama Anda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kelas.map((k) => {
            const tingkatColor = TINGKAT_COLORS[k.tingkat] || "border-gray-300 bg-gray-50 text-gray-700";
            const utilization = k._count?.santri ? Math.round((k._count.santri / k.kapasitas) * 100) : 0;
            return (
              <Card key={k.id} className="overflow-hidden hover:shadow-md transition">
                <CardContent className="p-0">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <School size={18} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{k.nama}</h3>
                          <Badge variant="outline" className={`text-[10px] ${tingkatColor}`}>
                            {k.tingkat}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditing(k);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil size={12} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => setDeleteTarget(k)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <GraduationCap size={12} className="text-muted-foreground" />
                        <span className="text-muted-foreground">Pengampu:</span>
                        <span className="font-medium">{k.ustaz?.nama || "Belum ditentukan"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Users size={12} className="text-muted-foreground" />
                        <span className="text-muted-foreground">Santri:</span>
                        <span className="font-medium">
                          {k._count?.santri || 0} / {k.kapasitas}
                        </span>
                      </div>
                    </div>
                    {/* Utilization bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Kapasitas</span>
                        <span>{utilization}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            utilization >= 90
                              ? "bg-destructive"
                              : utilization >= 70
                              ? "bg-amber-500"
                              : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                    </div>
                    {k.keterangan && (
                      <p className="text-xs text-muted-foreground mt-3 italic line-clamp-2">
                        {k.keterangan}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <KelasForm
        key={editing?.id || "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        ustazList={ustaz}
        onSubmit={handleSave}
        submitting={submitting}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kelas?</AlertDialogTitle>
            <AlertDialogDescription>
              Kelas <strong>{deleteTarget?.nama}</strong> akan dihapus. Santri yang terdaftar di kelas ini akan kehilangan kelas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function KelasForm({
  open,
  onOpenChange,
  editing,
  ustazList,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Kelas | null;
  ustazList: Ustaz[];
  onSubmit: (data: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState<Record<string, string>>(() => ({
    nama: editing?.nama || "",
    tingkat: editing?.tingkat || "Tahfidz",
    ustazId: editing?.ustazId || "none",
    kapasitas: String(editing?.kapasitas || 20),
    keterangan: editing?.keterangan || "",
  }));

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    if (form.ustazId === "none") payload.ustazId = "";
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Kelas" : "Tambah Kelas Baru"}</DialogTitle>
          <DialogDescription>
            {editing ? "Perbarui informasi kelas." : "Lengkapi formulir untuk menambah kelas baru."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Kelas *</Label>
            <Input id="nama" required value={form.nama || ""} onChange={(e) => set("nama", e.target.value)} placeholder="Contoh: Kelas A - Iqra 1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tingkat">Tingkat</Label>
              <Select value={form.tingkat} onValueChange={(v) => set("tingkat", v)}>
                <SelectTrigger id="tingkat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TINGKAT_LIST.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kapasitas">Kapasitas</Label>
              <Input id="kapasitas" type="number" min={1} value={form.kapasitas || ""} onChange={(e) => set("kapasitas", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ustazId">Ustaz/Ustazah Pengampu</Label>
            <Select value={form.ustazId || "none"} onValueChange={(v) => set("ustazId", v)}>
              <SelectTrigger id="ustazId">
                <SelectValue placeholder="Pilih pengampu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Tidak ada —</SelectItem>
                {ustazList.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nama} {u.spesialisasi ? `(${u.spesialisasi})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan</Label>
            <Input id="keterangan" value={form.keterangan || ""} onChange={(e) => set("keterangan", e.target.value)} placeholder="Catatan kelas (opsional)" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Kelas"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
