"use client";

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Wallet, ArrowDownToLine, ArrowUpFromLine, CandlestickChart } from "lucide-react";
import { fmtMoney, fmtNum } from "@/lib/format";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
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
  tradeVolumeSeries: Array<{ day: string; total: number; count: number }>;
};

export function ReportsSection() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground">Loading reports...</div>;
  if (!stats) return <div className="p-6 text-muted-foreground">Failed to load</div>;

  const pieData = [
    { name: "Active customers", value: stats.totals.activeCustomers, color: "#d4af37" },
    { name: "Inactive", value: Math.max(0, stats.totals.customers - stats.totals.activeCustomers), color: "#1e90ff" },
  ];
  const kycPie = [
    { name: "Verified", value: stats.totals.verifiedKyc, color: "#d4af37" },
    { name: "Pending", value: stats.totals.pendingKyc, color: "#1e90ff" },
    { name: "Rejected/Other", value: Math.max(0, stats.totals.customers - stats.totals.verifiedKyc - stats.totals.pendingKyc), color: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-brock-gold" />
          Reports & Analytics
        </h1>
        <p className="text-sm text-muted-foreground">Platform-wide performance metrics.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Customers" value={fmtNum(stats.totals.customers, 0)} icon={Users} accent="gold" />
        <MetricCard title="Total Wallet Balance" value={fmtMoney(stats.totals.totalWalletBalance)} icon={Wallet} accent="blue" />
        <MetricCard title="Total Deposits" value={fmtMoney(stats.totals.totalDeposits)} icon={ArrowDownToLine} accent="gold" />
        <MetricCard title="Total Withdrawals" value={fmtMoney(stats.totals.totalWithdrawals)} icon={ArrowUpFromLine} accent="blue" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="brock-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-brock-gold" /> Daily Trade Volume (14d)</CardTitle>
            <CardDescription>Total USDT traded per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.tradeVolumeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="#93a4c8" fontSize={10} tickFormatter={(d) => d.slice(5)} />
                  <YAxis stroke="#93a4c8" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      background: "#0c1530",
                      border: "1px solid rgba(212,175,55,0.3)",
                      borderRadius: 8,
                      color: "#f1f5f9",
                    }}
                    formatter={(v: number) => [fmtMoney(v), "Volume"]}
                  />
                  <Bar dataKey="total" fill="#d4af37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="brock-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CandlestickChart className="h-4 w-4 text-brock-gold" /> Customer Status</CardTitle>
            <CardDescription>Distribution by activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12, color: "#93a4c8" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="brock-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-brock-gold" /> KYC Distribution</CardTitle>
            <CardDescription>Verification status across all customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={kycPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {kycPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12, color: "#93a4c8" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title, value, icon: Icon, accent,
}: {
  title: string; value: string; icon: React.ComponentType<{ className?: string }>; accent: "gold" | "blue";
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
        <div className="text-xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
