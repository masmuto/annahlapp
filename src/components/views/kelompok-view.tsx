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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  UsersRound,
  Clock,
  Pencil,
  Trash2,
  MapPin,
  GraduationCap,
  UserPlus,
  UserMinus,
  Search,
  CalendarDays,
  BookOpen,
  Loader2,
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

interface JadwalItem {
  id: string;
  kelompokId: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
}

interface Kelompok {
  id: string;
  nama: string;
  ustazId: string | null;
  ustaz: { id: string; nama: string; spesialisasi: string | null } | null;
  mataPelajaran: string;
  ruangan: string | null;
  kapasitas: number;
  catatan: string | null;
  status: string;
  jadwal: JadwalItem[];
  _count?: { anggota: number };
}

interface Ustaz {
  id: string;
  nama: string;
  spesialisasi: string | null;
}

interface Santri {
  id: string;
  nis: string;
  nama: string;
  jenisKelamin: string;
  kelas: { id: string; nama: string } | null;
  status: string;
}

interface Anggota {
  id: string;
  kelompokId: string;
  santriId: string;
  tanggalBergabung: string;
  catatan: string | null;
  santri: Santri;
}

interface KelompokDetail extends Kelompok {
  anggota: Anggota[];
}

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];
const MAPEL_LIST = ["Tahfidz", "Tahsin", "Tajwid", "Iqra", "Tadarus", "Tafsir"];

const MAPEL_COLORS: Record<string, string> = {
  Tahfidz: "border-primary/40 bg-primary/10 text-primary",
  Tahsin: "border-teal-300 bg-teal-50 text-teal-700",
  Tajwid: "border-purple-300 bg-purple-50 text-purple-700",
  Iqra: "border-sky-300 bg-sky-50 text-sky-700",
  Tadarus: "border-amber-300 bg-amber-50 text-amber-700",
  Tafsir: "border-rose-300 bg-rose-50 text-rose-700",
};

const HARI_COLORS: Record<string, string> = {
  Senin: "from-sky-500 to-sky-600",
  Selasa: "from-teal-500 to-teal-600",
  Rabu: "from-emerald-500 to-emerald-600",
  Kamis: "from-amber-500 to-amber-600",
  Jumat: "from-primary to-[oklch(0.28_0.06_150)]",
  Sabtu: "from-purple-500 to-purple-600",
  Ahad: "from-rose-500 to-rose-600",
};

const HARI_TEXT_COLORS: Record<string, string> = {
  Senin: "text-sky-700",
  Selasa: "text-teal-700",
  Rabu: "text-emerald-700",
  Kamis: "text-amber-700",
  Jumat: "text-primary",
  Sabtu: "text-purple-700",
  Ahad: "text-rose-700",
};

