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
  Wallet,
  Eye,
  Trash2,
  Printer,
  Share2,
  Download,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { formatRupiah, formatDate, getMonthLabel, getCurrentYearMonth } from "@/lib/format";
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
import { BuktiPembayaran } from "@/components/bukti-pembayaran";
import { DialogKirimBukti } from "@/components/dialog-kirim-bukti";

interface Santri {
  id: string;
  nis: string;
  nama: string;
  kelas: { id: string; nama: string } | null;
  sppBulanan: number;
}

interface Pembayaran {
  id: string;
  noPembayaran: string;
  santriId: string;
  bulan: string;
  jumlah: number;
  tanggalBayar: string;
  metodePembayaran: string;
  status: string;
  keterangan: string | null;
  diterimaOleh: string | null;
  santri: Santri;
}

export function PembayaranView() {
  const [pembayaran, setPembayaran] = useState<Pembayaran[]>([]);
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBulan, setFilterBulan] = useState(getCurrentYearMonth());
  const [formOpen, setFormOpen] = useState(false);
  const [detailPembayaran, setDetailPembayaran] = useState<Pembayaran | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pembayaran | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [kirimBuktiTarget, setKirimBuktiTarget] = useState<Pembayaran | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBulan) params.set("bulan", filterBulan);
      if (search) params.set("q", search);
      const res = await fetch(`/api/pembayaran?${params}`);
      const d = await res.json();
      setPembayaran(d.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterBulan, search]);

  useEffect(() => {
    fetch("/api/santri?status=aktif")
      .then((r) => r.json())
      .then((d) => setSantriList(d.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const t = setTimeout(refresh, 300);
    return () => clearTimeout(t);
  }, [refresh]);

  const handleSave = async (formData: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/pembayaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(`Pembayaran SPP ${d.data.santri.nama} berhasil dicatat`);
      setFormOpen(false);
      refresh();
      // Tampilkan dialog kirim bukti setelah pembayaran sukses
      setKirimBuktiTarget(d.data);
    } catch (err) {
      toast.error("Gagal menyimpan: " + String(err).replace("Error: ", ""));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/pembayaran/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("Pembayaran dihapus");
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(String(err));
    }
  };

  const stats = useMemo(
    () => ({
      total: pembayaran.reduce((s, p) => s + p.jumlah, 0),
      count: pembayaran.length,
      lunas: pembayaran.filter((p) => p.status === "lunas").length,
      avg: pembayaran.length > 0 ? pembayaran.reduce((s, p) => s + p.jumlah, 0) / pembayaran.length : 0,
    }),
    [pembayaran]
  );

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Penerimaan"
          value={formatRupiah(stats.total)}
          subtitle={`${stats.count} transaksi`}
          icon={Wallet}
          accent="primary"
        />
        <StatCard
          title="SPP Bulan"
          value={getMonthLabel(filterBulan)}
          subtitle="Periode aktif"
          icon={Clock}
          accent="teal"
        />
        <StatCard
          title="Pembayaran Lunas"
          value={String(stats.lunas)}
          subtitle="Transaksi sukses"
          icon={CheckCircle2}
          accent="green"
        />
        <StatCard
          title="Rata-rata"
          value={formatRupiah(stats.avg)}
          subtitle="Per transaksi"
          icon={TrendingUp}
          accent="gold"
        />
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
                placeholder="Cari nama santri, NIS..."
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground shrink-0">Periode:</Label>
              <input
                type="month"
                value={filterBulan}
                onChange={(e) => setFilterBulan(e.target.value)}
                className="border border-input rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>
            <Button
              onClick={() => setFormOpen(true)}
              className="shrink-0"
            >
              <Plus size={16} className="mr-1" />
              Catat Pembayaran
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
          ) : pembayaran.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle size={40} className="text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">Belum ada pembayaran SPP</p>
              <p className="text-xs text-muted-foreground">Untuk periode {getMonthLabel(filterBulan)}</p>
              <Button onClick={() => setFormOpen(true)} className="mt-4" size="sm">
                <Plus size={14} className="mr-1" />
                Catat pembayaran pertama
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[150px]">No. Pembayaran</TableHead>
                    <TableHead>Santri</TableHead>
                    <TableHead className="hidden md:table-cell">Metode</TableHead>
                    <TableHead className="hidden lg:table-cell">Tanggal</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pembayaran.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs">{p.noPembayaran}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => setDetailPembayaran(p)}
                          className="text-left hover:text-primary transition"
                        >
                          <div className="font-medium">{p.santri.nama}</div>
                          <div className="text-xs text-muted-foreground">{p.santri.nis}</div>
                        </button>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="capitalize">
                          {p.metodePembayaran}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {formatDate(p.tanggalBayar, { day: "numeric", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-700">
                        {formatRupiah(p.jumlah)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDetailPembayaran(p)}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteTarget(p)}
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
      <PembayaranForm
        key={open ? "open" : "closed"}
        open={formOpen}
        onOpenChange={setFormOpen}
        santriList={santriList}
        defaultBulan={filterBulan}
        onSubmit={handleSave}
        submitting={submitting}
      />

      {/* Detail & bukti pembayaran */}
      <Sheet open={!!detailPembayaran} onOpenChange={(o) => !o && setDetailPembayaran(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Bukti Pembayaran SPP</SheetTitle>
          </SheetHeader>
          {detailPembayaran && (
            <BuktiPembayaran pembayaran={detailPembayaran} />
          )}
          {detailPembayaran && (
            <SheetFooter className="flex-row gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.print()}
              >
                <Printer size={14} className="mr-1" />
                Cetak
              </Button>
              <Button
                className="flex-1 bg-[#25D366] hover:bg-[#1ebe5d] text-white"
                onClick={() => {
                  // Tutup sheet dulu, lalu buka dialog kirim bukti
                  const target = detailPembayaran;
                  setDetailPembayaran(null);
                  setTimeout(() => setKirimBuktiTarget(target), 200);
                }}
              >
                <Share2 size={14} className="mr-1" />
                Kirim WA
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pembayaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Pembayaran <strong>{deleteTarget?.noPembayaran}</strong> untuk{" "}
              {deleteTarget?.santri.nama} akan dihapus permanen.
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

      {/* Dialog Kirim Bukti via WA */}
      <DialogKirimBukti
        open={!!kirimBuktiTarget}
        onOpenChange={(o) => !o && setKirimBuktiTarget(null)}
        pembayaran={kirimBuktiTarget}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "primary" | "teal" | "gold" | "green";
}) {
  const accents = {
    primary: "bg-primary/10 text-primary",
    teal: "bg-teal-100 text-teal-700",
    gold: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
  };
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accents[accent]}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="text-base sm:text-lg font-bold truncate">{value}</p>
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface PembayaranFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  santriList: Santri[];
  defaultBulan: string;
  onSubmit: (data: Record<string, unknown>) => void;
  submitting: boolean;
}

function PembayaranForm({
  open,
  onOpenChange,
  santriList,
  defaultBulan,
  onSubmit,
  submitting,
}: PembayaranFormProps) {
  const [form, setForm] = useState<Record<string, string>>(() => ({
    santriId: "",
    bulan: defaultBulan,
    jumlah: "",
    metodePembayaran: "tunai",
    tanggalBayar: new Date().toISOString().split("T")[0],
    keterangan: "",
    diterimaOleh: "Bendahara An Nahl",
  }));
  const [search, setSearch] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const filteredSantri = santriList.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.nama.toLowerCase().includes(q) ||
      s.nis.toLowerCase().includes(q)
    );
  });

  const selectedSantri = santriList.find((s) => s.id === form.santriId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.santriId) {
      toast.error("Santri wajib dipilih");
      return;
    }
    let finalForm = form;
    if (!form.jumlah) {
      // Auto-fill with default SPP if not set
      if (selectedSantri) {
        finalForm = { ...form, jumlah: String(selectedSantri.sppBulanan) };
        set("jumlah", String(selectedSantri.sppBulanan));
      } else {
        toast.error("Jumlah wajib diisi");
        return;
      }
    }
    onSubmit(finalForm);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Catat Pembayaran SPP</DialogTitle>
          <DialogDescription>
            Pilih santri dan masukkan informasi pembayaran SPP.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="santriSearch">Cari Santri</Label>
            <Input
              id="santriSearch"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik nama atau NIS..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="santriId">Pilih Santri *</Label>
            <Select value={form.santriId || "none"} onValueChange={(v) => {
              set("santriId", v === "none" ? "" : v);
              const s = santriList.find((x) => x.id === v);
              if (s && !form.jumlah) {
                set("jumlah", String(s.sppBulanan));
              }
            }}>
              <SelectTrigger id="santriId">
                <SelectValue placeholder="Pilih santri" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="none" disabled>— Pilih santri —</SelectItem>
                {filteredSantri.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nama} ({s.nis}) — {s.kelas?.nama || "Tanpa kelas"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSantri && (
              <p className="text-xs text-muted-foreground">
                SPP default: {formatRupiah(selectedSantri.sppBulanan)}/bulan
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bulan">Periode Bulan *</Label>
              <Input
                id="bulan"
                type="month"
                value={form.bulan || ""}
                onChange={(e) => set("bulan", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jumlah">Jumlah (Rp) *</Label>
              <Input
                id="jumlah"
                type="number"
                min={0}
                value={form.jumlah || ""}
                onChange={(e) => set("jumlah", e.target.value)}
                placeholder="150000"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tanggalBayar">Tanggal Bayar</Label>
              <Input
                id="tanggalBayar"
                type="date"
                value={form.tanggalBayar || ""}
                onChange={(e) => set("tanggalBayar", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metodePembayaran">Metode Pembayaran</Label>
              <Select value={form.metodePembayaran} onValueChange={(v) => set("metodePembayaran", v)}>
                <SelectTrigger id="metodePembayaran">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tunai">Tunai</SelectItem>
                  <SelectItem value="transfer">Transfer Bank</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diterimaOleh">Diterima Oleh</Label>
            <Input
              id="diterimaOleh"
              value={form.diterimaOleh || ""}
              onChange={(e) => set("diterimaOleh", e.target.value)}
              placeholder="Nama bendahara/penerima"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan</Label>
            <Input
              id="keterangan"
              value={form.keterangan || ""}
              onChange={(e) => set("keterangan", e.target.value)}
              placeholder="Catatan tambahan (opsional)"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan Pembayaran"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
