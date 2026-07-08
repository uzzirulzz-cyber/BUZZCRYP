"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { fmtMoney, fmtNum, fmtRelative, fmtDate } from "@/lib/format";
import { StatusBadge } from "@/components/sections/DashboardSection";
import { BlockExchangeLogo, BlockExchangeWordmark } from "@/components/brand/BlockExchangeLogo";
import {
  Hexagon, Users, DollarSign, ArrowDownToLine, ArrowUpFromLine, Ticket,
  Award, Percent, Copy, Check, UserCog, LogOut, Home as HomeIcon,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type AgentData = {
  profile: { id: string; uid: string; name: string; email: string; mobile?: string | null; role: string; lastLogin: string | null; createdAt: string };
  core: { id: string; userId: string; invitationCode: string; referralCode: string; commissionRate: number; commissionEarned: number; active: boolean; createdAt: string } | null;
};

type Customer = {
  id: string; invitationCode: string; referralCode: string | null;
  walletBalance: number; frozenBalance: number; kycStatus: string; accountStatus: string;
  registrationTimestamp: string; createdAt: string;
  user: { id: string; uid: string; name: string; email: string; mobile?: string | null; lastLogin: string | null };
};

export function AgentPanel() {
  const { user, logout, setView } = useApp();
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/me", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/customers?pageSize=100", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/deposits?pageSize=50", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/withdrawals?pageSize=50", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([me, cust, dep, wd]) => {
      setAgent(me);
      setCustomers(cust.items || []);
      setDeposits(dep.items || []);
      setWithdrawals(wd.items || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground">Loading agent panel...</div>;
  if (!agent?.core) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-muted-foreground">No agent profile found.</p>
        <Button onClick={() => setView("admin")}>Go to Admin</Button>
      </div>
    );
  }

  const copyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast.success(`${label} copied: ${code}`);
    setTimeout(() => setCopied(null), 2000);
  };

  const totalCustomerBalance = customers.reduce((s, c) => s + c.walletBalance, 0);
  const totalFrozen = customers.reduce((s, c) => s + c.frozenBalance, 0);
  const activeCustomers = customers.filter((c) => c.accountStatus === "ACTIVE").length;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-brock-gold/15 bg-sidebar/80 backdrop-blur-md">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button onClick={() => setView("storefront")} className="flex items-center gap-3">
            <BlockExchangeLogo size="sm" />
            <div className="hidden sm:block">
              <BlockExchangeWordmark size="sm" />
              <div className="text-[10px] text-muted-foreground leading-tight">Sub-Agent Panel</div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-brock-blue/40 text-brock-blue">SUB-AGENT</Badge>
            <Button variant="ghost" size="sm" onClick={() => setView("storefront")}><HomeIcon className="h-4 w-4 mr-1" /> Home</Button>
            <Button variant="ghost" size="sm" onClick={() => logout()}><LogOut className="h-4 w-4 mr-1" /> Sign out</Button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Sub-Agent Panel</h1>
            <p className="text-sm text-muted-foreground">
              {agent.profile.name} · UID: <span className="font-mono text-brock-gold">{agent.profile.uid}</span>
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Invited Users" value={fmtNum(customers.length, 0)} subtitle={`${activeCustomers} active`} icon={Users} accent="gold" />
          <StatCard title="Customer Wallets" value={fmtMoney(totalCustomerBalance)} subtitle="Total balance" icon={DollarSign} accent="blue" />
          <StatCard title="Commission Earned" value={fmtMoney(agent.core.commissionEarned)} subtitle={`Rate: ${(agent.core.commissionRate * 100).toFixed(0)}%`} icon={Award} accent="gold" />
          <StatCard title="Frozen Funds" value={fmtMoney(totalFrozen)} subtitle="In pending trades" icon={ArrowDownToLine} accent="blue" />
        </div>

        {/* Profile + codes */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="brock-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><UserCog className="h-4 w-4 text-brock-gold" /> Agent Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="UID" value={<span className="font-mono text-brock-gold">{agent.profile.uid}</span>} />
              <Row label="Name" value={agent.profile.name} />
              <Row label="Email" value={agent.profile.email} />
              <Row label="Mobile" value={agent.profile.mobile || "—"} />
              <Row label="Status" value={<StatusBadge status={agent.core.active ? "ACTIVE" : "INACTIVE"} />} />
              <Row label="Member Since" value={fmtDate(agent.profile.createdAt)} />
              <Row label="Last Login" value={agent.profile.lastLogin ? fmtRelative(agent.profile.lastLogin) : "Never"} />
            </CardContent>
          </Card>

          <Card className="brock-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Ticket className="h-4 w-4 text-brock-gold" /> Invitation Code</CardTitle>
              <CardDescription>Share this with customers to register under you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="font-mono text-2xl font-bold brock-text-gold text-center py-2">{agent.core.invitationCode}</div>
              <Button variant="outline" className="w-full" onClick={() => copyCode(agent.core.invitationCode, "Invitation code")}>
                {copied === agent.core.invitationCode ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                Copy code
              </Button>
            </CardContent>
          </Card>

          <Card className="brock-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Hexagon className="h-4 w-4 text-brock-gold" /> Referral Code</CardTitle>
              <CardDescription>Your commission-tracking referral code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="font-mono text-2xl font-bold brock-text-gold text-center py-2">{agent.core.referralCode}</div>
              <Button variant="outline" className="w-full" onClick={() => copyCode(agent.core.referralCode, "Referral code")}>
                {copied === agent.core.referralCode ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                Copy code
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Invited users table */}
        <Card className="brock-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-brock-gold" /> Invited Users ({customers.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-96">
              <Table>
                <TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>UID</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead>
                  <TableHead>Wallet</TableHead><TableHead>KYC</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {customers.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No invited users yet</TableCell></TableRow>}
                  {customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs text-brock-gold">{c.user.uid}</TableCell>
                      <TableCell className="font-medium">{c.user.name}</TableCell>
                      <TableCell className="text-xs">{c.user.email}</TableCell>
                      <TableCell className="font-semibold">{fmtMoney(c.walletBalance)}</TableCell>
                      <TableCell><StatusBadge status={c.kycStatus} /></TableCell>
                      <TableCell><StatusBadge status={c.accountStatus} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtRelative(c.registrationTimestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Deposit + Withdrawal records */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="brock-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><ArrowDownToLine className="h-4 w-4 text-brock-gold" /> Deposit Records ({deposits.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-72 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Customer</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>When</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {deposits.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-sm">No deposits</TableCell></TableRow>}
                    {deposits.slice(0, 20).map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-xs">{d.customer?.user?.email}</TableCell>
                        <TableCell className="font-semibold brock-text-gold">{fmtMoney(d.amount)}</TableCell>
                        <TableCell><StatusBadge status={d.status} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtRelative(d.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="brock-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><ArrowUpFromLine className="h-4 w-4 text-brock-blue" /> Withdrawal Records ({withdrawals.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-72 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Customer</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>When</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {withdrawals.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-sm">No withdrawals</TableCell></TableRow>}
                    {withdrawals.slice(0, 20).map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="text-xs">{w.customer?.user?.email}</TableCell>
                        <TableCell className="font-semibold brock-text-gold">{fmtMoney(w.amount)}</TableCell>
                        <TableCell><StatusBadge status={w.status} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtRelative(w.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
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
          <span className="text-xs text-muted-foreground">{title}</span>
          <Icon className={accent === "gold" ? "h-4 w-4 text-brock-gold" : "h-4 w-4 text-brock-blue"} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
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