export function KelompokView() {
  const [kelompokList, setKelompokList] = useState<Kelompok[]>([]);
  const [ustaz, setUstaz] = useState<Ustaz[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterHari, setFilterHari] = useState("all");
  const [filterMapel, setFilterMapel] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Kelompok | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Kelompok | null>(null);
  const [detailKelompok, setDetailKelompok] = useState<KelompokDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterHari !== "all") params.set("hari", filterHari);
      if (filterMapel !== "all") params.set("mataPelajaran", filterMapel);
      const res = await fetch(`/api/kelompok-belajar?${params}`);
      const d = await res.json();
      setKelompokList(d.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterHari, filterMapel]);

  useEffect(() => {
    refresh();
    fetch("/api/ustaz")
      .then((r) => r.json())
      .then((d) => setUstaz(d.data || []))
      .catch(console.error);
  }, [refresh]);

  const handleSave = async (formData: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const url = editing ? `/api/kelompok-belajar/${editing.id}` : "/api/kelompok-belajar";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(editing ? "Kelompok belajar diperbarui" : "Kelompok belajar baru ditambahkan");
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
      const res = await fetch(`/api/kelompok-belajar/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success(`Kelompok "${deleteTarget.nama}" dihapus`);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(String(err));
    }
  };

  const openDetail = async (k: Kelompok) => {
    try {
      const res = await fetch(`/api/kelompok-belajar/${k.id}`);
      const d = await res.json();
      if (d.data) {
        setDetailKelompok(d.data);
        setDetailOpen(true);
      }
    } catch (err) {
      toast.error("Gagal memuat detail kelompok");
    }
  };

  const totalAnggota = kelompokList.reduce((s, k) => s + (k._count?.anggota || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header & stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="Total Kelompok" value={kelompokList.length} icon={UsersRound} color="primary" />
        <MiniStat label="Total Anggota" value={totalAnggota} icon={GraduationCap} color="teal" />
        <MiniStat
          label="Mata Pelajaran"
          value={new Set(kelompokList.map((k) => k.mataPelajaran)).size}
          icon={BookOpen}
          color="gold"
        />
        <MiniStat
          label="Ustaz Aktif"
          value={new Set(kelompokList.map((k) => k.ustazId).filter(Boolean)).size}
          icon={GraduationCap}
          color="green"
        />
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={filterMapel} onValueChange={setFilterMapel}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Semua mata pelajaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mapel</SelectItem>
                {MAPEL_LIST.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterHari} onValueChange={setFilterHari}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Semua hari" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Hari</SelectItem>
                {HARI_LIST.map((h) => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="shrink-0"
            >
              <Plus size={16} className="mr-1" />
              Tambah Kelompok
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : kelompokList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <UsersRound size={40} className="text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">Belum ada kelompok belajar</p>
            <p className="text-xs text-muted-foreground">Tambahkan kelompok pertama Anda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kelompokList.map((k) => {
            const anggotaCount = k._count?.anggota || 0;
            const utilization = Math.round((anggotaCount / k.kapasitas) * 100);
            const mapelColor = MAPEL_COLORS[k.mataPelajaran] || "border-gray-300 bg-gray-50 text-gray-700";
            const jadwalList = k.jadwal || [];
            const firstHari = jadwalList[0]?.hari || "Senin";
            const hariColor = HARI_COLORS[firstHari] || "from-primary to-[oklch(0.28_0.06_150)]";
            return (
              <Card
                key={k.id}
                className="overflow-hidden hover:shadow-md transition cursor-pointer group"
                onClick={() => openDetail(k)}
              >
                <CardContent className="p-0">
                  {/* Color bar top */}
                  <div className={`bg-gradient-to-r ${hariColor} h-1.5`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-[10px] ${mapelColor}`}>
                            {k.mataPelajaran}
                          </Badge>
                          {jadwalList.length > 0 && (
                            <Badge variant="outline" className="text-[10px] border-sky-300 bg-sky-50 text-sky-700">
                              <CalendarDays size={9} className="mr-0.5" />
                              {jadwalList.length} hari
                            </Badge>
                          )}
                          {k.status !== "aktif" && (
                            <Badge variant="outline" className="text-[10px] border-gray-300 bg-gray-50 text-gray-600">
                              {k.status}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition">
                          {k.nama}
                        </h3>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(k);
                          }}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {/* Multi-hari jadwal */}
                      <div className="text-xs">
                        <div className="flex items-center gap-1.5 mb-1.5 text-muted-foreground">
                          <CalendarDays size={12} className="shrink-0" />
                          <span className="font-medium">Jadwal:</span>
                        </div>
                        {jadwalList.length === 0 ? (
                          <p className="text-[11px] text-amber-600 italic pl-4">
                            Belum ada jadwal
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1 pl-4">
                            {jadwalList.map((j) => (
                              <span
                                key={j.id}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-muted hover:bg-muted/70 border border-border"
                                title={`${j.hari} ${j.jamMulai}-${j.jamSelesai}`}
                              >
                                <span className={`font-semibold ${HARI_TEXT_COLORS[j.hari] || "text-foreground"}`}>
                                  {j.hari.slice(0, 3)}
                                </span>
                                <span className="text-muted-foreground">{j.jamMulai}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <GraduationCap size={12} className="text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Pembimbing:</span>
                        <span className="font-medium truncate">{k.ustaz?.nama || "Belum ditentukan"}</span>
                      </div>
                      {k.ruangan && (
                        <div className="flex items-center gap-2 text-xs">
                          <MapPin size={12} className="text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">{k.ruangan}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        <UsersRound size={12} className="text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Anggota:</span>
                        <span className="font-medium">{anggotaCount} / {k.kapasitas}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Kapasitas</span>
                        <span>{utilization}%</span>
                      </div>
                      <Progress
                        value={utilization}
                        className="h-1.5"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      {formOpen && (
        <KelompokForm
          key={editing?.id || "new"}
          open={formOpen}
          onOpenChange={setFormOpen}
          editing={editing}
          ustazList={ustaz}
          onSubmit={handleSave}
          submitting={submitting}
        />
      )}

      {/* Detail Sheet with member management */}
      <Sheet open={detailOpen} onOpenChange={(o) => {
        setDetailOpen(o);
        if (!o) setDetailKelompok(null);
      }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detail Kelompok Belajar</SheetTitle>
          </SheetHeader>
          {detailKelompok && (
            <KelompokDetailPanel
              kelompok={detailKelompok}
              onRefresh={async () => {
                const res = await fetch(`/api/kelompok-belajar/${detailKelompok.id}`);
                const d = await res.json();
                if (d.data) setDetailKelompok(d.data);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kelompok belajar?</AlertDialogTitle>
            <AlertDialogDescription>
              Kelompok <strong>{deleteTarget?.nama}</strong> beserta semua anggotanya akan dihapus permanen.
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

interface KelompokFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Kelompok | null;
  ustazList: Ustaz[];
  onSubmit: (data: Record<string, unknown>) => void;
  submitting: boolean;
}

function KelompokForm({ open, onOpenChange, editing, ustazList, onSubmit, submitting }: KelompokFormProps) {
  const [form, setForm] = useState<Record<string, string>>(() => ({
    nama: editing?.nama || "",
    ustazId: editing?.ustazId || "none",
    mataPelajaran: editing?.mataPelajaran || "Tahfidz",
    ruangan: editing?.ruangan || "",
    kapasitas: String(editing?.kapasitas || 15),
    catatan: editing?.catatan || "",
    status: editing?.status || "aktif",
  }));

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) {
      toast.error("Nama kelompok wajib diisi");
      return;
    }
    const payload: Record<string, unknown> = { ...form };
    if (form.ustazId === "none") payload.ustazId = "";
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Kelompok Belajar" : "Tambah Kelompok Belajar"}</DialogTitle>
          <DialogDescription>
            Kelompok belajar adalah kelompok santri yang belajar bersama.
            {editing ? " Jadwal dan anggota dikelola di halaman detail." : " Setelah dibuat, tambah jadwal & anggota dari halaman detail."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Kelompok *</Label>
            <Input
              id="nama"
              required
              value={form.nama || ""}
              onChange={(e) => set("nama", e.target.value)}
              placeholder="Contoh: Kelompok Tahfidz Pagi A"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mataPelajaran">Mata Pelajaran</Label>
              <Select value={form.mataPelajaran} onValueChange={(v) => set("mataPelajaran", v)}>
                <SelectTrigger id="mataPelajaran">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAPEL_LIST.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
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
                  <SelectItem value="selesai">Selesai</SelectItem>
                  <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ustazId">Pembimbing (Ustaz/Ustazah)</Label>
            <Select value={form.ustazId || "none"} onValueChange={(v) => set("ustazId", v)}>
              <SelectTrigger id="ustazId">
                <SelectValue placeholder="Pilih pembimbing" />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ruangan">Ruangan</Label>
              <Input
                id="ruangan"
                value={form.ruangan || ""}
                onChange={(e) => set("ruangan", e.target.value)}
                placeholder="Contoh: Ruang A1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kapasitas">Kapasitas Anggota</Label>
              <Input
                id="kapasitas"
                type="number"
                min={1}
                value={form.kapasitas || ""}
                onChange={(e) => set("kapasitas", e.target.value)}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Kelompok"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function KelompokDetailPanel({
  kelompok,
  onRefresh,
}: {
  kelompok: KelompokDetail;
  onRefresh: () => Promise<void>;
}) {
  const [allSantri, setAllSantri] = useState<Santri[]>([]);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/santri?status=aktif")
      .then((r) => r.json())
      .then((d) => setAllSantri(d.data || []))
      .catch(console.error);
  }, []);

  const anggotaIds = new Set(kelompok.anggota.map((a) => a.santriId));
  const availableSantri = allSantri.filter((s) => {
    if (anggotaIds.has(s.id)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q);
  });

  const addAnggota = async (santriId: string) => {
    setAdding(true);
    try {
      const res = await fetch(`/api/kelompok-belajar/${kelompok.id}/anggota`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ santriId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(`${d.data.santri.nama} ditambahkan ke kelompok`);
      await onRefresh();
    } catch (err) {
      toast.error(String(err).replace("Error: ", ""));
    } finally {
      setAdding(false);
    }
  };

  const removeAnggota = async (anggotaId: string, nama: string) => {
    setRemovingId(anggotaId);
    try {
      const res = await fetch(`/api/kelompok-belajar/${kelompok.id}/anggota/${anggotaId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success(`${nama} dikeluarkan dari kelompok`);
      await onRefresh();
    } catch (err) {
      toast.error(String(err));
    } finally {
      setRemovingId(null);
    }
  };

  const mapelColor = MAPEL_COLORS[kelompok.mataPelajaran] || "border-gray-300 bg-gray-50 text-gray-700";
  const utilization = Math.round((kelompok.anggota.length / kelompok.kapasitas) * 100);

  return (
    <div className="px-4 pb-6 space-y-4">
      {/* Header card */}
      <div className="rounded-xl bg-gradient-to-br from-primary to-[oklch(0.28_0.06_150)] text-white p-5 -mx-1">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-12 w-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20 shrink-0">
            <UsersRound size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base leading-tight">{kelompok.nama}</h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur text-[10px] font-medium">
                <CalendarDays size={10} />
                {kelompok.jadwal.length} hari/minggu
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/30 backdrop-blur text-[10px] font-medium text-amber-100">
                {kelompok.mataPelajaran}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/10 backdrop-blur rounded-lg p-2">
            <p className="text-[10px] text-white/70">Anggota</p>
            <p className="text-base font-bold">{kelompok.anggota.length}/{kelompok.kapasitas}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-2">
            <p className="text-[10px] text-white/70">Pembimbing</p>
            <p className="text-[11px] font-semibold truncate">{kelompok.ustaz?.nama || "—"}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-2">
            <p className="text-[10px] text-white/70">Ruangan</p>
            <p className="text-[11px] font-semibold truncate">{kelompok.ruangan || "—"}</p>
          </div>
        </div>
      </div>

      {/* Manajemen Jadwal Multi-Hari */}
      <JadwalManager kelompok={kelompok} onRefresh={onRefresh} />

      {/* Daftar anggota */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <UsersRound size={14} className="text-primary" />
            Anggota Kelompok ({kelompok.anggota.length})
          </h4>
          {kelompok.anggota.length < kelompok.kapasitas ? (
            <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
              {kelompok.kapasitas - kelompok.anggota.length} slot tersedia
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
              Penuh
            </Badge>
          )}
        </div>

        {kelompok.anggota.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <UsersRound size={28} className="text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Belum ada anggota. Tambahkan dari daftar di bawah.</p>
          </div>
        ) : (
          <ul className="space-y-1.5 max-h-64 overflow-y-auto scroll-area-an pr-1">
            {kelompok.anggota.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5 hover:bg-muted/40 transition group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    a.santri.jenisKelamin === "L"
                      ? "bg-sky-100 text-sky-700"
                      : "bg-pink-100 text-pink-700"
                  }`}>
                    {a.santri.nama.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.santri.nama}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {a.santri.nis} • {a.santri.kelas?.nama || "Tanpa kelas"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition"
                  onClick={() => removeAnggota(a.id, a.santri.nama)}
                  disabled={removingId === a.id}
                >
                  <UserMinus size={12} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tambah anggota */}
      {kelompok.anggota.length < kelompok.kapasitas && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <UserPlus size={14} className="text-primary" />
            Tambah Anggota Baru
          </h4>
          <div className="relative mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau NIS santri..."
              className="pl-9 h-9 text-sm"
            />
          </div>
          {availableSantri.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {search ? "Tidak ada santri yang cocok." : "Semua santri aktif sudah terdaftar."}
            </p>
          ) : (
            <ul className="space-y-1.5 max-h-48 overflow-y-auto scroll-area-an pr-1">
              {availableSantri.slice(0, 30).map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-2 hover:border-primary/40 hover:bg-primary/5 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                      s.jenisKelamin === "L"
                        ? "bg-sky-100 text-sky-700"
                        : "bg-pink-100 text-pink-700"
                    }`}>
                      {s.nama.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{s.nama}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {s.nis} • {s.kelas?.nama || "—"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs shrink-0"
                    onClick={() => addAnggota(s.id)}
                    disabled={adding}
                  >
                    <UserPlus size={10} className="mr-1" />
                    Tambah
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {kelompok.catatan && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Catatan</p>
          <p className="text-xs">{kelompok.catatan}</p>
        </div>
      )}
    </div>
  );
}

/* ============== Komponen: Manajer Jadwal Multi-Hari ============== */
interface JadwalManagerProps {
  kelompok: KelompokDetail;
  onRefresh: () => Promise<void>;
}

function JadwalManager({ kelompok, onRefresh }: JadwalManagerProps) {
  const [newJadwal, setNewJadwal] = useState({
    hari: "Senin",
    jamMulai: "07:00",
    jamSelesai: "08:30",
  });
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const addJadwal = async () => {
    setAdding(true);
    try {
      const res = await fetch(`/api/kelompok-belajar/${kelompok.id}/jadwal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJadwal),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(`Jadwal ${newJadwal.hari} ${newJadwal.jamMulai} ditambahkan`);
      setNewJadwal({ hari: "Senin", jamMulai: "07:00", jamSelesai: "08:30" });
      await onRefresh();
    } catch (err) {
      toast.error(String(err).replace("Error: ", ""));
    } finally {
      setAdding(false);
    }
  };

  const removeJadwal = async (jadwalId: string, hari: string, jam: string) => {
    setRemovingId(jadwalId);
    try {
      const res = await fetch(`/api/kelompok-belajar/${kelompok.id}/jadwal/${jadwalId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success(`Jadwal ${hari} ${jam} dihapus`);
      await onRefresh();
    } catch (err) {
      toast.error(String(err));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="rounded-lg border border-border p-3">
      <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
        <CalendarDays size={14} className="text-primary" />
        Jadwal Pertemuan
        <Badge variant="outline" className="text-[10px] ml-1">
          {kelompok.jadwal.length} hari
        </Badge>
      </h4>

      {/* List jadwal existing */}
      {kelompok.jadwal.length === 0 ? (
        <p className="text-xs text-muted-foreground italic mb-3">
          Belum ada jadwal. Tambahkan minimal 1 hari di bawah.
        </p>
      ) : (
        <ul className="space-y-1.5 mb-3">
          {kelompok.jadwal.map((j) => {
            const hariColor = HARI_COLORS[j.hari] || "from-primary to-[oklch(0.28_0.06_150)]";
            return (
              <li
                key={j.id}
                className="flex items-center gap-2 rounded-lg border border-border p-2 group hover:bg-muted/30 transition"
              >
                <div className={`h-8 w-1 rounded-full bg-gradient-to-b ${hariColor} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{j.hari}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    <Clock size={9} className="inline mr-1" />
                    {j.jamMulai} - {j.jamSelesai}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition"
                  onClick={() => removeJadwal(j.id, j.hari, j.jamMulai)}
                  disabled={removingId === j.id}
                >
                  <Trash2 size={12} />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Form tambah jadwal baru */}
      <div className="rounded-lg bg-muted/30 p-2.5 space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Tambah Hari Baru
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Select
            value={newJadwal.hari}
            onValueChange={(v) => setNewJadwal((f) => ({ ...f, hari: v }))}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HARI_LIST.map((h) => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="time"
            value={newJadwal.jamMulai}
            onChange={(e) => setNewJadwal((f) => ({ ...f, jamMulai: e.target.value }))}
            className="h-8 text-xs"
          />
          <Input
            type="time"
            value={newJadwal.jamSelesai}
            onChange={(e) => setNewJadwal((f) => ({ ...f, jamSelesai: e.target.value }))}
            className="h-8 text-xs"
          />
        </div>
        <Button
          type="button"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={addJadwal}
          disabled={adding}
        >
          {adding ? (
            <Loader2 size={12} className="mr-1 animate-spin" />
          ) : (
            <Plus size={12} className="mr-1" />
          )}
          {adding ? "Menambah..." : "Tambah Hari"}
        </Button>
      </div>
    </div>
  );
}
