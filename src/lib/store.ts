"use client";

import { create } from "zustand";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "CORE" | "CUSTOMER";
  coreId?: string | null;
  customerId?: string | null;
  mustChangePassword: boolean;
  accountStatus: string;
};

export type AdminSection =
  | "dashboard"
  | "customers"
  | "cores"
  | "users"
  | "deposits"
  | "withdrawals"
  | "trades"
  | "wallets"
  | "kyc"
  | "invitation-codes"
  | "audit-logs"
  | "login-history"
  | "reports"
  | "settings";

export type CoreSection =
  | "dashboard"
  | "customers"
  | "deposits"
  | "withdrawals"
  | "trades"
  | "wallets"
  | "invitation-codes";

interface AppState {
  user: SessionUser | null;
  loadingUser: boolean;
  section: string;
  setUser: (u: SessionUser | null) => void;
  setLoadingUser: (v: boolean) => void;
  setSection: (s: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useApp = create<AppState>((set) => ({
  user: null,
  loadingUser: true,
  section: "dashboard",
  setUser: (u) => set({ user: u }),
  setLoadingUser: (v) => set({ loadingUser: v }),
  setSection: (s) => set({ section: s }),
  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    set({ user: null, section: "dashboard" });
  },
  refreshUser: async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      set({ user: data.user ?? null, loadingUser: false });
    } catch {
      set({ user: null, loadingUser: false });
    }
  },
}));
