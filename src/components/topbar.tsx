"use client";

import { Menu, Bell, Search, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AnNahlLogo, AnNahlTagline } from "@/components/an-nahl-logo";
import { NAV_ITEMS, SETTINGS_ITEMS } from "@/components/sidebar";
import type { ViewKey } from "@/lib/use-app-nav";
import type { SessionUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface TopbarProps {
  view: ViewKey;
  onNavigate: (v: ViewKey) => void;
  onLogout: () => void;
  user: SessionUser | null;
  search?: string;
  onSearchChange?: (v: string) => void;
  showSearch?: boolean;
}

export function Topbar({
  view,
  onNavigate,
  onLogout,
  user,
  search = "",
  onSearchChange,
  showSearch = false,
}: TopbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentItem = [...NAV_ITEMS, ...SETTINGS_ITEMS].find((i) => i.key === view);
  const isSettings = SETTINGS_ITEMS.some((i) => i.key === view);

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/95 backdrop-blur border-b border-border">
      <div className="h-full px-3 sm:px-6 flex items-center gap-3">
        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Menu"
            >
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
            <div className="p-4 border-b border-sidebar-border">
              <AnNahlLogo variant="light" size="md" />
            </div>
            <nav className="p-3 overflow-y-auto">
              <ul className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = view === item.key;
                  return (
                    <li key={item.key}>
                      <button
                        onClick={() => {
                          onNavigate(item.key);
                          setMobileOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                          active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                        )}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4">
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  Pengaturan
                </p>
                <ul className="space-y-1">
                  {SETTINGS_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = view === item.key;
                    return (
                      <li key={item.key}>
                        <button
                          onClick={() => {
                            onNavigate(item.key);
                            setMobileOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                            active
                              ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                          )}
                        >
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>
            <div className="px-4 py-3 border-t border-sidebar-border mt-auto">
              <AnNahlTagline className="text-sidebar-foreground/60" />
            </div>
            <div className="p-3 border-t border-sidebar-border">
              <div className="flex items-center gap-2 px-2 py-2">
                <div className="h-9 w-9 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-sidebar-foreground/60">
                    {user ? ROLE_LABELS[user.role] : ""}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="text-sidebar-foreground/60 hover:text-destructive p-1.5 rounded"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile logo */}
        <div className="md:hidden">
          <AnNahlLogo variant="dark" size="sm" showText={false} />
        </div>

        {/* Page title */}
        <div className="hidden md:block">
          <h1 className="text-lg font-semibold text-foreground leading-tight">
            {currentItem?.label}
          </h1>
          <p className="text-xs text-muted-foreground">
            {currentItem?.description}
          </p>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md ml-auto">
          {showSearch && onSearchChange ? (
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari santri, NIS..."
                className="pl-9 h-9"
              />
            </div>
          ) : null}
        </div>

        {/* Notifications & user */}
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifikasi">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full" />
        </Button>
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="leading-tight">
            <p className="text-xs font-medium">{user?.name?.split(" ")[0]}</p>
            <p className="text-[10px] text-muted-foreground">
              {user ? ROLE_LABELS[user.role] : ""}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
