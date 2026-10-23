"use client";

import { BookOpen, Heart, Sparkles } from "lucide-react";

interface LogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function AnNahlLogo({
  variant = "light",
  size = "md",
  showText = true,
  className = "",
}: LogoProps) {
  const sizes = {
    sm: { box: "h-8 w-8", icon: 14, text: "text-base", sub: "text-[10px]" },
    md: { box: "h-10 w-10", icon: 18, text: "text-lg", sub: "text-[11px]" },
    lg: { box: "h-14 w-14", icon: 24, text: "text-2xl", sub: "text-xs" },
  };
  const s = sizes[size];
  const textColor = variant === "light" ? "text-white" : "text-primary";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${s.box} rounded-xl bg-gradient-to-br from-primary to-[oklch(0.28_0.06_150)] flex items-center justify-center text-white shadow-lg shadow-primary/20 ring-1 ring-white/10`}
      >
        <div className="relative">
          <BookOpen size={s.icon} strokeWidth={2.2} />
          <Heart
            size={s.icon - 6}
            className="absolute -bottom-1 -right-1 text-amber-300 fill-amber-300"
          />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-bold ${s.text} ${textColor} tracking-tight`}>
            GO An Nahl
          </span>
          <span
            className={`${s.sub} ${
              variant === "light" ? "text-white/70" : "text-muted-foreground"
            } font-medium`}
          >
            Rumah Tahfidz
          </span>
        </div>
      )}
    </div>
  );
}

export function AnNahlTagline({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
      <Sparkles size={12} className="text-amber-500" />
      <span className="italic">Bersama Al-Qur&apos;an membangun generasi Qur&apos;ani</span>
    </div>
  );
}
