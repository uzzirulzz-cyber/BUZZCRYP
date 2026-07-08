"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card, CardContent, CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, CandlestickChart, ArrowRight, Zap, Rocket, Gem, TrendingUp, TrendingDown, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtMoney, fmtRelative, fmtNum } from "@/lib/format";
import { StatusBadge } from "./DashboardSection";
import { Pagination } from "./CustomersSection";
import { toast } from "sonner";

type Trade = {
  id: string;
  customerId: string;
  pair: string;
  side: string;
  direction: string;
  amount: number;
  price: number;
  total: number;
  status: string;
  outcome: string;
  duration: number;
  profitPercent: number;
  payout: number;
  settlesAt: string | null;
  createdAt: string;
  customer: {
    user: { name: string; email: string };
    core?: { invitationCode: string };
  };
};

const MARKET_PRICES: Record<string, number> = {
  "BTC/USDT": 62500,
  "ETH/USDT": 3120,
  "BTG/USDT": 38.5,
  "BTS/USDT": 0.045,
};

// Duration tiers — potential returns (illustrative, not guaranteed)
const DURATION_TIERS = [
  { seconds: 30, label: "30s Trade", subtitle: "Quick Trade", profitPercent: 20, icon: Zap, color: "blue" },
  { seconds: 60, label: "60s Trade", subtitle: "Standard Trade", profitPercent: 30, icon: Rocket, color: "gold" },
  { seconds: 120, label: "120s Trade", subtitle: "Premium Trade", profitPercent: 50, icon: Gem, color: "gold" },
] as const;

