"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { LoginForm } from "@/components/auth/LoginForm";
import { ForceChangePassword } from "@/components/auth/ForceChangePassword";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
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

export default function Home() {
  const { user, loadingUser, section, refreshUser } = useApp();

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

  // Not authenticated → login screen
  if (!user) {
    return <LoginForm />;
  }

  // Authenticated but must change password → forced password change screen
  if (user.mustChangePassword) {
    return <ForceChangePassword />;
  }

  // Authenticated dashboard
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
