"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtMoney, fmtDate } from "@/lib/format";
import { StatusBadge } from "./DashboardSection";
import { useApp } from "@/lib/store";
import { toast } from "sonner";
import { Wallet, ArrowDownToLine, ArrowUpFromLine, CandlestickChart, Save } from "lucide-react";

export function CustomerDetailDialog({
  id,
  onClose,
  onUpdated,
}: {
  id: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { user } = useApp();
  const isAdmin = user?.role === "SUPER_ADMIN";
  const [cust, setCust] = useState<any>(null);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [cores, setCores] = useState<any[]>([]);
  const [newCore, setNewCore] = useState("");

  useEffect(() => {
    (async () => {
      const [c, d, w, t] = await Promise.all([
        fetch(`/api/customers/${id}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/deposits?customerId=${id}&pageSize=20`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/withdrawals?customerId=${id}&pageSize=20`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/trades?customerId=${id}&pageSize=20`, { cache: "no-store" }).then((r) => r.json()),
      ]);
      setCust(c);
      setDeposits(d.items || []);
      setWithdrawals(w.items || []);
      setTrades(t.items || []);
      if (isAdmin) {
        const cs = await fetch("/api/cores?pageSize=100", { cache: "no-store" }).then((r) => r.json());
        setCores(cs.items || []);
      }
    })();
  }, [id, isAdmin]);

  const doAdjust = async () => {
    const amt = parseFloat(adjustAmount);
    if (!amt || !adjustReason) return toast.error("Amount and reason required");
    const res = await fetch("/api/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: id, amount: amt, reason: adjustReason }),
    });
    if (!res.ok) {
      const e = await res.json();
      return toast.error(e.error || "Failed");
    }
    toast.success("Wallet adjusted");
    setAdjustOpen(false);
    setAdjustAmount(""); setAdjustReason("");
    // reload customer
    const c = await fetch(`/api/customers/${id}`, { cache: "no-store" }).then((r) => r.json());
    setCust(c);
    onUpdated();
  };

  const reassign = async () => {
    if (!newCore) return;
    const res = await fetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coreId: newCore }),
    });
    if (!res.ok) {
      const e = await res.json();
      return toast.error(e.error || "Failed");
    }
    toast.success("Customer reassigned");
    const c = await fetch(`/api/customers/${id}`, { cache: "no-store" }).then((r) => r.json());
    setCust(c);
    onUpdated();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Customer details
            {cust && <StatusBadge status={cust.accountStatus} />}
          </DialogTitle>
          <DialogDescription>
            {cust?.user?.email}
          </DialogDescription>
        </DialogHeader>

        {!cust ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-4">
            {/* Wallet summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Card className="brock-card">
                <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Wallet</CardTitle></CardHeader>
                <CardContent><div className="text-lg font-bold brock-text-gold">{fmtMoney(cust.walletBalance)}</div></CardContent>
              </Card>
              <Card className="brock-card">
                <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">KYC</CardTitle></CardHeader>
                <CardContent><StatusBadge status={cust.kycStatus} /></CardContent>
              </Card>
              <Card className="brock-card">
                <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Core</CardTitle></CardHeader>
                <CardContent><div className="text-sm font-mono">{cust.core?.invitationCode}</div></CardContent>
              </Card>
              <Card className="brock-card">
                <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Registered</CardTitle></CardHeader>
                <CardContent><div className="text-xs">{fmtDate(cust.registrationTimestamp)}</div></CardContent>
              </Card>
            </div>

            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setAdjustOpen(!adjustOpen)}>
                  <Wallet className="h-4 w-4 mr-1" /> Adjust wallet
                </Button>
              </div>
            )}

            {adjustOpen && isAdmin && (
              <Card className="brock-card">
                <CardContent className="pt-4 space-y-2">
                  <div className="text-sm font-semibold">Wallet adjustment</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Amount (signed, +/−)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                        placeholder="e.g. 500 or -100"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Reason</Label>
                      <Input
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                        placeholder="e.g. Manual credit"
                      />
                    </div>
                  </div>
                  <Button size="sm" onClick={doAdjust} className="brock-gradient-gold text-brock-navy">
                    <Save className="h-3 w-3 mr-1" /> Apply
                  </Button>
                </CardContent>
              </Card>
            )}

            {isAdmin && cores.length > 0 && (
              <Card className="brock-card">
                <CardContent className="pt-4 space-y-2">
                  <div className="text-sm font-semibold">Reassign to a different Core</div>
                  <div className="text-xs text-muted-foreground">
                    Permanent operation — Super Admin only. Invitation code on the customer will be updated.
                  </div>
                  <div className="flex gap-2">
                    <Select value={newCore} onValueChange={setNewCore}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Select Core" /></SelectTrigger>
                      <SelectContent>
                        {cores.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.invitationCode} — {c.user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={reassign} disabled={!newCore}>Reassign</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="deposits">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="deposits"><ArrowDownToLine className="h-3.5 w-3.5 mr-1" /> Deposits ({deposits.length})</TabsTrigger>
                <TabsTrigger value="withdrawals"><ArrowUpFromLine className="h-3.5 w-3.5 mr-1" /> Withdrawals ({withdrawals.length})</TabsTrigger>
                <TabsTrigger value="trades"><CandlestickChart className="h-3.5 w-3.5 mr-1" /> Trades ({trades.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="deposits">
                <SimpleTable
                  headers={["Amount", "Status", "TX Hash", "Date"]}
                  rows={deposits.map((d) => [
                    fmtMoney(d.amount, d.currency),
                    <StatusBadge key="s" status={d.status} />,
                    <span className="text-xs font-mono">{d.txHash || "—"}</span>,
                    fmtDate(d.createdAt),
                  ])}
                />
              </TabsContent>
              <TabsContent value="withdrawals">
                <SimpleTable
                  headers={["Amount", "Status", "Dest", "Date"]}
                  rows={withdrawals.map((w) => [
                    fmtMoney(w.amount, w.currency),
                    <StatusBadge key="s" status={w.status} />,
                    <span className="text-xs font-mono">{w.destAddress || "—"}</span>,
                    fmtDate(w.createdAt),
                  ])}
                />
              </TabsContent>
              <TabsContent value="trades">
                <SimpleTable
                  headers={["Pair", "Side", "Amount", "Price", "Total", "Date"]}
                  rows={trades.map((t) => [
                    t.pair,
                    <Badge key="s" variant="outline" className={t.side === "BUY" ? "border-brock-gold/40 text-brock-gold" : "border-brock-blue/40 text-brock-blue"}>{t.side}</Badge>,
                    t.amount,
                    fmtMoney(t.price),
                    fmtMoney(t.total),
                    fmtDate(t.createdAt),
                  ])}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  if (rows.length === 0) {
    return <div className="text-center text-muted-foreground py-8 text-sm">No records</div>;
  }
  return (
    <div className="rounded-md border border-border/40 overflow-hidden max-h-72 overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            {headers.map((h) => <TableHead key={h}>{h}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              {r.map((c, j) => <TableCell key={j}>{c}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
