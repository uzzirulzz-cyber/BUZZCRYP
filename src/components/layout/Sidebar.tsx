"use client";

import { useApp, AdminSection, CoreSection } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Hexagon,
  ArrowDownToLine,
  ArrowUpFromLine,
  CandlestickChart,
  Wallet,
  FileCheck,
  Ticket,
  ScrollText,
  History,
  BarChart3,
  Settings,
  UserCog,
} from "lucide-react";

type NavItem = { id: string; label: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean };

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "customers", label: "Customers", icon: Users },
  { id: "deposits", label: "Deposits", icon: ArrowDownToLine },
  { id: "withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
  { id: "trades", label: "Trades", icon: CandlestickChart },
  { id: "wallets", label: "Wallets", icon: Wallet },
  { id: "kyc", label: "KYC", icon: FileCheck, adminOnly: true },
  { id: "cores", label: "Core Accounts", icon: Hexagon, adminOnly: true },
  { id: "users", label: "User Management", icon: UserCog, adminOnly: true },
  { id: "invitation-codes", label: "Invitation Codes", icon: Ticket },
  { id: "audit-logs", label: "Audit Logs", icon: ScrollText, adminOnly: true },
  { id: "login-history", label: "Login History", icon: History },
  { id: "reports", label: "Reports", icon: BarChart3, adminOnly: true },
  { id: "settings", label: "Settings", icon: Settings, adminOnly: true },
];

export function Sidebar() {
  const { user, section, setSection } = useApp();

  const items = NAV_ITEMS.filter((i) => !i.adminOnly || user?.role === "SUPER_ADMIN");

  return (
    <aside className="w-16 lg:w-64 shrink-0 border-r border-brock-gold/15 bg-sidebar/60 backdrop-blur-sm">
      <nav className="p-2 space-y-1 sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id as AdminSection | CoreSection)}
              className={cn(
                "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                "hover:bg-sidebar-accent",
                active
                  ? "bg-brock-gold/10 text-brock-gold border border-brock-gold/30"
                  : "text-muted-foreground border border-transparent",
              )}
              title={item.label}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
