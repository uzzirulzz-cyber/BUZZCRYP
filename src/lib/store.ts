"use client";

import { create } from "zustand";

export type SessionUser = {
  id: string;
  uid: string;
  name: string;
  email: string;
  mobile?: string | null;
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
// /register    → register
// /admin       → admin dashboard (SUPER_ADMIN + CORE)
// /dashboard   → user dashboard (CUSTOMER)
// /agent       → agent panel (CORE)

function readView(): View {
  if (typeof window === "undefined") return "storefront";
  const path = window.location.pathname.toLowerCase();

  if (path === "/home" || path === "/") return "storefront";
  if (path === "/login") return "login";
  if (path === "/register") return "register";
  if (path === "/admin") return "admin";
  if (path === "/dashboard") return "user-dashboard";
  if (path === "/agent") return "agent-panel";

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

// Determine the correct view for a logged-in user based on their role
function viewForUser(user: SessionUser | null, currentView: View): View {
  if (!user) {
    // Not logged in — can't access admin/dashboard/agent
    if (currentView === "admin" || currentView === "user-dashboard" || currentView === "agent-panel") {
      return "storefront";
    }
    return currentView;
  }
  // Logged in — redirect to role-appropriate view if on storefront/login/register
  if (currentView === "storefront" || currentView === "login" || currentView === "register") {
    if (user.role === "CUSTOMER") return "user-dashboard";
    if (user.role === "CORE") return "agent-panel";
    return "admin";
  }
  // If on admin but not authorized (customer on /admin)
  if (currentView === "admin" && user.role === "CUSTOMER") return "user-dashboard";
  // If on user-dashboard but is admin/core
  if (currentView === "user-dashboard" && (user.role === "SUPER_ADMIN" || user.role === "CORE")) return "admin";
  // If on agent-panel but not core
  if (currentView === "agent-panel" && user.role !== "CORE") {
    return user.role === "SUPER_ADMIN" ? "admin" : "user-dashboard";
  }
  return currentView;
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
      const newView = viewForUser(user, currentView);
      set({ user, loadingUser: false, view: newView });
      if (newView !== currentView) writeView(newView);
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
    const newView = viewForUser(state.user, v);
    if (newView !== v) {
      writeView(newView);
      useApp.setState({ view: newView });
    } else {
      useApp.setState({ view: v, section: readSection() });
    }
  });
}
