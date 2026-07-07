"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Search, MoreHorizontal, CheckCircle2, XCircle, Trash2, ArrowDownToLine, ArrowRight,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtMoney, fmtRelative } from "@/lib/format";
import { StatusBadge } from "./DashboardSection";
import { Pagination } from "./CustomersSection";
import { toast } from "sonner";

type Deposit = {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  txHash: string | null;
  status: string;
  note: string | null;
  createdAt: string;
  customer: {
    user: { name: string; email: string };
    core?: { invitationCode: string; user: { name: string; email: string } };
  };
  createdBy: { name: string; email: string; role: string };
};

export function DepositsSection() {
  const { user } = useApp();
  const isAdmin = user?.role === "SUPER_ADMIN";
  const [items, setItems] = useState<Deposit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (status !== "ALL") params.set("status", status);
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/deposits?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const updateStatus = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/deposits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      const e = await res.json();
      return toast.error(e.error || "Failed");
    }
    toast.success(`Deposit ${newStatus.toLowerCase()}`);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this deposit? Wallet will be reversed if approved.")) return;
    const res = await fetch(`/api/deposits/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Failed");
    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowDownToLine className="h-6 w-6 text-brock-gold" />
            Deposits
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "All deposit requests across the platform." : "Deposits for your assigned customers."}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="brock-gradient-gold text-brock-navy"><Plus className="h-4 w-4 mr-1" /> New Deposit</Button>
            </DialogTrigger>
            <CreateDepositForm onCreated={() => { setCreateOpen(false); load(); }} />
          </Dialog>
        )}
      </div>

      <Card className="brock-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customer email..."
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                className="pl-8 bg-input/40"
              />
            </div>
            <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v); }}>
              <SelectTrigger className="w-32 bg-input/40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
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
                  <TableHead>Core</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>TX Hash</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
                {!loading && items.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No deposits</TableCell></TableRow>}
                {!loading && items.map((d) => (
                  <TableRow key={d.id} className="hover:bg-sidebar-accent/40">
                    <TableCell>
                      <div className="font-medium">{d.customer?.user?.name}</div>
                      <div className="text-[11px] text-muted-foreground">{d.customer?.user?.email}</div>
                    </TableCell>
                    <TableCell>
                      {d.customer?.core ? (
                        <span className="text-xs font-mono">{d.customer.core.invitationCode}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="font-semibold brock-text-gold">{fmtMoney(d.amount, d.currency)}</TableCell>
                    <TableCell className="text-xs font-mono">{d.txHash || "—"}</TableCell>
                    <TableCell><StatusBadge status={d.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtRelative(d.createdAt)}</TableCell>
                    <TableCell>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateStatus(d.id, "APPROVED")} disabled={d.status === "APPROVED"}>
                              <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(d.id, "REJECTED")} disabled={d.status === "REJECTED"}>
                              <XCircle className="h-4 w-4 mr-2" /> Reject
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => remove(d.id)} className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
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

function CreateDepositForm({ onCreated }: { onCreated: () => void }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDT");
  const [txHash, setTxHash] = useState("");
  const [status, setStatus] = useState("APPROVED");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/customers?pageSize=100", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCustomers(d.items || []));
  }, []);

  const submit = async () => {
    if (!customerId || !amount) return toast.error("Customer and amount required");
    setSaving(true);
    try {
      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          amount: parseFloat(amount),
          currency,
          txHash: txHash || undefined,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed");
      toast.success("Deposit created");
      setCustomerId(""); setAmount(""); setTxHash("");
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New deposit</DialogTitle>
        <DialogDescription>Approved deposits credit the customer wallet immediately. Pending deposits wait for approval.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div className="space-y-1.5">
          <Label>Customer</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.user.name} — {c.user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["USDT", "BTC", "ETH", "USDC"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>TX Hash (optional)</Label>
          <Input value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x..." />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="APPROVED">Approved (credit now)</SelectItem>
              <SelectItem value="PENDING">Pending (await review)</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving} className="brock-gradient-gold text-brock-navy">
          {saving ? "Creating..." : "Create deposit"} <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
