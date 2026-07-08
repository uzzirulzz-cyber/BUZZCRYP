"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card, CardContent, CardHeader,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { History, CheckCircle2, XCircle } from "lucide-react";
import { fmtDate } from "@/lib/format";
import { Pagination } from "./CustomersSection";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/store";

type Login = {
  id: string;
  userId: string;
  ip: string | null;
  device: string | null;
  success: boolean;
  timestamp: string;
  user: { name: string; email: string; role: string };
};

export function LoginHistorySection() {
  const { user } = useApp();
  const [items, setItems] = useState<Login[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/login-history?page=${page}&pageSize=30`, { cache: "no-store" });
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
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6 text-brock-gold" />
          Login History
        </h1>
        <p className="text-sm text-muted-foreground">
          {user?.role === "SUPER_ADMIN" ? "All login attempts across the platform." : "Your recent login attempts."}
        </p>
      </div>

      <Card className="brock-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>When</TableHead>
                  {user?.role === "SUPER_ADMIN" && <TableHead>User</TableHead>}
                  <TableHead>Result</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
                {!loading && items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No login history</TableCell></TableRow>}
                {!loading && items.map((l) => (
                  <TableRow key={l.id} className="hover:bg-sidebar-accent/40">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(l.timestamp)}</TableCell>
                    {user?.role === "SUPER_ADMIN" && (
                      <TableCell>
                        <div className="text-xs font-medium">{l.user?.email}</div>
                        <div className="text-[10px] text-muted-foreground">{l.user?.role}</div>
                      </TableCell>
                    )}
                    <TableCell>
                      {l.success ? (
                        <Badge variant="outline" className="border-emerald-400/40 text-emerald-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Success
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-destructive/40 text-destructive">
                          <XCircle className="h-3 w-3 mr-1" /> Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{l.ip || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-md truncate" title={l.device || ""}>{l.device || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Pagination total={total} page={page} pageSize={30} onPage={setPage} />
    </div>
  );
}
