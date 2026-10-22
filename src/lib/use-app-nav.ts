"use client";

import { useState, useCallback } from "react";

export type ViewKey =
  | "dashboard"
  | "santri"
  | "ustaz"
  | "kelas"
  | "kelompok"
  | "pembayaran"
  | "laporan"
  | "profil"
  | "users"
  | "database"
  | "whatsapp";

export interface NavItem {
  key: ViewKey;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

function getInitialView(): ViewKey {
  if (typeof window === "undefined") return "dashboard";
  const hash = window.location.hash.replace("#", "");
  const v = hash.split("/")[0] as ViewKey;
  const valid: ViewKey[] = ["dashboard", "santri", "ustaz", "kelas", "kelompok", "pembayaran", "laporan", "profil", "users", "database", "whatsapp"];
  return valid.includes(v) ? v : "dashboard";
}

export function useAppNav() {
  const [view, setView] = useState<ViewKey>(getInitialView);
  const [santriId, setSantriId] = useState<string | null>(null);
  const [pembayaranId, setPembayaranId] = useState<string | null>(null);

  const navigate = useCallback((v: ViewKey, id?: string) => {
    setView(v);
    if (v === "santri") setSantriId(id ?? null);
    if (v === "pembayaran") setPembayaranId(id ?? null);
    if (typeof window !== "undefined") {
      window.location.hash = id ? `${v}/${id}` : v;
    }
  }, []);

  return { view, santriId, pembayaranId, navigate };
}
