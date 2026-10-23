"use client";

import { NAV_ITEMS, SETTINGS_ITEMS } from "@/components/sidebar";
import type { ViewKey } from "@/lib/use-app-nav";
import { cn } from "@/lib/utils";
import { Settings } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AnNahlLogo } from "@/components/an-nahl-logo";

interface BottomNavProps {
  view: ViewKey;
  onNavigate: (v: ViewKey) => void;
}

export function BottomNav({ view, onNavigate }: BottomNavProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isSettingsView = SETTINGS_ITEMS.some((i) => i.key === view);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border shadow-lg">
        <div className="grid grid-cols-8 gap-0.5 px-1 py-1.5 safe-area-bottom">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-lg transition",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2.5 : 2}
                  className={cn(active && "scale-110")}
                />
                <span className="text-[8px] font-medium leading-none">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}

          {/* Settings button */}
          <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-lg transition",
                  isSettingsView
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Settings
                  size={18}
                  strokeWidth={isSettingsView ? 2.5 : 2}
                  className={cn(isSettingsView && "scale-110")}
                />
                <span className="text-[8px] font-medium leading-none">Setelan</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-base">Pengaturan</h3>
                <AnNahlLogo variant="dark" size="sm" showText={false} />
              </div>
              <ul className="space-y-1.5">
                {SETTINGS_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = view === item.key;
                  return (
                    <li key={item.key}>
                      <button
                        onClick={() => {
                          onNavigate(item.key);
                          setSettingsOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition",
                          active
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "hover:bg-muted"
                        )}
                      >
                        <Icon size={18} />
                        <div className="text-left">
                          <p className="font-medium">{item.label}</p>
                          <p className={cn("text-[11px]", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                            {item.description}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
