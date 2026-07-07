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

export type View = "storefront" | "login" | "admin";

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
  view: View;
  section: string;
  setUser: (u: SessionUser | null) => void;
  setLoadingUser: (v: boolean) => void;
  setView: (v: View) => void;
  setSection: (s: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

function readHashView(): View {
  if (typeof window === "undefined") return "storefront";
  const h = window.location.hash.replace("#", "").toLowerCase();
  if (h === "login") return "login";
  if (h === "admin") return "admin";
  return "storefront";
}

function writeHashView(v: View) {
  if (typeof window === "undefined") return;
  const target = v === "storefront" ? "" : `#${v}`;
  if (window.location.hash !== target && !(v === "storefront" && !window.location.hash)) {
    const url = new URL(window.location.href);
    url.hash = target;
    window.history.pushState({}, "", url.toString());
  }
}

export const useApp = create<AppState>((set, get) => ({
  user: null,
  loadingUser: true,
  view: readHashView(),
  section: "dashboard",
  setUser: (u) => set({ user: u }),
  setLoadingUser: (v) => set({ loadingUser: v }),
  setView: (v) => {
    writeHashView(v);
    set({ view: v });
  },
  setSection: (s) => set({ section: s }),
  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    set({ user: null, section: "dashboard", view: "storefront" });
    writeHashView("storefront");
  },
  refreshUser: async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      const user = data.user ?? null;
      set({
        user,
        loadingUser: false,
        // If logged in, force the admin view; otherwise respect the hash unless it says admin
        view: user ? "admin" : get().view === "admin" ? "storefront" : get().view,
      });
      if (user) writeHashView("admin");
    } catch {
      set({ user: null, loadingUser: false });
    }
  },
}));

// Listen for browser back/forward to update the view
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    const v = readHashView();
    const state = useApp.getState();
    // Don't allow unauthenticated users to sit on #admin
    if (v === "admin" && !state.user) {
      useApp.setState({ view: "storefront" });
    } else {
      useApp.setState({ view: v });
    }
  });
}