export function TradesSection() {
  const { user } = useApp();
  const isAdmin = user?.role === "SUPER_ADMIN";
  const [items, setItems] = useState<Trade[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState("ALL");
  const [pair, setPair] = useState("ALL");
  const [outcome, setOutcome] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [settling, setSettling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (direction !== "ALL") params.set("direction", direction);
    if (pair !== "ALL") params.set("pair", pair);
    if (outcome !== "ALL") params.set("outcome", outcome);
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/trades?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, direction, pair, outcome, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const remove = async (id: string) => {
    if (!confirm("Delete this trade?")) return;
    const res = await fetch(`/api/trades/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Failed");
    toast.success("Deleted");
    load();
  };

  const settlePending = async () => {
    setSettling(true);
    try {
      const res = await fetch("/api/trades", { method: "PUT" });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed");
      toast.success(`Settled ${data.settled} pending trade(s)`);
      load();
    } finally {
      setSettling(false);
    }
  };

  const pendingCount = items.filter((t) => t.status === "PENDING").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CandlestickChart className="h-6 w-6 text-brock-gold" />
            Trades
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "All fixed-time trades across the platform." : "Trades for your assigned customers."}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && pendingCount > 0 && (
            <Button variant="outline" onClick={settlePending} disabled={settling}>
              <RefreshCw className={`h-4 w-4 mr-1 ${settling ? "animate-spin" : ""}`} />
              Settle pending ({pendingCount})
            </Button>
          )}
          {isAdmin && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="brock-gradient-gold text-brock-navy"><Plus className="h-4 w-4 mr-1" /> New Trade</Button>
              </DialogTrigger>
              <CreateTradeForm onCreated={() => { setCreateOpen(false); load(); }} />
            </Dialog>
          )}
        </div>
      </div>

      <Card className="brock-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-2">
            <Select value={direction} onValueChange={(v) => { setPage(1); setDirection(v); }}>
              <SelectTrigger className="w-32 bg-input/40"><SelectValue placeholder="Direction" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All directions</SelectItem>
                <SelectItem value="UP">UP</SelectItem>
                <SelectItem value="DOWN">DOWN</SelectItem>
              </SelectContent>
            </Select>
            <Select value={pair} onValueChange={(v) => { setPage(1); setPair(v); }}>
              <SelectTrigger className="w-36 bg-input/40"><SelectValue placeholder="Pair" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All pairs</SelectItem>
                {Object.keys(MARKET_PRICES).map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={outcome} onValueChange={(v) => { setPage(1); setOutcome(v); }}>
              <SelectTrigger className="w-36 bg-input/40"><SelectValue placeholder="Outcome" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All outcomes</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="WIN">Win</SelectItem>
                <SelectItem value="LOSS">Loss</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Customer</TableHead>
                  <TableHead>Pair</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Stake</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Potential</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Payout</TableHead>
                  <TableHead>When</TableHead>
                  {isAdmin && <TableHead className="w-12"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
                {!loading && items.length === 0 && <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No trades</TableCell></TableRow>}
                {!loading && items.map((t) => (
                  <TableRow key={t.id} className="hover:bg-sidebar-accent/40">
                    <TableCell>
                      <div className="font-medium">{t.customer?.user?.name}</div>
                      <div className="text-[11px] text-muted-foreground">{t.customer?.user?.email}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{t.pair}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={t.direction === "UP" ? "border-brock-gold/40 text-brock-gold" : "border-brock-blue/40 text-brock-blue"}>
                        {t.direction === "UP" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {t.direction}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{fmtMoney(t.amount)}</TableCell>
                    <TableCell className="text-sm">{t.duration}s</TableCell>
                    <TableCell className="text-sm text-brock-gold">+{t.profitPercent}%</TableCell>
                    <TableCell><OutcomeBadge outcome={t.outcome} /></TableCell>
                    <TableCell className="font-semibold">{t.payout > 0 ? fmtMoney(t.payout) : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtRelative(t.createdAt)}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(t.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Pagination total={total} page={page} pageSize={20} onPage={setPage} />
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const map: Record<string, string> = {
    PENDING: "border-brock-blue/40 text-brock-blue",
    WIN: "border-emerald-400/40 text-emerald-400",
    LOSS: "border-destructive/40 text-destructive",
    DRAW: "border-amber-400/40 text-amber-400",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${map[outcome] || ""}`}>
      {outcome}
    </Badge>
  );
}

function CreateTradeForm({ onCreated }: { onCreated: () => void }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [pair, setPair] = useState("BTC/USDT");
  const [direction, setDirection] = useState<"UP" | "DOWN">("UP");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState<number>(30);
  const [saving, setSaving] = useState(false);

  const price = MARKET_PRICES[pair] || 0;
  const stake = parseFloat(amount || "0");
  const selectedTier = DURATION_TIERS.find((t) => t.seconds === duration);
  const profitPercent = selectedTier?.profitPercent || 0;
  const potentialPayout = stake + stake * (profitPercent / 100);
  const potentialProfit = stake * (profitPercent / 100);

  useEffect(() => {
    fetch("/api/customers?pageSize=100", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCustomers(d.items || []));
  }, []);

  const submit = async () => {
    if (!customerId || !amount) return toast.error("Customer and stake amount required");
    if (stake <= 0) return toast.error("Stake must be positive");
    setSaving(true);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, pair, direction, amount: stake, duration }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed");
      toast.success(data.message || "Trade placed");
      setCustomerId(""); setAmount("");
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Place a fixed-time trade</DialogTitle>
        <DialogDescription>
          Choose a cryptocurrency, predict if the price will go UP or DOWN, select a duration, and set your stake.
          The stake is debited immediately. If your prediction is correct at settlement, you receive the payout.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Customer + Pair */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>Customer</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Cryptocurrency</Label>
            <Select value={pair} onValueChange={setPair}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(MARKET_PRICES).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Market price display */}
        <div className="rounded-md p-3 bg-muted/30 text-sm flex justify-between items-center">
          <div>
            <div className="text-xs text-muted-foreground">Current market price</div>
            <div className="font-bold brock-text-gold">{fmtMoney(price)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Pair</div>
            <div className="font-mono">{pair}</div>
          </div>
        </div>

        {/* Duration cards */}
        <div className="space-y-1.5">
          <Label>Trade Duration</Label>
          <div className="grid grid-cols-3 gap-2">
            {DURATION_TIERS.map((tier) => {
              const Icon = tier.icon;
              const active = duration === tier.seconds;
              return (
                <button
                  key={tier.seconds}
                  type="button"
                  onClick={() => setDuration(tier.seconds)}
                  className={`relative rounded-lg border p-3 text-left transition-all ${
                    active
                      ? "border-brock-gold/50 bg-brock-gold/10 brock-glow-gold"
                      : "border-border/40 bg-muted/20 hover:border-brock-gold/30"
                  }`}
                >
                  <Icon className={`h-4 w-4 mb-1.5 ${tier.color === "gold" ? "text-brock-gold" : "text-brock-blue"}`} />
                  <div className="text-xs font-semibold">{tier.label}</div>
                  <div className="text-[10px] text-muted-foreground">{tier.subtitle}</div>
                  <div className="mt-1.5 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[10px]">{tier.seconds}s</span>
                  </div>
                  <div className={`text-sm font-bold ${tier.color === "gold" ? "brock-text-gold" : "text-brock-blue"}`}>
                    +{tier.profitPercent}%
                  </div>
                  {active && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brock-gold" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Potential Return: Up to +{profitPercent}% — illustrative rate, not guaranteed.
          </p>
        </div>

        {/* Direction toggle */}
        <div className="space-y-1.5">
          <Label>Direction — predict the price movement</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection("UP")}
              className={`rounded-lg border p-3 flex flex-col items-center gap-1 transition-all ${
                direction === "UP"
                  ? "border-brock-gold/50 bg-brock-gold/10 brock-glow-gold"
                  : "border-border/40 bg-muted/20 hover:border-brock-gold/30"
              }`}
            >
              <TrendingUp className={`h-5 w-5 ${direction === "UP" ? "text-brock-gold" : "text-muted-foreground"}`} />
              <span className="text-sm font-semibold">UP</span>
              <span className="text-[10px] text-muted-foreground">Price goes higher</span>
            </button>
            <button
              type="button"
              onClick={() => setDirection("DOWN")}
              className={`rounded-lg border p-3 flex flex-col items-center gap-1 transition-all ${
                direction === "DOWN"
                  ? "border-brock-blue/50 bg-brock-blue/10 brock-glow-blue"
                  : "border-border/40 bg-muted/20 hover:border-brock-blue/30"
              }`}
            >
              <TrendingDown className={`h-5 w-5 ${direction === "DOWN" ? "text-brock-blue" : "text-muted-foreground"}`} />
              <span className="text-sm font-semibold">DOWN</span>
              <span className="text-[10px] text-muted-foreground">Price goes lower</span>
            </button>
          </div>
        </div>

        {/* Stake amount */}
        <div className="space-y-1.5">
          <Label>Stake amount (USDT)</Label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 100.00"
          />
        </div>

        {/* Summary */}
        <div className="rounded-md p-3 bg-muted/30 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Stake</span><span>{fmtMoney(stake)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Direction</span><span className={direction === "UP" ? "text-brock-gold" : "text-brock-blue"}>{direction}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span>{duration}s</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Potential return</span><span className="text-brock-gold">Up to +{profitPercent}%</span></div>
          <div className="flex justify-between font-semibold border-t border-border/40 pt-1 mt-1">
            <span>Potential payout</span>
            <span className="brock-text-gold">{stake > 0 ? fmtMoney(potentialPayout) : "—"}</span>
          </div>
          {stake > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Potential profit</span>
              <span className="text-emerald-400">+{fmtMoney(potentialProfit)}</span>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 rounded-md p-2.5 bg-amber-500/5 border border-amber-500/20 text-[11px] text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Returns are illustrative and subject to the platform&apos;s rules and successful trade outcomes.
            Trading involves risk — you may lose your entire stake if your prediction is incorrect.
          </span>
        </div>
      </div>

      <DialogFooter>
        <Button onClick={submit} disabled={saving || stake <= 0} className="brock-gradient-gold text-brock-navy">
          {saving ? "Placing trade..." : `Place ${direction} trade — ${duration}s`}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
