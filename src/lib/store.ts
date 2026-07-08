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

export type View = "storefront" | "login" | "register" | "admin" | "user-dashboard" | "agent-panel";

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

// ─── Path-based routing ──────────────────────────────────────────────────────
// /            → storefront (default landing)
// /home        → storefront
// /login       → login
// /admin       → admin dashboard (requires auth)
// /admin#section → admin with specific section
// Fallback: hash-based (#storefront / #login / #admin) still works for backwards compat

function readView(): View {
  if (typeof window === "undefined") return "storefront";
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.replace("#", "").toLowerCase();

  // Path takes priority
  if (path === "/home" || path === "/") return "storefront";
  if (path === "/login") return "login";
  if (path === "/register") return "register";
  if (path === "/admin") return "admin";
  if (path === "/dashboard") return "user-dashboard";
  if (path === "/agent") return "agent-panel";

  // Hash fallback (backwards compat)
  if (hash === "login") return "login";
  if (hash === "register") return "register";
  if (hash === "admin") return "admin";
  if (hash === "storefront" || hash === "home") return "storefront";
  if (hash === "dashboard") return "user-dashboard";
  if (hash === "agent") return "agent-panel";

  return "storefront";
}

function writeView(v: View) {
  if (typeof window === "undefined") return;
  const pathFor: Record<View, string> = {
    storefront: "/home",
    login: "/login",
    register: "/register",
    admin: "/admin",
    "user-dashboard": "/dashboard",
    "agent-panel": "/agent",
  };
  const target = pathFor[v];
  if (window.location.pathname !== target) {
    window.history.pushState({}, "", target);
  }
}

function readSection(): string {
  if (typeof window === "undefined") return "dashboard";
  const hash = window.location.hash.replace("#", "").toLowerCase();
  const valid = [
    "dashboard", "customers", "cores", "users", "deposits", "withdrawals",
    "trades", "wallets", "kyc", "invitation-codes", "audit-logs",
    "login-history", "reports", "settings",
  ];
  return valid.includes(hash) ? hash : "dashboard";
}

export const useApp = create<AppState>((set, get) => ({
  user: null,
  loadingUser: true,
  view: readView(),
  section: readSection(),
  setUser: (u) => set({ user: u }),
  setLoadingUser: (v) => set({ loadingUser: v }),
  setView: (v) => {
    writeView(v);
    set({ view: v });
  },
  setSection: (s) => {
    if (typeof window !== "undefined" && window.location.pathname === "/admin") {
      const url = new URL(window.location.href);
      url.hash = s;
      window.history.replaceState({}, "", url.toString());
    }
    set({ section: s });
  },
  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    set({ user: null, section: "dashboard", view: "storefront" });
    writeView("storefront");
  },
  refreshUser: async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      const user = data.user ?? null;
      const currentView = get().view;
      set({
        user,
        loadingUser: false,
        // If logged in and on storefront/login, push to admin
        // If not logged in and on admin, push to storefront
        view: user
          ? (currentView === "admin" ? "admin" : "admin")
          : (currentView === "admin" ? "storefront" : currentView),
      });
      if (user && get().view === "admin") writeView("admin");
    } catch {
      set({ user: null, loadingUser: false });
    }
  },
}));

// Listen for browser back/forward to update the view
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    const v = readView();
    const state = useApp.getState();
    // Don't allow unauthenticated users to sit on /admin
    if (v === "admin" && !state.user) {
      writeView("storefront");
      useApp.setState({ view: "storefront" });
    } else {
      useApp.setState({ view: v, section: readSection() });
    }
  });
}
