"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Ban,
  CheckCircle2,
  Snowflake,
  Eye,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtMoney, fmtRelative } from "@/lib/format";
import { StatusBadge } from "./DashboardSection";
import { toast } from "sonner";
import { CustomerDetailDialog } from "./CustomerDetailDialog";

type Customer = {
  id: string;
  userId: string;
  coreId: string;
  invitationCode: string;
  walletBalance: number;
  kycStatus: string;
  accountStatus: string;
  registrationTimestamp: string;
  createdAt: string;
  user: { id: string; name: string; email: string; lastLogin: string | null; accountStatus: string };
  core?: { invitationCode: string; user: { name: string; email: string } };
};

export function CustomersSection() {
  const { user } = useApp();
  const isAdmin = user?.role === "SUPER_ADMIN";
  const [items, setItems] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [kyc, setKyc] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    if (status !== "ALL") params.set("status", status);
    if (kyc !== "ALL") params.set("kyc", kyc);
    try {
      const res = await fetch(`/api/customers?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, status, kyc]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const updateCustomerStatus = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountStatus: newStatus }),
    });
    if (!res.ok) {
      const e = await res.json();
      toast.error(e.error || "Failed");
      return;
    }
    toast.success(`Customer ${newStatus.toLowerCase()}`);
    load();
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm("Delete this customer? This is a soft delete (status → DELETED).")) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const e = await res.json();
      toast.error(e.error || "Failed");
      return;
    }
    toast.success("Customer deleted");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-brock-gold" />
            Customers
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "All customers across every Core account on the platform."
              : `Customers registered with your invitation code (${user?.coreId ? "Core" : "—"}).`}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="brock-gradient-gold text-brock-navy">
                <Plus className="h-4 w-4 mr-1" /> New Customer
              </Button>
            </DialogTrigger>
            <CreateCustomerForm
              onCreated={() => {
                setCreateOpen(false);
                load();
              }}
            />
          </Dialog>
        )}
      </div>

      <Card className="brock-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, code..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="pl-8 bg-input/40"
              />
            </div>
            <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v); }}>
              <SelectTrigger className="w-32 bg-input/40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="FROZEN">Frozen</SelectItem>
              </SelectContent>
            </Select>
            <Select value={kyc} onValueChange={(v) => { setPage(1); setKyc(v); }}>
              <SelectTrigger className="w-32 bg-input/40">
                <SelectValue placeholder="KYC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All KYC</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Customer</TableHead>
                  <TableHead>Core</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No customers found
                    </TableCell>
                  </TableRow>
                )}
                {!loading && items.map((c) => (
                  <TableRow key={c.id} className="hover:bg-sidebar-accent/40">
                    <TableCell>
                      <div className="font-medium">{c.user.name}</div>
                      <div className="text-[11px] text-muted-foreground">{c.user.email}</div>
                    </TableCell>
                    <TableCell>
                      {c.core ? (
                        <>
                          <div className="text-xs font-mono">{c.core.invitationCode}</div>
                          <div className="text-[10px] text-muted-foreground">{c.core.user.email}</div>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">{fmtMoney(c.walletBalance)}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.kycStatus} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.accountStatus} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmtRelative(c.registrationTimestamp)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailId(c.id)}>
                            <Eye className="h-4 w-4 mr-2" /> View details
                          </DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => updateCustomerStatus(c.id, "ACTIVE")}>
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Activate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateCustomerStatus(c.id, "SUSPENDED")}>
                                <Ban className="h-4 w-4 mr-2" /> Suspend
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateCustomerStatus(c.id, "FROZEN")}>
                                <Snowflake className="h-4 w-4 mr-2" /> Freeze
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => deleteCustomer(c.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pagination total={total} page={page} pageSize={pageSize} onPage={setPage} />
        </CardContent>
      </Card>

      {detailId && (
        <CustomerDetailDialog
          id={detailId}
          onClose={() => setDetailId(null)}
          onUpdated={load}
        />
      )}
    </div>
  );
}

export function Pagination({
  total,
  page,
  pageSize,
  onPage,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
      <div>
        {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
        >
          Prev
        </Button>
        <span className="px-2">{page} / {pages}</span>
        <Button
          size="sm"
          variant="ghost"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function CreateCustomerForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invitationCode, setInvitationCode] = useState("PB-CORE001");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name || !email || !password || !invitationCode) {
      toast.error("All fields required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, invitationCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success("Customer created");
      setName(""); setEmail(""); setPassword("");
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create new customer</DialogTitle>
        <DialogDescription>
          Customer will be permanently assigned to the selected Core&apos;s invitation code.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Initial password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 chars, upper, lower, digit"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Invitation code (assigns to Core)</Label>
          <Select value={invitationCode} onValueChange={setInvitationCode}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["PB-CORE001", "PB-CORE002", "PB-CORE003", "PB-CORE004", "PB-CORE005"].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving} className="brock-gradient-gold text-brock-navy">
          {saving ? "Creating..." : "Create customer"}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
