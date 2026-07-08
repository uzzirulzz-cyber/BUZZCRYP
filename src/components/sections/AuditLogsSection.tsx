"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card, CardContent, CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollText, Search } from "lucide-react";
import { fmtDate } from "@/lib/format";
import { Pagination } from "./CustomersSection";
import { Badge } from "@/components/ui/badge";

type Log = {
  id: string;
  userId: string | null;
  action: string;
  ip: string | null;
  device: string | null;
  detail: string | null;
  timestamp: string;
  user: { name: string; email: string; role: string } | null;
};

export function AuditLogsSection() {
  const [items, setItems] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "50" });
    if (action) params.set("action", action);
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/audit-logs?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, action, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-brock-gold" />
          Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground">Every sensitive platform action is logged here for compliance and forensics.</p>
      </div>

      <Card className="brock-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search detail..."
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                className="pl-8 bg-input/40"
              />
            </div>
            <Select value={action || "ALL"} onValueChange={(v) => { setPage(1); setAction(v === "ALL" ? "" : v); }}>
              <SelectTrigger className="w-44 bg-input/40"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All actions</SelectItem>
                {["LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT", "PASSWORD_CHANGE", "CUSTOMER_REGISTERED", "CUSTOMER_CREATED", "CUSTOMER_UPDATED", "CUSTOMER_DELETED", "CORE_CREATED", "CORE_UPDATED", "CORE_DELETED", "USER_CREATED", "USER_UPDATED", "USER_DELETED", "DEPOSIT_CREATED", "DEPOSIT_UPDATED", "DEPOSIT_DELETED", "WITHDRAWAL_CREATED", "WITHDRAWAL_UPDATED", "WITHDRAWAL_DELETED", "TRADE_CREATED", "TRADE_DELETED", "WALLET_ADJUSTMENT", "KYC_UPDATE"].map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
                {!loading && items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No logs</TableCell></TableRow>}
                {!loading && items.map((l) => (
                  <TableRow key={l.id} className="hover:bg-sidebar-accent/40">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(l.timestamp)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px] border-brock-gold/30 text-brock-gold">{l.action}</Badge>
                    </TableCell>
                    <TableCell>
                      {l.user ? (
                        <>
                          <div className="text-xs font-medium">{l.user.email}</div>
                          <div className="text-[10px] text-muted-foreground">{l.user.role}</div>
                        </>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-xs max-w-md truncate" title={l.detail || ""}>{l.detail || "—"}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{l.ip || "—"}</TableCell>
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
