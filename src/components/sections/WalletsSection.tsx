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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Wallet, Plus, ArrowRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtMoney, fmtRelative } from "@/lib/format";
import { Pagination } from "./CustomersSection";
import { toast } from "sonner";

type Adj = {
  id: string;
  customerId: string;
  amount: number;
  reason: string;
  createdAt: string;
  customer: {
    user: { name: string; email: string };
    core?: { invitationCode: string };
  };
  createdBy: { name: string; email: string; role: string };
};

export function WalletsSection() {
  const { user } = useApp();
  const isAdmin = user?.role === "SUPER_ADMIN";
  const [items, setItems] = useState<Adj[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wallets?page=${page}&pageSize=20`, { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-brock-gold" />
            Wallet Adjustments
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Manual credits and debits to customer wallets. Every change is audited." : "Wallet history for your assigned customers."}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="brock-gradient-gold text-brock-navy"><Plus className="h-4 w-4 mr-1" /> New Adjustment</Button>
            </DialogTrigger>
            <CreateAdjustmentForm onCreated={() => { setCreateOpen(false); load(); }} />
          </Dialog>
        )}
      </div>

      <Card className="brock-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
                {!loading && items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No adjustments</TableCell></TableRow>}
                {!loading && items.map((a) => (
                  <TableRow key={a.id} className="hover:bg-sidebar-accent/40">
                    <TableCell>
                      <div className="font-medium">{a.customer?.user?.name}</div>
                      <div className="text-[11px] text-muted-foreground">{a.customer?.user?.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={a.amount >= 0 ? "border-brock-gold/40 text-brock-gold" : "border-brock-blue/40 text-brock-blue"}>
                        {a.amount >= 0 ? <ArrowDownLeft className="h-3 w-3 mr-1" /> : <ArrowUpRight className="h-3 w-3 mr-1" />}
                        {a.amount >= 0 ? "+" : ""}{fmtMoney(a.amount)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{a.reason}</TableCell>
                    <TableCell className="text-xs">{a.createdBy?.email}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtRelative(a.createdAt)}</TableCell>
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

function CreateAdjustmentForm({ onCreated }: { onCreated: () => void }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/customers?pageSize=100", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCustomers(d.items || []));
  }, []);

  const submit = async () => {
    if (!customerId || !amount || !reason) return toast.error("All fields required");
    setSaving(true);
    try {
      const res = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, amount: parseFloat(amount), reason }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed");
      toast.success("Wallet adjusted");
      setCustomerId(""); setAmount(""); setReason("");
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Manual wallet adjustment</DialogTitle>
        <DialogDescription>Use a positive amount to credit, negative to debit. The adjustment is logged in the audit trail.</DialogDescription>
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
        <div className="space-y-1.5">
          <Label>Amount (signed, e.g. 500 or -100)</Label>
          <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Reason</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Manual credit, bonus, correction" />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving} className="brock-gradient-gold text-brock-navy">
          {saving ? "Applying..." : "Apply adjustment"} <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
