"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Hexagon, Plus, MoreHorizontal, Ban, CheckCircle2, Trash2, ArrowRight } from "lucide-react";
import { fmtMoney, fmtRelative } from "@/lib/format";
import { StatusBadge } from "./DashboardSection";
import { Pagination } from "./CustomersSection";
import { toast } from "sonner";

type Core = {
  id: string;
  userId: string;
  invitationCode: string;
  active: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string; lastLogin: string | null; accountStatus: string; mustChangePassword: boolean };
  customerCount: number;
  totalWalletBalance: number;
};

export function CoresSection() {
  const [items, setItems] = useState<Core[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cores?page=${page}&pageSize=50`, { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/cores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountStatus: status }),
    });
    if (!res.ok) {
      const e = await res.json();
      return toast.error(e.error || "Failed");
    }
    toast.success(`Core ${status.toLowerCase()}`);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this Core? Status → DELETED.")) return;
    const res = await fetch(`/api/cores/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Failed");
    toast.success("Core deleted");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Hexagon className="h-6 w-6 text-brock-gold" />
            Core Accounts
          </h1>
          <p className="text-sm text-muted-foreground">
            Each Core owns a unique invitation code. Customers are permanently assigned to the Core whose code they registered with.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="brock-gradient-gold text-brock-navy"><Plus className="h-4 w-4 mr-1" /> New Core</Button>
          </DialogTrigger>
          <CreateCoreForm onCreated={() => { setCreateOpen(false); load(); }} />
        </Dialog>
      </div>

      <Card className="brock-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Core</TableHead>
                  <TableHead>Invitation Code</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead>Total Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
                {!loading && items.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No cores</TableCell></TableRow>}
                {!loading && items.map((c) => (
                  <TableRow key={c.id} className="hover:bg-sidebar-accent/40">
                    <TableCell>
                      <div className="font-medium">{c.user.name}</div>
                      <div className="text-[11px] text-muted-foreground">{c.user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono border-brock-gold/40 text-brock-gold">
                        {c.invitationCode}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.customerCount}</TableCell>
                    <TableCell className="font-semibold">{fmtMoney(c.totalWalletBalance)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <StatusBadge status={c.user.accountStatus} />
                        {!c.active && <Badge variant="outline" className="text-destructive border-destructive/40">INACTIVE</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.user.lastLogin ? fmtRelative(c.user.lastLogin) : "Never"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setStatus(c.id, "ACTIVE")}><CheckCircle2 className="h-4 w-4 mr-2" /> Activate</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatus(c.id, "SUSPENDED")}><Ban className="h-4 w-4 mr-2" /> Suspend</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => remove(c.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Pagination total={total} page={page} pageSize={50} onPage={setPage} />
    </div>
  );
}

function CreateCoreForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name || !email || !password || !invitationCode) return toast.error("All fields required");
    setSaving(true);
    try {
      const res = await fetch("/api/cores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, invitationCode }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed");
      toast.success("Core created");
      setName(""); setEmail(""); setPassword(""); setInvitationCode("");
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create new Core account</DialogTitle>
        <DialogDescription>Each Core must have a globally unique invitation code. The user will be forced to change their password on first login.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 chars" /></div>
        <div className="space-y-1.5"><Label>Invitation code</Label><Input value={invitationCode} onChange={(e) => setInvitationCode(e.target.value.toUpperCase())} placeholder="e.g. PB-CORE006" /></div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving} className="brock-gradient-gold text-brock-navy">
          {saving ? "Creating..." : "Create Core"} <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
