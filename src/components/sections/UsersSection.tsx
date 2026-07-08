"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserCog, Plus, MoreHorizontal, Ban, CheckCircle2, Snowflake, Trash2, KeyRound,
  ArrowRight, Search, Eye, Pencil, Wallet, ArrowDownLeft, ArrowUpRight, Copy, Check,
} from "lucide-react";
import { fmtMoney, fmtRelative, fmtDate } from "@/lib/format";
import { StatusBadge } from "./DashboardSection";
import { Pagination } from "./CustomersSection";
import { toast } from "sonner";

type UserRow = {
  id: string;
  uid: string;
  name: string;
  email: string;
  mobile?: string | null;
  role: string;
  mustChangePassword: boolean;
  accountStatus: string;
  lastLogin: string | null;
  createdAt: string;
  customer?: {
    walletBalance: number;
    frozenBalance: number;
    kycStatus: string;
    invitationCode: string;
    core: { invitationCode: string; user: { name: string; email: string } };
  } | null;
  core?: {
    invitationCode: string;
    referralCode: string;
    active: boolean;
    commissionEarned: number;
    _count: { customers: number };
  } | null;
};

export function UsersSection() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [viewUser, setViewUser] = useState<UserRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "50" });
    if (role !== "ALL") params.set("role", role);
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/users?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      let filtered = data.items || [];
      if (status !== "ALL") filtered = filtered.filter((u: UserRow) => u.accountStatus === status);
      setItems(filtered);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, role, search, status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const setStatusFn = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountStatus: newStatus }),
    });
    if (!res.ok) {
      const e = await res.json();
      return toast.error(e.error || "Failed");
    }
    toast.success(`User ${newStatus.toLowerCase()}`);
    load();
  };

  const resetPassword = async (id: string) => {
    const newPw = prompt("Enter new temporary password (min 8 chars, must contain upper, lower, digit):");
    if (!newPw) return;
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetPassword: newPw }),
    });
    if (!res.ok) {
      const e = await res.json();
      return toast.error(e.error || "Failed");
    }
    toast.success("Password reset — user must change on next login");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this user? (soft delete — status becomes DELETED)")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const e = await res.json();
      return toast.error(e.error || "Failed");
    }
    toast.success("User deleted");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="h-6 w-6 text-brock-gold" />
            User Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Search by UID, email, name, or mobile. Edit profiles, manage status, reset passwords, freeze funds.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="brock-gradient-gold text-brock-navy"><Plus className="h-4 w-4 mr-1" /> New User</Button>
          </DialogTrigger>
          <CreateUserForm onCreated={() => { setCreateOpen(false); load(); }} />
        </Dialog>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="Total Users" value={String(total)} />
        <MiniStat label="Super Admins" value={String(items.filter((u) => u.role === "SUPER_ADMIN").length)} />
        <MiniStat label="Sub-Agents" value={String(items.filter((u) => u.role === "CORE").length)} />
        <MiniStat label="Customers" value={String(items.filter((u) => u.role === "CUSTOMER").length)} />
      </div>

      <Card className="brock-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by UID, name, email, or mobile..."
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                className="pl-8 bg-input/40"
              />
            </div>
            <Select value={role} onValueChange={(v) => { setPage(1); setRole(v); }}>
              <SelectTrigger className="w-40 bg-input/40"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All roles</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="CORE">Sub-Agent</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v); }}>
              <SelectTrigger className="w-36 bg-input/40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="FROZEN">Frozen</SelectItem>
                <SelectItem value="DELETED">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>UID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Wallet / Status</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
                {!loading && items.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>}
                {!loading && items.map((u) => (
                  <TableRow key={u.id} className="hover:bg-sidebar-accent/40">
                    <TableCell className="font-mono text-xs text-brock-gold">{u.uid}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        {u.name}
                        {u.mustChangePassword && (
                          <Badge variant="outline" className="text-[9px] border-amber-400/40 text-amber-400">PWD</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{u.email}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.mobile || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        u.role === "SUPER_ADMIN" ? "border-brock-gold/40 text-brock-gold" :
                        u.role === "CORE" ? "border-brock-blue/40 text-brock-blue" :
                        "border-purple-400/40 text-purple-400"
                      }>{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {u.role === "CUSTOMER" && u.customer ? (
                        <div>
                          <div className="text-xs font-semibold brock-text-gold">{fmtMoney(u.customer.walletBalance)}</div>
                          <StatusBadge status={u.accountStatus} />
                        </div>
                      ) : u.role === "CORE" && u.core ? (
                        <div>
                          <div className="text-xs font-mono text-brock-blue">{u.core.invitationCode}</div>
                          <StatusBadge status={u.accountStatus} />
                        </div>
                      ) : (
                        <StatusBadge status={u.accountStatus} />
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.lastLogin ? fmtRelative(u.lastLogin) : "Never"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setViewUser(u)}>
                            <Eye className="h-4 w-4 mr-2" /> View profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditUser(u)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit user
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setStatusFn(u.id, "ACTIVE")} disabled={u.accountStatus === "ACTIVE"}>
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Activate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFn(u.id, "SUSPENDED")} disabled={u.accountStatus === "SUSPENDED"}>
                            <Ban className="h-4 w-4 mr-2" /> Suspend
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFn(u.id, "FROZEN")} disabled={u.accountStatus === "FROZEN"}>
                            <Snowflake className="h-4 w-4 mr-2" /> Freeze
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => resetPassword(u.id)}>
                            <KeyRound className="h-4 w-4 mr-2" /> Reset password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => remove(u.id)} className="text-destructive focus:text-destructive">
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

      {editUser && (
        <EditUserDialog user={editUser} onClose={() => setEditUser(null)} onUpdated={load} />
      )}
      {viewUser && (
        <ViewUserDialog user={viewUser} onClose={() => setViewUser(null)} onUpdated={load} />
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="brock-card">
      <CardContent className="p-3">
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className="text-xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

// ─── Edit User Dialog ────────────────────────────────────────────────────────

function EditUserDialog({ user, onClose, onUpdated }: {
  user: UserRow; onClose: () => void; onUpdated: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [mobile, setMobile] = useState(user.mobile || "");
  const [accountStatus, setAccountStatus] = useState(user.accountStatus);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name || !email) return toast.error("Name and email are required");
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, mobile, accountStatus }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed");
      toast.success("User updated");
      onUpdated();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-brock-gold" /> Edit User
          </DialogTitle>
          <DialogDescription>
            UID: <span className="font-mono text-brock-gold">{user.uid}</span> · Role: {user.role}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Mobile Number</Label>
            <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+92 300 1234567" />
          </div>
          <div className="space-y-1.5">
            <Label>Account Status</Label>
            <Select value={accountStatus} onValueChange={setAccountStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="FROZEN">Frozen</SelectItem>
                <SelectItem value="DELETED">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="brock-gradient-gold text-brock-navy">
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── View User Profile Dialog ────────────────────────────────────────────────

function ViewUserDialog({ user, onClose, onUpdated }: {
  user: UserRow; onClose: () => void; onUpdated: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(null), 2000);
  };

  const doAdjust = async () => {
    const amt = parseFloat(adjustAmount);
    if (!amt || !adjustReason) return toast.error("Amount and reason required");
    const res = await fetch("/api/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: user.customer?.core?.invitationCode ? user.id : user.id, amount: amt, reason: adjustReason }),
    });
    if (!res.ok) {
      const e = await res.json();
      return toast.error(e.error || "Failed");
    }
    toast.success("Wallet adjusted");
    setAdjustOpen(false);
    setAdjustAmount(""); setAdjustReason("");
    onUpdated();
  };

  // For wallet adjustments on customers, we need the customer ID, not user ID
  // The /api/wallets endpoint expects a customerId
  const isCustomer = user.role === "CUSTOMER" && user.customer;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-brock-gold" /> User Profile
            <StatusBadge status={user.accountStatus} />
          </DialogTitle>
          <DialogDescription>
            <button
              onClick={() => copy(user.uid, "UID")}
              className="inline-flex items-center gap-1 font-mono text-brock-gold hover:underline"
            >
              {user.uid}
              {copied === user.uid ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Profile grid */}
          <div className="grid grid-cols-2 gap-3">
            <ProfileRow label="Name" value={user.name} />
            <ProfileRow label="Email" value={user.email} />
            <ProfileRow label="Mobile" value={user.mobile || "—"} />
            <ProfileRow label="Role" value={
              <Badge variant="outline" className={
                user.role === "SUPER_ADMIN" ? "border-brock-gold/40 text-brock-gold" :
                user.role === "CORE" ? "border-brock-blue/40 text-brock-blue" :
                "border-purple-400/40 text-purple-400"
              }>{user.role}</Badge>
            } />
            <ProfileRow label="Last Login" value={user.lastLogin ? fmtDate(user.lastLogin) : "Never"} />
            <ProfileRow label="Member Since" value={fmtDate(user.createdAt)} />
          </div>

          {/* Customer-specific info */}
          {isCustomer && user.customer && (
            <Card className="brock-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-brock-gold" /> Wallet & Trading
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-md bg-muted/30 p-2">
                    <div className="text-[10px] text-muted-foreground">Available Balance</div>
                    <div className="font-bold brock-text-gold">{fmtMoney(user.customer.walletBalance)}</div>
                  </div>
                  <div className="rounded-md bg-muted/30 p-2">
                    <div className="text-[10px] text-muted-foreground">Frozen Balance</div>
                    <div className="font-bold text-brock-blue">{fmtMoney(user.customer.frozenBalance)}</div>
                  </div>
                  <div className="rounded-md bg-muted/30 p-2">
                    <div className="text-[10px] text-muted-foreground">KYC Status</div>
                    <StatusBadge status={user.customer.kycStatus} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm pt-2">
                  <span className="text-muted-foreground">Invitation Code:</span>
                  <span className="font-mono text-brock-gold">{user.customer.invitationCode}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sub-Agent:</span>
                  <span className="text-xs">{user.customer.core?.user?.email}</span>
                </div>

                {/* Wallet adjustment */}
                <div className="pt-2 border-t border-border/40">
                  {!adjustOpen ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setAdjustOpen(true)}>
                        <ArrowDownLeft className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Add Balance
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => { setAdjustOpen(true); setAdjustAmount("-"); }}>
                        <ArrowUpRight className="h-3.5 w-3.5 mr-1 text-destructive" /> Deduct Balance
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 rounded-md bg-muted/20 p-2">
                      <div className="text-xs font-semibold">Wallet Adjustment</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="number" step="0.01" placeholder="Amount (signed)" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} />
                        <Input placeholder="Reason" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => { setAdjustOpen(false); setAdjustAmount(""); setAdjustReason(""); }}>Cancel</Button>
                        <Button size="sm" onClick={doAdjust} className="brock-gradient-gold text-brock-navy">Apply</Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sub-Agent-specific info */}
          {user.role === "CORE" && user.core && (
            <Card className="brock-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-brock-blue" /> Sub-Agent Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-muted/30 p-2">
                    <div className="text-[10px] text-muted-foreground">Invitation Code</div>
                    <div className="font-mono font-bold text-brock-gold">{user.core.invitationCode}</div>
                  </div>
                  <div className="rounded-md bg-muted/30 p-2">
                    <div className="text-[10px] text-muted-foreground">Referral Code</div>
                    <div className="font-mono font-bold text-brock-blue">{user.core.referralCode}</div>
                  </div>
                  <div className="rounded-md bg-muted/30 p-2">
                    <div className="text-[10px] text-muted-foreground">Invited Users</div>
                    <div className="font-bold">{user.core._count.customers}</div>
                  </div>
                  <div className="rounded-md bg-muted/30 p-2">
                    <div className="text-[10px] text-muted-foreground">Commission Earned</div>
                    <div className="font-bold brock-text-gold">{fmtMoney(user.core.commissionEarned)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProfileRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md bg-muted/20 p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

// ─── Create User Form ────────────────────────────────────────────────────────

function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CORE");
  const [invitationCode, setInvitationCode] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name || !email || !password || !role) return toast.error("All fields required");
    if (role === "CORE" && !invitationCode) return toast.error("CORE role needs an invitation code");
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, password, role,
          mobile: mobile || undefined,
          invitationCode: role === "CORE" ? invitationCode : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed");
      toast.success("User created");
      setName(""); setEmail(""); setMobile(""); setPassword(""); setInvitationCode("");
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create new user</DialogTitle>
        <DialogDescription>New users must change their password on first login.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Mobile (optional)</Label><Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+92 300 1234567" /></div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CORE">Sub-Agent (Core)</SelectItem>
              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 chars" /></div>
        {role === "CORE" && (
          <div className="space-y-1.5">
            <Label>Invitation code (globally unique)</Label>
            <Input value={invitationCode} onChange={(e) => setInvitationCode(e.target.value.toUpperCase())} placeholder="e.g. PB-CORE007" />
          </div>
        )}
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving} className="brock-gradient-gold text-brock-navy">
          {saving ? "Creating..." : "Create user"} <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
