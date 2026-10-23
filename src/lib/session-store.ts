"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionUser } from "@/lib/auth";

interface SessionState {
  user: SessionUser | null;
  isAuthed: boolean;
  login: (user: SessionUser) => void;
  logout: () => void;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      isAuthed: false,
      hydrated: false,
      login: (user) => set({ user, isAuthed: true }),
      logout: () => set({ user: null, isAuthed: false }),
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: "an-nahl-session",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
