"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { StorefrontPage } from "@/components/storefront/StorefrontPage";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ForceChangePassword } from "@/components/auth/ForceChangePassword";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserDashboard } from "@/components/user/UserDashboard";
import { AgentPanel } from "@/components/agent/AgentPanel";
import { DashboardSection } from "@/components/sections/DashboardSection";
import { CustomersSection } from "@/components/sections/CustomersSection";
import { CoresSection } from "@/components/sections/CoresSection";
import { DepositsSection } from "@/components/sections/DepositsSection";
import { WithdrawalsSection } from "@/components/sections/WithdrawalsSection";
import { TradesSection } from "@/components/sections/TradesSection";
import { WalletsSection } from "@/components/sections/WalletsSection";
import { KycSection } from "@/components/sections/KycSection";
import { InvitationCodesSection } from "@/components/sections/InvitationCodesSection";
import { AuditLogsSection } from "@/components/sections/AuditLogsSection";
import { LoginHistorySection } from "@/components/sections/LoginHistorySection";
import { UsersSection } from "@/components/sections/UsersSection";
import { ReportsSection } from "@/components/sections/ReportsSection";
import { SettingsSection } from "@/components/sections/SettingsSection";

export function AppShell() {
  const { user, loadingUser, view, section, refreshUser, setView } = useApp();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Initial loading splash
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full border-2 border-brock-gold/30 border-t-brock-gold animate-spin" />
          <div className="text-sm text-muted-foreground">Loading Brock Exchange...</div>
        </div>
      </div>
    );
  }

  // ─── Admin view: requires authentication ─────────────────────
  if (view === "admin") {
    if (!user) {
      return <LoginForm />;
    }
    if (user.mustChangePassword) {
      return <ForceChangePassword />;
    }
    // Only Super Admin and Core can access /admin
    if (user.role === "CUSTOMER") {
      // Customers should go to user dashboard
      return <UserDashboard />;
    }
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 min-w-0 p-4 sm:p-6 max-w-full">
            <div className="mx-auto max-w-7xl">
              {renderSection(section, user.role)}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ─── User Dashboard view ─────────────────────────────────────
  if (view === "user-dashboard") {
    if (!user) return <LoginForm />;
    if (user.mustChangePassword) return <ForceChangePassword />;
    if (user.role === "CORE") {
      // Cores see agent panel
      return <AgentPanel />;
    }
    if (user.role === "SUPER_ADMIN") {
      // Super Admin sees admin dashboard
      return (
        <div className="min-h-screen flex flex-col">
          <TopBar />
          <div className="flex-1 flex">
            <Sidebar />
            <main className="flex-1 min-w-0 p-4 sm:p-6 max-w-full">
              <div className="mx-auto max-w-7xl">{renderSection(section, user.role)}</div>
            </main>
          </div>
        </div>
      );
    }
    return <UserDashboard />;
  }

  // ─── Agent Panel view ────────────────────────────────────────
  if (view === "agent-panel") {
    if (!user) return <LoginForm />;
    if (user.mustChangePassword) return <ForceChangePassword />;
    if (user.role === "CORE") return <AgentPanel />;
    // Non-cores redirect to their proper dashboard
    if (user.role === "SUPER_ADMIN") {
      setView("admin");
      return null;
    }
    return <UserDashboard />;
  }

  // ─── Login view ──────────────────────────────────────────────
  if (view === "login") {
    if (user) {
      // Redirect based on role
      if (user.role === "CUSTOMER") setView("user-dashboard");
      else if (user.role === "CORE") setView("agent-panel");
      else setView("admin");
      return null;
    }
    return <LoginForm />;
  }

  // ─── Register view ───────────────────────────────────────────
  if (view === "register") {
    if (user) {
      setView("storefront");
      return null;
    }
    return <RegisterForm />;
  }

  // ─── Storefront view (default) ───────────────────────────────
  return <StorefrontPage />;
}

function renderSection(section: string, role: string) {
  switch (section) {
    case "dashboard":
      return <DashboardSection />;
    case "customers":
      return <CustomersSection />;
    case "cores":
      return role === "SUPER_ADMIN" ? <CoresSection /> : <NotAuthorized />;
    case "users":
      return role === "SUPER_ADMIN" ? <UsersSection /> : <NotAuthorized />;
    case "deposits":
      return <DepositsSection />;
    case "withdrawals":
      return <WithdrawalsSection />;
    case "trades":
      return <TradesSection />;
    case "wallets":
      return <WalletsSection />;
    case "kyc":
      return role === "SUPER_ADMIN" ? <KycSection /> : <NotAuthorized />;
    case "invitation-codes":
      return <InvitationCodesSection />;
    case "audit-logs":
      return role === "SUPER_ADMIN" ? <AuditLogsSection /> : <NotAuthorized />;
    case "login-history":
      return <LoginHistorySection />;
    case "reports":
      return role === "SUPER_ADMIN" ? <ReportsSection /> : <NotAuthorized />;
    case "settings":
      return role === "SUPER_ADMIN" ? <SettingsSection /> : <NotAuthorized />;
    default:
      return <DashboardSection />;
  }
}

function NotAuthorized() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="text-2xl font-bold text-brock-gold">403</div>
        <div className="text-sm text-muted-foreground">You do not have access to this section.</div>
      </div>
    </div>
  );
}
