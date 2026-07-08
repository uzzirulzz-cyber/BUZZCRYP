"use client";

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Copy, Check, Link as LinkIcon, Users } from "lucide-react";
import { useApp } from "@/lib/store";
import { toast } from "sonner";

type Core = {
  id: string;
  invitationCode: string;
  active: boolean;
  user: { name: string; email: string; accountStatus: string };
  _count?: { customers: number };
};

export function InvitationCodesSection() {
  const { user } = useApp();
  const isAdmin = user?.role === "SUPER_ADMIN";
  const [items, setItems] = useState<Core[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/invitation-codes", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast.success(`Copied ${code}`);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/?register=${code}`;
    navigator.clipboard.writeText(link);
    setCopied(`link-${code}`);
    toast.success("Invitation link copied");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Ticket className="h-6 w-6 text-brock-gold" />
          Invitation Codes
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "All invitation codes assigned to Core accounts. Each code is globally unique and can only be used by its owner."
            : "Your unique invitation code. Share it with customers so they can register under your account."}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="brock-card h-44 animate-pulse" />
        ))}
        {!loading && items.map((c) => (
          <Card key={c.id} className="brock-card relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-brock-gold" />
                  {c.user.name}
                </CardTitle>
                {c.active ? (
                  <Badge variant="outline" className="border-emerald-400/40 text-emerald-400">Active</Badge>
                ) : (
                  <Badge variant="outline" className="border-destructive/40 text-destructive">Inactive</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{c.user.email}</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Invitation Code</div>
                <div className="font-mono text-2xl font-bold brock-text-gold">{c.invitationCode}</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {c._count?.customers ?? 0} customers registered
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => copyCode(c.invitationCode)}>
                  {copied === c.invitationCode ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  Copy code
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => copyLink(c.invitationCode)}>
                  {copied === `link-${c.invitationCode}` ? <Check className="h-3.5 w-3.5 mr-1" /> : <LinkIcon className="h-3.5 w-3.5 mr-1" />}
                  Copy link
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
