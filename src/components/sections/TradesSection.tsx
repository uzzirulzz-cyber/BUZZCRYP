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
import { Plus, Search, Trash2, CandlestickChart, ArrowRight } from "lucide-react";
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
  amount: number;
  price: number;
  total: number;
  status: string;
  createdAt: string;
  customer: {
    user: { name: string; email: string };
    core?: { invitationCode: string };
  };
};

export function TradesSection() {
  const { user } = useApp();
  const isAdmin = user?.role === "SUPER_ADMIN";
  const [items, setItems] = useState<Trade[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [side, setSide] = useState("ALL");
  const [pair, setPair] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (side !== "ALL") params.set("side", side);
    if (pair !== "ALL") params.set("pair", pair);
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/trades?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, side, pair, search]);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CandlestickChart className="h-6 w-6 text-brock-gold" />
            Trades
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "All trades across the platform." : "Trades for your assigned customers."}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="brock-gradient-gold text-brock-navy"><Plus className="h-4 w-4 mr-1" /> New Trade</Button>
            </DialogTrigger>
            <CreateTradeForm onCreated={() => { setCreateOpen(false); load(); }} />
          </Dialog>
        )}
      </div>

      <Card className="brock-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                className="pl-8 bg-input/40"
              />
            </div>
            <Select value={side} onValueChange={(v) => { setPage(1); setSide(v); }}>
              <SelectTrigger className="w-32 bg-input/40"><SelectValue placeholder="Side" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All sides</SelectItem>
                <SelectItem value="BUY">Buy</SelectItem>
                <SelectItem value="SELL">Sell</SelectItem>
              </SelectContent>
            </Select>
            <Select value={pair} onValueChange={(v) => { setPage(1); setPair(v); }}>
              <SelectTrigger className="w-36 bg-input/40"><SelectValue placeholder="Pair" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All pairs</SelectItem>
                {["BTC/USDT", "ETH/USDT", "BTG/USDT", "BTS/USDT"].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
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
                  <TableHead>Side</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>When</TableHead>
                  {isAdmin && <TableHead className="w-12"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
                {!loading && items.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No trades</TableCell></TableRow>}
                {!loading && items.map((t) => (
                  <TableRow key={t.id} className="hover:bg-sidebar-accent/40">
                    <TableCell>
                      <div className="font-medium">{t.customer?.user?.name}</div>
                      <div className="text-[11px] text-muted-foreground">{t.customer?.user?.email}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{t.pair}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={t.side === "BUY" ? "border-brock-gold/40 text-brock-gold" : "border-brock-blue/40 text-brock-blue"}>
                        {t.side}
                      </Badge>
                    </TableCell>
                    <TableCell>{fmtNum(t.amount, 4)}</TableCell>
                    <TableCell>{fmtMoney(t.price)}</TableCell>
                    <TableCell className="font-semibold">{fmtMoney(t.total)}</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
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

const MARKET_PRICES: Record<string, number> = {
  "BTC/USDT": 62500,
  "ETH/USDT": 3120,
  "BTG/USDT": 38.5,
  "BTS/USDT": 0.045,
};

function CreateTradeForm({ onCreated }: { onCreated: () => void }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [pair, setPair] = useState("BTC/USDT");
  const [side, setSide] = useState("BUY");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const price = MARKET_PRICES[pair] || 0;
  const total = parseFloat(amount || "0") * price;

  useEffect(() => {
    fetch("/api/customers?pageSize=100", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCustomers(d.items || []));
  }, []);

  const submit = async () => {
    if (!customerId || !amount) return toast.error("Customer and amount required");
    setSaving(true);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, pair, side, amount: parseFloat(amount), price }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed");
      toast.success("Trade recorded");
      setCustomerId(""); setAmount("");
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Record manual trade</DialogTitle>
        <DialogDescription>Trades are recorded as COMPLETED and do not affect wallet balance (paper trading).</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div className="space-y-1.5">
          <Label>Customer</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.user.name} — {c.user.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>Pair</Label>
            <Select value={pair} onValueChange={(v) => { setPair(v); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(MARKET_PRICES).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Side</Label>
            <Select value={side} onValueChange={setSide}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BUY">BUY</SelectItem>
                <SelectItem value="SELL">SELL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Amount (in base asset)</Label>
          <Input type="number" step="0.0001" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.01" />
        </div>
        <div className="rounded-md p-3 bg-muted/30 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Market price</span><span>{fmtMoney(price)}</span></div>
          <div className="flex justify-between font-semibold"><span>Estimated total</span><span className="brock-text-gold">{fmtMoney(total)}</span></div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving} className="brock-gradient-gold text-brock-navy">
          {saving ? "Recording..." : "Record trade"} <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
