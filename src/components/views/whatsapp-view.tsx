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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageCircle,
  Send,
  Plus,
  Pencil,
  Trash2,
  Save,
  Phone,
  User,
  FileText,
  Settings2,
  History,
  Loader2,
  ExternalLink,
  Info,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  AlertCircle,
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
import { formatDate, formatDateTime } from "@/lib/format";

interface PesanTemplate {
  id: string;
  kode: string;
  nama: string;
  isi: string;
  kategori: string;
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PesanLog {
  id: string;
  penerima: string;
  namaPenerima: string;
  pesan: string;
  kategori: string;
  status: string;
  error: string | null;
  createdAt: string;
}

interface PengaturanWA {
  wa_enabled: string;
  wa_sender_name: string;
  wa_sender_number: string;
  wa_api_url: string;
  wa_api_token: string;
  wa_use_gateway: string;
  app_name: string;
  app_lembaga: string;
  app_address: string;
  app_phone: string;
  app_email: string;
  spp_default_amount: string;
  spp_due_day: string;
  [key: string]: string;
}

const KATEGORI_LIST = ["pembayaran", "tunggakan", "jadwal", "umum"];
const KATEGORI_COLORS: Record<string, string> = {
  pembayaran: "border-emerald-300 bg-emerald-50 text-emerald-700",
  tunggakan: "border-amber-300 bg-amber-50 text-amber-700",
  jadwal: "border-sky-300 bg-sky-50 text-sky-700",
  umum: "border-gray-300 bg-gray-50 text-gray-700",
};

const PLACEHOLDERS = [
  { key: "{nama}", desc: "Nama santri" },
  { key: "{nis}", desc: "NIS santri" },
  { key: "{kelas}", desc: "Nama kelas" },
  { key: "{bulan}", desc: "Periode SPP" },
  { key: "{jumlah}", desc: "Jumlah pembayaran" },
  { key: "{noPembayaran}", desc: "No. pembayaran" },
  { key: "{tanggal}", desc: "Tanggal bayar" },
  { key: "{nama_ortu}", desc: "Nama orang tua" },
  { key: "{lembaga}", desc: "Nama lembaga" },
  { key: "{hari}", desc: "Hari jadwal" },
  { key: "{jam}", desc: "Jam jadwal" },
  { key: "{ustaz}", desc: "Nama pembimbing" },
  { key: "{ruangan}", desc: "Ruangan" },
  { key: "{pesan}", desc: "Pesan kustom" },
];

export function WhatsAppView() {
  return (
    <Tabs defaultValue="templates" className="space-y-5">
      <TabsList className="grid grid-cols-4 w-full max-w-xl">
        <TabsTrigger value="templates" className="text-xs">
          <FileText size={12} className="mr-1" />
          <span className="hidden sm:inline">Template</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="text-xs">
          <Settings2 size={12} className="mr-1" />
          <span className="hidden sm:inline">Pengaturan</span>
        </TabsTrigger>
        <TabsTrigger value="test" className="text-xs">
          <FlaskConical size={12} className="mr-1" />
          <span className="hidden sm:inline">Test Kirim</span>
        </TabsTrigger>
        <TabsTrigger value="history" className="text-xs">
          <History size={12} className="mr-1" />
          <span className="hidden sm:inline">Riwayat</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="templates">
        <TemplatesTab />
      </TabsContent>
      <TabsContent value="settings">
        <SettingsTab />
      </TabsContent>
      <TabsContent value="test">
        <TestKirimTab />
      </TabsContent>
      <TabsContent value="history">
        <HistoryTab />
      </TabsContent>
    </Tabs>
  );
}

/* ============== TAB: TEMPLATES ============== */
function TemplatesTab() {
  const [templates, setTemplates] = useState<PesanTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterKategori, setFilterKategori] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PesanTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PesanTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterKategori !== "all") params.set("kategori", filterKategori);
      const res = await fetch(`/api/pesan-template?${params}`);
      const d = await res.json();
      setTemplates(d.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterKategori]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSave = async (formData: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const url = editing ? `/api/pesan-template/${editing.id}` : "/api/pesan-template";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(editing ? "Template diperbarui" : "Template baru ditambahkan");
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
      const res = await fetch(`/api/pesan-template/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal");
      toast.success(`Template ${deleteTarget.nama} dihapus`);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(String(err));
    }
  };

  const toggleActive = async (t: PesanTemplate) => {
    try {
      const res = await fetch(`/api/pesan-template/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: !t.aktif }),
      });
      if (!res.ok) throw new Error("Gagal");
      toast.success(`${t.nama} ${t.aktif ? "dinonaktifkan" : "diaktifkan"}`);
      refresh();
    } catch (err) {
      toast.error(String(err));
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <Select value={filterKategori} onValueChange={setFilterKategori}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {KATEGORI_LIST.map((k) => (
                <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} className="mr-1" />
            Tambah Template
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={40} className="text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">Belum ada template</p>
            <p className="text-xs text-muted-foreground">Tambahkan template pesan pertama Anda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {templates.map((t) => (
            <Card key={t.id} className="hover:shadow-md transition">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge variant="outline" className={`text-[10px] capitalize ${KATEGORI_COLORS[t.kategori] || ""}`}>
                        {t.kategori}
                      </Badge>
                      <code className="text-[10px] text-muted-foreground font-mono">{t.kode}</code>
                    </div>
                    <h3 className="font-semibold text-sm">{t.nama}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(t); setFormOpen(true); }}>
                      <Pencil size={12} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(t)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
                <pre className="text-[11px] text-muted-foreground bg-muted/40 rounded p-2.5 max-h-32 overflow-y-auto scroll-area-an whitespace-pre-wrap font-sans">
                  {t.isi}
                </pre>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Switch checked={t.aktif} onCheckedChange={() => toggleActive(t)} />
                    <span className="text-xs text-muted-foreground">{t.aktif ? "Aktif" : "Nonaktif"}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Update {formatDate(t.updatedAt, { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TemplateForm
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
            <AlertDialogTitle>Hapus template?</AlertDialogTitle>
            <AlertDialogDescription>
              Template <strong>{deleteTarget?.nama}</strong> ({deleteTarget?.kode}) akan dihapus permanen.
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

function TemplateForm({
  open,
  onOpenChange,
  editing,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: PesanTemplate | null;
  onSubmit: (data: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState<Record<string, string>>(() => ({
    kode: editing?.kode || "",
    nama: editing?.nama || "",
    kategori: editing?.kategori || "umum",
    isi: editing?.isi || "",
    aktif: editing?.aktif === false ? "false" : "true",
  }));

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const insertPlaceholder = (key: string) => {
    set("isi", (form.isi || "") + key);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kode || !form.nama || !form.isi) {
      toast.error("Kode, nama, dan isi wajib diisi");
      return;
    }
    onSubmit({
      ...form,
      aktif: form.aktif === "true",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Template" : "Tambah Template Pesan"}</DialogTitle>
          <DialogDescription>
            Template pesan dengan placeholder. Gunakan tombol di bawah untuk menyisipkan variabel.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kode">Kode *</Label>
              <Input
                id="kode"
                required
                value={form.kode}
                onChange={(e) => set("kode", e.target.value)}
                placeholder="contoh: tagihan_spp"
                disabled={!!editing}
                className={editing ? "bg-muted/50" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama *</Label>
              <Input
                id="nama"
                required
                value={form.nama}
                onChange={(e) => set("nama", e.target.value)}
                placeholder="Nama template"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kategori">Kategori</Label>
              <Select value={form.kategori} onValueChange={(v) => set("kategori", v)}>
                <SelectTrigger id="kategori">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORI_LIST.map((k) => (
                    <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Placeholder helper */}
          <div className="space-y-2">
            <Label className="text-xs">Sisipkan Placeholder:</Label>
            <div className="flex flex-wrap gap-1.5">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => insertPlaceholder(p.key)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-mono transition"
                  title={p.desc}
                >
                  {p.key}
                  <span className="text-[9px] opacity-60">— {p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="isi">Isi Pesan *</Label>
            <Textarea
              id="isi"
              required
              value={form.isi}
              onChange={(e) => set("isi", e.target.value)}
              rows={10}
              placeholder="Tulis isi pesan di sini. Gunakan placeholder seperti {nama}, {nis}, dll."
              className="font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={form.aktif === "true"}
              onCheckedChange={(v) => set("aktif", v ? "true" : "false")}
            />
            <Label className="text-sm">Aktifkan template</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
              {editing ? "Simpan" : "Tambah Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ============== TAB: SETTINGS ============== */
function SettingsTab() {
  const [settings, setSettings] = useState<PengaturanWA | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/pengaturan")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setSettings(d.data as PengaturanWA);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/pengaturan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success("Pengaturan disimpan");
    } catch (err) {
      toast.error("Gagal: " + String(err).replace("Error: ", ""));
    } finally {
      setSaving(false);
    }
  };

  const set = (k: string, v: string) => {
    setSettings((s) => s ? { ...s, [k]: v } : s);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Gagal memuat pengaturan
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {/* WhatsApp Gateway */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle size={16} className="text-primary" />
            Konfigurasi WhatsApp
          </CardTitle>
          <CardDescription>Pengaturan pengirim pesan WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div>
              <p className="text-sm font-medium">Aktifkan WhatsApp</p>
              <p className="text-xs text-muted-foreground">Izinkan pengiriman pesan WA dari aplikasi</p>
            </div>
            <Switch
              checked={settings.wa_enabled === "true"}
              onCheckedChange={(v) => set("wa_enabled", v ? "true" : "false")}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wa_sender_name">Nama Pengirim</Label>
              <Input
                id="wa_sender_name"
                value={settings.wa_sender_name}
                onChange={(e) => set("wa_sender_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa_sender_number">Nomor Pengirim</Label>
              <Input
                id="wa_sender_number"
                value={settings.wa_sender_number}
                onChange={(e) => set("wa_sender_number", e.target.value)}
                placeholder="628xxx"
              />
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
            <Info size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800">
              <p className="font-medium mb-1">Mode Pengiriman</p>
              <p>
                Secara default, aplikasi membuka <code>wa.me</code> dengan pesan terisi otomatis
                (mode manual). Untuk pengiriman otomatis tanpa membuka WhatsApp, isi API Gateway
                di bawah dan aktifkan <strong>Use Gateway</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div>
              <p className="text-sm font-medium">Gunakan API Gateway</p>
              <p className="text-xs text-muted-foreground">Kirim otomatis via API (Fonnte, Wablas, dll)</p>
            </div>
            <Switch
              checked={settings.wa_use_gateway === "true"}
              onCheckedChange={(v) => set("wa_use_gateway", v ? "true" : "false")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wa_api_url">API URL Gateway</Label>
            <Input
              id="wa_api_url"
              value={settings.wa_api_url}
              onChange={(e) => set("wa_api_url", e.target.value)}
              placeholder="https://api.fonnte.com/send"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wa_api_token">API Token</Label>
            <Input
              id="wa_api_token"
              type="password"
              value={settings.wa_api_token}
              onChange={(e) => set("wa_api_token", e.target.value)}
              placeholder="Token API gateway"
            />
          </div>
        </CardContent>
      </Card>

      {/* App settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 size={16} className="text-primary" />
            Informasi Lembaga
          </CardTitle>
          <CardDescription>Detail identitas Rumah Tahfidz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="app_name">Nama Aplikasi</Label>
              <Input id="app_name" value={settings.app_name} onChange={(e) => set("app_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app_lembaga">Nama Lembaga</Label>
              <Input id="app_lembaga" value={settings.app_lembaga} onChange={(e) => set("app_lembaga", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="app_address">Alamat</Label>
            <Input id="app_address" value={settings.app_address} onChange={(e) => set("app_address", e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="app_phone">Telepon Lembaga</Label>
              <Input id="app_phone" value={settings.app_phone} onChange={(e) => set("app_phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app_email">Email Lembaga</Label>
              <Input id="app_email" type="email" value={settings.app_email} onChange={(e) => set("app_email", e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spp_default_amount">SPP Default (Rp)</Label>
              <Input
                id="spp_default_amount"
                type="number"
                value={settings.spp_default_amount}
                onChange={(e) => set("spp_default_amount", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spp_due_day">Tanggal Jatuh Tempo SPP</Label>
              <Input
                id="spp_due_day"
                type="number"
                min={1}
                max={31}
                value={settings.spp_due_day}
                onChange={(e) => set("spp_due_day", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
          Simpan Pengaturan
        </Button>
      </div>
    </form>
  );
}

/* ============== TAB: HISTORY ============== */
function HistoryTab() {
  const [logs, setLogs] = useState<PesanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showDetail, setShowDetail] = useState<PesanLog | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("kategori", filter);
      params.set("limit", "100");
      const res = await fetch(`/api/pesan-log?${params}`);
      const d = await res.json();
      setLogs(d.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {KATEGORI_LIST.map((k) => (
                  <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={refresh}>
              <History size={14} className="mr-1" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History size={40} className="text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">Belum ada riwayat pesan</p>
              <p className="text-xs text-muted-foreground">Pesan WhatsApp yang dikirim akan muncul di sini</p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto scroll-area-an">
              <ul className="divide-y divide-border">
                {logs.map((log) => (
                  <li
                    key={log.id}
                    className="p-4 hover:bg-muted/30 cursor-pointer transition"
                    onClick={() => setShowDetail(log)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                          log.status === "terkirim"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {log.status === "terkirim" ? <Send size={14} /> : <Info size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{log.namaPenerima}</p>
                            <Badge variant="outline" className={`text-[10px] capitalize ${KATEGORI_COLORS[log.kategori] || ""}`}>
                              {log.kategori}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{log.penerima}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{log.pesan}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-muted-foreground">
                          {formatDateTime(log.createdAt)}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] mt-1 ${
                            log.status === "terkirim"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-destructive/30 bg-destructive/5 text-destructive"
                          }`}
                        >
                          {log.status}
                        </Badge>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!showDetail} onOpenChange={(o) => !o && setShowDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Pesan</DialogTitle>
            <DialogDescription>
              {showDetail && formatDate(showDetail.createdAt, { day: "numeric", month: "long", year: "numeric" })}
            </DialogDescription>
          </DialogHeader>
          {showDetail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Penerima</p>
                  <p className="font-medium">{showDetail.namaPenerima}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nomor</p>
                  <p className="font-mono text-xs">{showDetail.penerima}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kategori</p>
                  <Badge variant="outline" className={`capitalize ${KATEGORI_COLORS[showDetail.kategori] || ""}`}>
                    {showDetail.kategori}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant="outline" className={
                    showDetail.status === "terkirim"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-destructive/30 bg-destructive/5 text-destructive"
                  }>
                    {showDetail.status}
                  </Badge>
                </div>
              </div>
              {showDetail.error && (
                <div className="rounded bg-destructive/10 p-2 text-xs text-destructive">
                  {showDetail.error}
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Isi Pesan</p>
                <pre className="text-xs bg-muted/40 rounded p-3 whitespace-pre-wrap font-sans max-h-60 overflow-y-auto">
                  {showDetail.pesan}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============== TAB: TEST KIRIM ============== */
interface TestResult {
  success: boolean;
  mode: "manual" | "gateway";
  penerima: string;
  namaPenerima: string;
  pesan: string;
  waUrl?: string;
  gatewayResponse?: unknown;
  error?: string;
  durationMs: number;
  timestamp: string;
}

function TestKirimTab() {
  const [form, setForm] = useState({
    penerima: "",
    namaPenerima: "",
    pesan: "Assalamu'alaikum Wr. Wb.\n\nIni adalah pesan test dari GO An Nahl untuk memastikan fitur WhatsApp berjalan dengan baik.\n\nWassalamu'alaikum Wr. Wb.\nRumah Tahfidz An Nahl",
    useGateway: false,
  });
  const [settings, setSettings] = useState<PengaturanWA | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  useEffect(() => {
    fetch("/api/pengaturan")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setSettings(d.data as PengaturanWA);
          setForm((f) => ({
            ...f,
            useGateway: d.data.wa_use_gateway === "true",
          }));
        }
      })
      .catch(console.error);
  }, []);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.penerima.trim()) {
      toast.error("Nomor penerima wajib diisi");
      return;
    }
    if (!form.pesan.trim()) {
      toast.error("Pesan wajib diisi");
      return;
    }

    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/pesan-log/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          penerima: form.penerima,
          namaPenerima: form.namaPenerima,
          pesan: form.pesan,
          useGateway: form.useGateway,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error || "Gagal test kirim");
        setResult({
          success: false,
          mode: form.useGateway ? "gateway" : "manual",
          penerima: form.penerima,
          namaPenerima: form.namaPenerima,
          pesan: form.pesan,
          durationMs: 0,
          timestamp: new Date().toISOString(),
          error: d.error,
        });
        return;
      }
      setResult(d.data as TestResult);
      if (d.data.success) {
        toast.success(
          d.data.mode === "gateway"
            ? "Test berhasil! Gateway merespons OK."
            : "Test berhasil! Link wa.me siap dibuka."
        );
      } else {
        toast.error("Test gagal. Lihat detail error di bawah.");
      }
    } catch (err) {
      toast.error("Gagal: " + String(err));
    } finally {
      setSending(false);
    }
  };

  const openWaUrl = () => {
    if (result?.waUrl) {
      window.open(result.waUrl, "_blank");
    }
  };

  // Status konfigurasi
  const waEnabled = settings?.wa_enabled !== "false";
  const gatewayConfigured = !!(settings?.wa_api_url && settings?.wa_api_token);
  const gatewayMode = form.useGateway;

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Info status konfigurasi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical size={16} className="text-primary" />
            Test Kirim WhatsApp
          </CardTitle>
          <CardDescription>
            Kirim pesan test untuk memastikan konfigurasi WhatsApp berfungsi sebelum dipakai massal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className={`rounded-lg border p-3 ${waEnabled ? "border-emerald-300 bg-emerald-50" : "border-gray-300 bg-gray-50"}`}>
              <div className="flex items-center gap-2 mb-1">
                {waEnabled ? (
                  <CheckCircle2 size={14} className="text-emerald-600" />
                ) : (
                  <XCircle size={14} className="text-gray-500" />
                )}
                <p className="text-xs font-semibold">Status WhatsApp</p>
              </div>
              <p className={`text-xs ${waEnabled ? "text-emerald-700" : "text-gray-600"}`}>
                {waEnabled ? "Aktif" : "Nonaktif"}
              </p>
            </div>

            <div className={`rounded-lg border p-3 ${gatewayConfigured ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}>
              <div className="flex items-center gap-2 mb-1">
                {gatewayConfigured ? (
                  <CheckCircle2 size={14} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={14} className="text-amber-600" />
                )}
                <p className="text-xs font-semibold">Gateway API</p>
              </div>
              <p className={`text-xs ${gatewayConfigured ? "text-emerald-700" : "text-amber-700"}`}>
                {gatewayConfigured ? "Terconfigurasi" : "Belum diisi"}
              </p>
            </div>

            <div className={`rounded-lg border p-3 ${gatewayMode ? "border-sky-300 bg-sky-50" : "border-gray-300 bg-gray-50"}`}>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className={gatewayMode ? "text-sky-600" : "text-gray-500"} />
                <p className="text-xs font-semibold">Mode Kirim</p>
              </div>
              <p className={`text-xs ${gatewayMode ? "text-sky-700" : "text-gray-600"}`}>
                {gatewayMode ? "Gateway (Otomatis)" : "Manual (wa.me)"}
              </p>
            </div>
          </div>

          {!waEnabled && (
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                WhatsApp sedang dinonaktifkan. Aktifkan di tab <strong>Pengaturan</strong> terlebih dahulu sebelum test kirim.
              </p>
            </div>
          )}

          {gatewayMode && !gatewayConfigured && (
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                Mode Gateway dipilih tapi API URL/Token belum diisi. Atur di tab <strong>Pengaturan</strong>, atau ubah ke mode Manual di bawah.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form test */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Form Test Kirim</CardTitle>
          <CardDescription>Isi data penerima & pesan, lalu klik tombol kirim test</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTest} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="penerima" className="flex items-center gap-1">
                  <Phone size={12} />
                  Nomor Penerima *
                </Label>
                <Input
                  id="penerima"
                  required
                  value={form.penerima}
                  onChange={(e) => set("penerima", e.target.value)}
                  placeholder="08xxxxxxxxxx atau 628xxx"
                />
                <p className="text-[10px] text-muted-foreground">
                  Format: 08xxx, 628xxx, atau +62xxx
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="namaPenerima" className="flex items-center gap-1">
                  <User size={12} />
                  Nama Penerima
                </Label>
                <Input
                  id="namaPenerima"
                  value={form.namaPenerima}
                  onChange={(e) => set("namaPenerima", e.target.value)}
                  placeholder="Nama untuk log (opsional)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pesan">Isi Pesan *</Label>
              <Textarea
                id="pesan"
                required
                value={form.pesan}
                onChange={(e) => set("pesan", e.target.value)}
                rows={6}
                className="text-sm"
              />
            </div>

            {/* Mode toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
              <div className="flex-1">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Zap size={14} className={gatewayMode ? "text-sky-600" : "text-muted-foreground"} />
                  Mode Gateway (Otomatis)
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {gatewayMode
                    ? "Pesan dikirim langsung via API Gateway tanpa membuka WhatsApp"
                    : "Pesan dibuka via wa.me link (Anda perlu klik kirim manual di WhatsApp)"}
                </p>
              </div>
              <Switch
                checked={form.useGateway}
                onCheckedChange={(v) => set("useGateway", v)}
                disabled={!gatewayConfigured && !form.useGateway}
              />
            </div>

            {!gatewayConfigured && form.useGateway && (
              <p className="text-xs text-amber-700">
                ⚠ Gateway belum dikonfigurasi. Matikan toggle ini atau isi API URL & Token di tab Pengaturan.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setForm({
                    penerima: "",
                    namaPenerima: "",
                    pesan: "Assalamu'alaikum Wr. Wb.\n\nIni adalah pesan test dari GO An Nahl untuk memastikan fitur WhatsApp berjalan dengan baik.\n\nWassalamu'alaikum Wr. Wb.\nRumah Tahfidz An Nahl",
                    useGateway: settings?.wa_use_gateway === "true",
                  });
                  setResult(null);
                }}
              >
                Reset
              </Button>
              <Button type="submit" disabled={sending || !waEnabled}>
                {sending ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Send size={16} className="mr-2" />
                )}
                {sending ? "Mengirim..." : "Kirim Test"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Hasil test */}
      {result && (
        <Card className={result.success ? "border-emerald-300" : "border-destructive/40"}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {result.success ? (
                <CheckCircle2 size={18} className="text-emerald-600" />
              ) : (
                <XCircle size={18} className="text-destructive" />
              )}
              Hasil Test: {result.success ? "Berhasil" : "Gagal"}
            </CardTitle>
            <CardDescription>
              Test dilakukan pada {new Date(result.timestamp).toLocaleString("id-ID")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={
                  result.success
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-destructive/30 bg-destructive/5 text-destructive"
                }
              >
                {result.success ? "✓ Sukses" : "✗ Gagal"}
              </Badge>
              <Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-700">
                Mode: {result.mode === "gateway" ? "Gateway Otomatis" : "Manual wa.me"}
              </Badge>
              <Badge variant="outline" className="border-gray-300 bg-gray-50 text-gray-700">
                <Clock size={10} className="mr-1" />
                {result.durationMs}ms
              </Badge>
            </div>

            {/* Detail pengiriman */}
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Penerima</p>
                <p className="font-medium">{result.namaPenerima || "-"}</p>
                <p className="text-xs font-mono text-muted-foreground">{result.penerima}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Pesan Terkirim</p>
                <p className="text-xs line-clamp-2">{result.pesan}</p>
              </div>
            </div>

            {/* Error message */}
            {result.error && (
              <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                <p className="text-xs font-semibold text-destructive mb-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Error:
                </p>
                <p className="text-xs text-destructive">{result.error}</p>
              </div>
            )}

            {/* Gateway response */}
            {result.gatewayResponse !== undefined && (
              <div>
                <p className="text-xs font-semibold mb-1">Response dari Gateway:</p>
                <pre className="text-[10px] bg-muted/60 rounded p-3 max-h-48 overflow-y-auto scroll-area-an whitespace-pre-wrap font-mono">
                  {typeof result.gatewayResponse === "string"
                    ? result.gatewayResponse
                    : JSON.stringify(result.gatewayResponse, null, 2)}
                </pre>
              </div>
            )}

            {/* Action: buka wa.me */}
            {result.waUrl && result.success && (
              <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
                <p className="text-xs font-semibold text-sky-800 mb-2 flex items-center gap-1">
                  <Info size={12} />
                  Mode Manual — Klik tombol di bawah untuk membuka WhatsApp:
                </p>
                <Button
                  type="button"
                  onClick={openWaUrl}
                  className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white"
                >
                  <ExternalLink size={14} className="mr-2" />
                  Buka WhatsApp (wa.me/{result.penerima})
                </Button>
              </div>
            )}

            {/* Tips */}
            {result.success && result.mode === "gateway" && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                <p className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Konfigurasi Gateway Berfungsi!
                </p>
                <p className="text-xs text-emerald-700">
                  Pesan test berhasil dikirim via API gateway dalam {result.durationMs}ms.
                  Anda siap menggunakan fitur kirim WhatsApp otomatis untuk bukti pembayaran,
                  pengingat tunggakan, dan info jadwal.
                </p>
              </div>
            )}

            {result.success && result.mode === "manual" && (
              <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
                <p className="text-xs font-semibold text-sky-800 mb-1 flex items-center gap-1">
                  <Info size={12} />
                  Mode Manual Berfungsi!
                </p>
                <p className="text-xs text-sky-700">
                  Link wa.me berhasil dibuat. Untuk otomatisasi penuh (tanpa klik kirim manual),
                  aktifkan mode Gateway di tab <strong>Pengaturan</strong> dan isi API URL + Token
                  dari penyedia layanan WhatsApp API (Fonnte, Wablas, dll).
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
