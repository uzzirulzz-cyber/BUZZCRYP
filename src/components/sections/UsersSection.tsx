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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserCog, Plus, MoreHorizontal, Ban, CheckCircle2, Snowflake, Trash2, KeyRound, ArrowRight,
} from "lucide-react";
import { fmtRelative } from "@/lib/format";
import { StatusBadge } from "./DashboardSection";
import { Pagination } from "./CustomersSection";
import { toast } from "sonner";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
  accountStatus: string;
  lastLogin: string | null;
  createdAt: string;
};

export function UsersSection() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "50" });
    if (role !== "ALL") params.set("role", role);
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/users?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, role, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const setStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountStatus: status }),
    });
    if (!res.ok) return toast.error("Failed");
    toast.success(`User ${status.toLowerCase()}`);
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
    if (!confirm("Delete this user? (soft delete)")) return;
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
          <p className="text-sm text-muted-foreground">Manage Super Admin and Core accounts. Suspend, freeze, reset passwords, or delete.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="brock-gradient-gold text-brock-navy"><Plus className="h-4 w-4 mr-1" /> New User</Button>
          </DialogTrigger>
          <CreateUserForm onCreated={() => { setCreateOpen(false); load(); }} />
        </Dialog>
      </div>

      <Card className="brock-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              className="bg-input/40 flex-1 min-w-48"
            />
            <Select value={role} onValueChange={(v) => { setPage(1); setRole(v); }}>
              <SelectTrigger className="w-40 bg-input/40"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All roles</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="CORE">Core</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
                {!loading && items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users</TableCell></TableRow>}
                {!loading && items.map((u) => (
                  <TableRow key={u.id} className="hover:bg-sidebar-accent/40">
                    <TableCell className="font-medium">
                      {u.name}
                      {u.mustChangePassword && (
                        <Badge variant="outline" className="ml-2 text-[9px] border-amber-400/40 text-amber-400">PWD RESET</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={u.role === "SUPER_ADMIN" ? "border-brock-gold/40 text-brock-gold" : "border-brock-blue/40 text-brock-blue"}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell><StatusBadge status={u.accountStatus} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.lastLogin ? fmtRelative(u.lastLogin) : "Never"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setStatus(u.id, "ACTIVE")}><CheckCircle2 className="h-4 w-4 mr-2" /> Activate</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatus(u.id, "SUSPENDED")}><Ban className="h-4 w-4 mr-2" /> Suspend</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatus(u.id, "FROZEN")}><Snowflake className="h-4 w-4 mr-2" /> Freeze</DropdownMenuItem>
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
    </div>
  );
}

function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ name, email, password, role, invitationCode: role === "CORE" ? invitationCode : undefined }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed");
      toast.success("User created");
      setName(""); setEmail(""); setPassword(""); setInvitationCode("");
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
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CORE">Core (sub-account)</SelectItem>
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
