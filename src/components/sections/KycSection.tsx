"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card, CardContent, CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileCheck, MoreHorizontal, CheckCircle2, XCircle, Clock } from "lucide-react";
import { fmtRelative } from "@/lib/format";
import { StatusBadge } from "./DashboardSection";
import { Pagination } from "./CustomersSection";
import { toast } from "sonner";

type KycRow = {
  id: string;
  kycStatus: string;
  user: { name: string; email: string; lastLogin: string | null };
  core?: { invitationCode: string };
  createdAt: string;
};

export function KycSection() {
  const [items, setItems] = useState<KycRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (status !== "ALL") params.set("status", status);
    try {
      const res = await fetch(`/api/kyc?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const setStatusFn = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/kyc/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) return toast.error("Failed");
    toast.success(`KYC ${newStatus.toLowerCase()}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileCheck className="h-6 w-6 text-brock-gold" />
          KYC Verification
        </h1>
        <p className="text-sm text-muted-foreground">Approve or reject customer identity verification requests.</p>
      </div>

      <Card className="brock-card">
        <CardHeader className="pb-3">
          <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v); }}>
            <SelectTrigger className="w-40 bg-input/40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Customer</TableHead>
                  <TableHead>Core</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
                {!loading && items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records</TableCell></TableRow>}
                {!loading && items.map((r) => (
                  <TableRow key={r.id} className="hover:bg-sidebar-accent/40">
                    <TableCell>
                      <div className="font-medium">{r.user.name}</div>
                      <div className="text-[11px] text-muted-foreground">{r.user.email}</div>
                    </TableCell>
                    <TableCell><span className="text-xs font-mono">{r.core?.invitationCode || "—"}</span></TableCell>
                    <TableCell><StatusBadge status={r.kycStatus} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtRelative(r.createdAt)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.user.lastLogin ? fmtRelative(r.user.lastLogin) : "Never"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {r.kycStatus === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/10"
                              onClick={() => setStatusFn(r.id, "VERIFIED")}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                              onClick={() => setStatusFn(r.id, "REJECTED")}
                            >
                              <XCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setStatusFn(r.id, "VERIFIED")} disabled={r.kycStatus === "VERIFIED"}>
                              <CheckCircle2 className="h-4 w-4 mr-2" /> Verify
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFn(r.id, "REJECTED")} disabled={r.kycStatus === "REJECTED"}>
                              <XCircle className="h-4 w-4 mr-2" /> Reject
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFn(r.id, "PENDING")} disabled={r.kycStatus === "PENDING"}>
                              <Clock className="h-4 w-4 mr-2" /> Reset to Pending
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
