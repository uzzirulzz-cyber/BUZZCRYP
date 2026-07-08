"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/store";
import { fmtMoney, fmtNum, fmtRelative } from "@/lib/format";
import {
  Users,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  CandlestickChart,
  FileCheck,
  Clock,
  Hexagon,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Stats = {
  totals: {
    customers: number;
    activeCustomers: number;
    verifiedKyc: number;
    pendingKyc: number;
    cores: number;
    activeCores: number;
    totalWalletBalance: number;
    totalDeposits: number;
    totalWithdrawals: number;
    pendingDeposits: number;
    pendingWithdrawals: number;
    totalTrades: number;
  };
  recent: {
    deposits: Array<any>;
    withdrawals: Array<any>;
    trades: Array<any>;
  };
  tradeVolumeSeries: Array<{ day: string; total: number; count: number }>;
};

export function DashboardSection() {
  const { user } = useApp();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        const data = await res.json();
        if (!cancel) setStats(data);
      } catch {
        // ignore
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!stats) return <div className="p-6">Failed to load stats.</div>;

  const isAdmin = user?.role === "SUPER_ADMIN";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.name?.split(" ")[0] || "Trader"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Platform-wide overview of all customers, cores, and trading activity."
            : `Overview of customers assigned to your invitation code.`}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Total Customers"
          value={fmtNum(stats.totals.customers, 0)}
          subtitle={`${stats.totals.activeCustomers} active`}
          icon={Users}
          accent="gold"
        />
        <KpiCard
          title="Wallet Balance"
          value={fmtMoney(stats.totals.totalWalletBalance)}
          subtitle="Across all customers"
          icon={Wallet}
          accent="blue"
        />
        <KpiCard
          title="Total Deposits"
          value={fmtMoney(stats.totals.totalDeposits)}
          subtitle={`${stats.totals.pendingDeposits} pending`}
          icon={ArrowDownToLine}
          accent="gold"
        />
        <KpiCard
          title="Total Withdrawals"
          value={fmtMoney(stats.totals.totalWithdrawals)}
          subtitle={`${stats.totals.pendingWithdrawals} pending`}
          icon={ArrowUpFromLine}
          accent="blue"
        />
      </div>

      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            title="Core Accounts"
            value={fmtNum(stats.totals.cores, 0)}
            subtitle={`${stats.totals.activeCores} active`}
            icon={Hexagon}
            accent="gold"
          />
          <KpiCard
            title="KYC Verified"
            value={fmtNum(stats.totals.verifiedKyc, 0)}
            subtitle={`${stats.totals.pendingKyc} pending`}
            icon={FileCheck}
            accent="blue"
          />
          <KpiCard
            title="Total Trades"
            value={fmtNum(stats.totals.totalTrades, 0)}
            subtitle="All-time"
            icon={CandlestickChart}
            accent="gold"
          />
          <KpiCard
            title="Pending Approvals"
            value={fmtNum(stats.totals.pendingDeposits + stats.totals.pendingWithdrawals, 0)}
            subtitle="Deposits + withdrawals"
            icon={Clock}
            accent="blue"
          />
        </div>
      )}

      {/* Trade volume chart */}
      <Card className="brock-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brock-gold" />
            Trade Volume (14 days)
          </CardTitle>
          <CardDescription>Daily total trade volume in USDT</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.tradeVolumeSeries}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4af37" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="day"
                  stroke="#93a4c8"
                  fontSize={11}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis stroke="#93a4c8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#0c1530",
                    border: "1px solid rgba(212,175,55,0.3)",
                    borderRadius: 8,
                    color: "#f1f5f9",
                  }}
                  formatter={(value: number) => [fmtMoney(value), "Volume"]}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#d4af37"
                  strokeWidth={2}
                  fill="url(#volGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-3 gap-4">
        <RecentList
          title="Recent Deposits"
          icon={ArrowDownToLine}
          accent="gold"
          items={stats.recent.deposits.map((d) => ({
            id: d.id,
            title: d.customer?.user?.name ?? "—",
            subtitle: d.customer?.user?.email ?? "—",
            amount: fmtMoney(d.amount, d.currency),
            status: d.status,
            time: fmtRelative(d.createdAt),
          }))}
        />
        <RecentList
          title="Recent Withdrawals"
          icon={ArrowUpFromLine}
          accent="blue"
          items={stats.recent.withdrawals.map((w) => ({
            id: w.id,
            title: w.customer?.user?.name ?? "—",
            subtitle: w.customer?.user?.email ?? "—",
            amount: fmtMoney(w.amount, w.currency),
            status: w.status,
            time: fmtRelative(w.createdAt),
          }))}
        />
        <RecentList
          title="Recent Trades"
          icon={CandlestickChart}
          accent="gold"
          items={stats.recent.trades.map((t) => ({
            id: t.id,
            title: t.customer?.user?.name ?? "—",
            subtitle: `${t.side} ${t.amount} ${t.pair}`,
            amount: fmtMoney(t.total),
            status: t.status,
            time: fmtRelative(t.createdAt),
          }))}
        />
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "gold" | "blue";
}) {
  return (
    <Card className="brock-card relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          <Icon
            className={
              accent === "gold" ? "h-4 w-4 text-brock-gold" : "h-4 w-4 text-brock-blue"
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
      </CardContent>
    </Card>
  );
}

function RecentList({
  title,
  icon: Icon,
  accent,
  items,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "gold" | "blue";
  items: Array<{
    id: string;
    title: string;
    subtitle: string;
    amount: string;
    status: string;
    time: string;
  }>;
}) {
  return (
    <Card className="brock-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon
            className={
              accent === "gold" ? "h-4 w-4 text-brock-gold" : "h-4 w-4 text-brock-blue"
            }
          />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-72 overflow-y-auto">
        {items.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-4">No records</div>
        )}
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between gap-2 py-2 border-b border-border/40 last:border-0">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{i.title}</div>
              <div className="text-[11px] text-muted-foreground truncate">{i.subtitle}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold">{i.amount}</div>
              <div className="flex items-center gap-1 justify-end">
                <StatusBadge status={i.status} />
                <span className="text-[10px] text-muted-foreground">{i.time}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    APPROVED: "border-brock-gold/40 text-brock-gold",
    VERIFIED: "border-brock-gold/40 text-brock-gold",
    COMPLETED: "border-brock-gold/40 text-brock-gold",
    PENDING: "border-brock-blue/40 text-brock-blue",
    REJECTED: "border-destructive/40 text-destructive",
    CANCELLED: "border-destructive/40 text-destructive",
    ACTIVE: "border-emerald-400/40 text-emerald-400",
    SUSPENDED: "border-amber-400/40 text-amber-400",
    FROZEN: "border-blue-400/40 text-blue-400",
    DELETED: "border-destructive/40 text-destructive",
  };
  return (
    <Badge variant="outline" className={`text-[9px] px-1 py-0 ${map[status] || ""}`}>
      {status}
    </Badge>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-64 bg-muted/40 rounded animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="brock-card">
            <CardHeader>
              <div className="h-3 w-24 bg-muted/40 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-7 w-32 bg-muted/40 rounded animate-pulse" />
              <div className="h-3 w-20 bg-muted/40 rounded animate-pulse mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="brock-card h-72 animate-pulse" />
    </div>
  );
}

export { StatusBadge };
