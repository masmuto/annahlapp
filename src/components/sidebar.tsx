"use client";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  UsersRound,
  Wallet,
  FileText,
  LogOut,
  ChevronLeft,
  UserCircle,
  UserCog,
  Database,
  MessageCircle,
} from "lucide-react";
import { AnNahlLogo, AnNahlTagline } from "@/components/an-nahl-logo";
import type { ViewKey, NavItem } from "@/lib/use-app-nav";
import type { SessionUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", shortLabel: "Beranda", icon: LayoutDashboard, description: "Statistik & ringkasan" },
  { key: "santri", label: "Data Santri", shortLabel: "Santri", icon: Users, description: "Kelola data santri" },
  { key: "ustaz", label: "Data Ustaz/Ustazah", shortLabel: "Ustaz", icon: GraduationCap, description: "Kelola data pengajar" },
  { key: "kelas", label: "Kelas", shortLabel: "Kelas", icon: School, description: "Pengaturan kelas" },
  { key: "kelompok", label: "Kelompok Belajar", shortLabel: "Kelompok", icon: UsersRound, description: "Kelompok belajar terjadwal" },
  { key: "pembayaran", label: "Pembayaran SPP", shortLabel: "SPP", icon: Wallet, description: "Pencatatan & bukti" },
  { key: "laporan", label: "Laporan", shortLabel: "Laporan", icon: FileText, description: "Laporan & tunggakan" },
];

const SETTINGS_ITEMS: NavItem[] = [
  { key: "profil", label: "Profil Saya", shortLabel: "Profil", icon: UserCircle, description: "Kelola profil Anda" },
  { key: "users", label: "Manajemen User", shortLabel: "User", icon: UserCog, description: "Kelola akun pengguna" },
  { key: "whatsapp", label: "Pesan WhatsApp", shortLabel: "WA", icon: MessageCircle, description: "Template & pengaturan WA" },
  { key: "database", label: "Database", shortLabel: "DB", icon: Database, description: "Backup, restore, reset" },
];

interface SidebarProps {
  view: ViewKey;
  onNavigate: (v: ViewKey) => void;
  onLogout: () => void;
  user: SessionUser | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  view,
  onNavigate,
  onLogout,
  user,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const renderNavButton = (item: NavItem) => {
    const Icon = item.icon;
    const active = view === item.key;
    return (
      <li key={item.key}>
        <button
          onClick={() => onNavigate(item.key)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group relative",
            active
              ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center"
          )}
          title={collapsed ? item.label : undefined}
        >
          <Icon size={18} strokeWidth={2} className="shrink-0" />
          {!collapsed && (
            <div className="flex flex-col items-start leading-tight">
              <span>{item.label}</span>
            </div>
          )}
        </button>
      </li>
    );
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <AnNahlLogo variant="light" size="md" showText={!collapsed} />
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition"
              aria-label="Toggle sidebar"
            >
              <ChevronLeft
                size={18}
                className={cn("transition-transform", collapsed && "rotate-180")}
              />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scroll-area-an">
        <ul className="space-y-1">
          {NAV_ITEMS.map(renderNavButton)}
        </ul>

        {/* Settings group */}
        <div className="mt-6">
          {!collapsed && (
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Pengaturan
            </p>
          )}
          {collapsed && <div className="h-px bg-sidebar-border mx-3 mb-2" />}
          <ul className="space-y-1">
            {SETTINGS_ITEMS.map(renderNavButton)}
          </ul>
        </div>
      </nav>

      {/* Tagline */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <AnNahlTagline className="text-sidebar-foreground/60" />
        </div>
      )}

      {/* User footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-2 rounded-lg",
            collapsed && "justify-center"
          )}
        >
          <div className="h-9 w-9 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60">
                {user ? ROLE_LABELS[user.role] : ""}
              </p>
            </div>
          )}
          <button
            onClick={onLogout}
            className={cn(
              "text-sidebar-foreground/60 hover:text-destructive transition p-1.5 rounded",
              collapsed && "mt-1"
            )}
            title="Keluar"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export { NAV_ITEMS, SETTINGS_ITEMS };
