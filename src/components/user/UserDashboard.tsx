"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { fmtMoney, fmtNum, fmtDate, fmtRelative } from "@/lib/format";
import { StatusBadge } from "@/components/sections/DashboardSection";
import { BlockExchangeLogo, BlockExchangeWordmark } from "@/components/brand/BlockExchangeLogo";
import {
  Wallet, Snowflake, TrendingUp, TrendingDown, ArrowDownToLine, ArrowUpFromLine,
  CandlestickChart, Bell, User as UserIcon, Award, Percent, Activity,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MeData = {
  profile: {
    id: string; uid: string; name: string; email: string; mobile?: string | null;
    role: string; lastLogin: string | null; createdAt: string;
  };
  customer: {
    id: string; uid: string; walletBalance: number; frozenBalance: number;
    totalAssets: number; kycStatus: string; accountStatus: string;
    invitationCode: string; referralCode?: string | null;
    core?: { invitationCode: string; referralCode: string; user: { name: string; email: string } } | null;
    registrationTimestamp: string;
  };
  stats: {
    totalDeposits: number; totalWithdrawals: number;
    pendingDeposits: number; pendingWithdrawals: number;
    totalTrades: number; wins: number; losses: number; winRate: number;
    totalStaked: number; totalPayout: number; profitLoss: number;
  };
  deposits: any[]; withdrawals: any[]; trades: any[]; notifications: any[];
  recentTransactions: Array<{ id: string; type: string; amount: number; currency: string; status: string; createdAt: string }>;
};

export function UserDashboard() {
  const { user, logout, setView } = useApp();
  const [data, setData] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground">Loading your dashboard...</div>;
  if (!data || !data.customer) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-muted-foreground">No customer profile found.</p>
        <Button onClick={() => setView("admin")}>Go to Admin</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <UserTopBar />
      <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {data.profile.name}</h1>
            <p className="text-sm text-muted-foreground">
              UID: <span className="font-mono text-brock-gold">{data.profile.uid}</span> ·
              Sub-Agent: <span className="font-mono">{data.customer.core?.invitationCode}</span>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => logout()}>Sign out</Button>
        </div>

        {/* Wallet summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Total Assets" value={fmtMoney(data.customer.totalAssets)} subtitle="Wallet + Frozen" icon={Wallet} accent="gold" />
          <StatCard title="Available Balance" value={fmtMoney(data.customer.walletBalance)} subtitle="Ready to trade" icon={TrendingUp} accent="blue" />
          <StatCard title="Frozen Balance" value={fmtMoney(data.customer.frozenBalance)} subtitle="In pending trades" icon={Snowflake} accent="blue" />
          <StatCard title="Profit / Loss" value={fmtMoney(data.stats.profitLoss)} subtitle={`${data.stats.wins}W / ${data.stats.losses}L`} icon={data.stats.profitLoss >= 0 ? TrendingUp : TrendingDown} accent={data.stats.profitLoss >= 0 ? "gold" : "blue"} />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MiniStat label="Total Deposits" value={fmtMoney(data.stats.totalDeposits)} icon={ArrowDownToLine} />
          <MiniStat label="Total Withdrawals" value={fmtMoney(data.stats.totalWithdrawals)} icon={ArrowUpFromLine} />
          <MiniStat label="Total Trades" value={fmtNum(data.stats.totalTrades, 0)} icon={CandlestickChart} />
          <MiniStat label="Win Rate" value={`${data.stats.winRate.toFixed(1)}%`} icon={Percent} />
        </div>

        {/* Profile + KYC */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="brock-card">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserIcon className="h-4 w-4 text-brock-gold" /> Profile</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="UID" value={<span className="font-mono text-brock-gold">{data.profile.uid}</span>} />
              <Row label="Name" value={data.profile.name} />
              <Row label="Email" value={data.profile.email} />
              <Row label="Mobile" value={data.profile.mobile || "—"} />
              <Row label="KYC" value={<StatusBadge status={data.customer.kycStatus} />} />
              <Row label="Account" value={<StatusBadge status={data.customer.accountStatus} />} />
              <Row label="Invitation Code" value={<span className="font-mono">{data.customer.invitationCode}</span>} />
              <Row label="Referral Code" value={<span className="font-mono">{data.customer.referralCode || "—"}</span>} />
              <Row label="Sub-Agent" value={data.customer.core?.user?.email || "—"} />
              <Row label="Last Login" value={data.profile.lastLogin ? fmtRelative(data.profile.lastLogin) : "Never"} />
              <Row label="Member Since" value={fmtDate(data.profile.createdAt)} />
            </CardContent>
          </Card>

          {/* Recent transactions */}
          <Card className="brock-card lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-brock-gold" /> Recent Transactions</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentTransactions.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No transactions yet</TableCell></TableRow>
                    )}
                    {data.recentTransactions.map((t) => (
                      <TableRow key={`${t.type}-${t.id}`}>
                        <TableCell>
                          <Badge variant="outline" className={
                            t.type === "DEPOSIT" ? "border-brock-gold/40 text-brock-gold" :
                            t.type === "WITHDRAWAL" ? "border-brock-blue/40 text-brock-blue" :
                            "border-purple-400/40 text-purple-400"
                          }>{t.type}</Badge>
                        </TableCell>
                        <TableCell className={t.amount >= 0 ? "text-emerald-400 font-semibold" : "text-destructive font-semibold"}>
                          {t.amount >= 0 ? "+" : ""}{fmtMoney(t.amount, t.currency)}
                        </TableCell>
                        <TableCell><StatusBadge status={t.status} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtRelative(t.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed history tabs */}
        <Tabs defaultValue="trades">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="trades"><CandlestickChart className="h-3.5 w-3.5 mr-1" /> Trades ({data.trades.length})</TabsTrigger>
            <TabsTrigger value="deposits"><ArrowDownToLine className="h-3.5 w-3.5 mr-1" /> Deposits ({data.deposits.length})</TabsTrigger>
            <TabsTrigger value="withdrawals"><ArrowUpFromLine className="h-3.5 w-3.5 mr-1" /> Withdrawals ({data.withdrawals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="trades">
            <Card className="brock-card"><CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Pair</TableHead><TableHead>Direction</TableHead><TableHead>Stake</TableHead>
                    <TableHead>Duration</TableHead><TableHead>Outcome</TableHead><TableHead>Payout</TableHead><TableHead>When</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {data.trades.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No trades yet</TableCell></TableRow>}
                    {data.trades.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-sm">{t.pair}</TableCell>
                        <TableCell><Badge variant="outline" className={t.direction === "UP" ? "border-brock-gold/40 text-brock-gold" : "border-brock-blue/40 text-brock-blue"}>{t.direction}</Badge></TableCell>
                        <TableCell className="font-semibold">{fmtMoney(t.amount)}</TableCell>
                        <TableCell>{t.duration}s</TableCell>
                        <TableCell><StatusBadge status={t.outcome} /></TableCell>
                        <TableCell className="font-semibold">{t.payout > 0 ? fmtMoney(t.payout) : "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtRelative(t.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="deposits">
            <Card className="brock-card"><CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Amount</TableHead><TableHead>Currency</TableHead><TableHead>TX Hash</TableHead><TableHead>Status</TableHead><TableHead>When</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {data.deposits.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No deposits yet</TableCell></TableRow>}
                    {data.deposits.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-semibold brock-text-gold">{fmtMoney(d.amount)}</TableCell>
                        <TableCell>{d.currency}</TableCell>
                        <TableCell className="text-xs font-mono">{d.txHash || "—"}</TableCell>
                        <TableCell><StatusBadge status={d.status} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtRelative(d.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card className="brock-card"><CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Amount</TableHead><TableHead>Currency</TableHead><TableHead>Dest Address</TableHead><TableHead>Status</TableHead><TableHead>When</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {data.withdrawals.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No withdrawals yet</TableCell></TableRow>}
                    {data.withdrawals.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-semibold brock-text-gold">{fmtMoney(w.amount)}</TableCell>
                        <TableCell>{w.currency}</TableCell>
                        <TableCell className="text-xs font-mono">{w.destAddress || "—"}</TableCell>
                        <TableCell><StatusBadge status={w.status} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtRelative(w.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent></Card>
          </TabsContent>
        </Tabs>

        {/* Notifications */}
        <Card className="brock-card">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4 text-brock-gold" /> Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.notifications.length === 0 && <div className="text-center py-4 text-muted-foreground text-sm">No notifications</div>}
            {data.notifications.map((n) => (
              <div key={n.id} className={`rounded-md p-3 border ${n.read ? "bg-muted/20 border-border/40" : "bg-brock-gold/5 border-brock-gold/30"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm">{n.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{fmtRelative(n.createdAt)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, accent }: {
  title: string; value: string; subtitle: string;
  icon: React.ComponentType<{ className?: string }>; accent: "gold" | "blue";
}) {
  return (
    <Card className="brock-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          <Icon className={accent === "gold" ? "h-4 w-4 text-brock-gold" : "h-4 w-4 text-brock-blue"} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, icon: Icon }: {
  label: string; value: string; icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="brock-card">
      <CardContent className="p-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-brock-gold shrink-0" />
        <div className="min-w-0">
          <div className="text-[10px] text-muted-foreground truncate">{label}</div>
          <div className="text-sm font-semibold truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function UserTopBar() {
  const { user, logout, setView } = useApp();
  return (
    <header className="sticky top-0 z-30 border-b border-brock-gold/15 bg-sidebar/80 backdrop-blur-md">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <button onClick={() => setView("storefront")} className="flex items-center gap-3">
          <BlockExchangeLogo size="sm" />
          <div className="hidden sm:block">
            <BlockExchangeWordmark size="sm" />
            <div className="text-[10px] text-muted-foreground leading-tight">User Dashboard</div>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-brock-blue/40 text-brock-blue">CUSTOMER</Badge>
          <Button variant="ghost" size="sm" onClick={() => setView("storefront")}>Home</Button>
          <Button variant="ghost" size="sm" onClick={() => logout()}>Sign out</Button>
        </div>
      </div>
    </header>
  );
}
