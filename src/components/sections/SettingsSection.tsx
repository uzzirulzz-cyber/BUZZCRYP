"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, ShieldCheck, Lock, KeyRound, Activity, Database } from "lucide-react";
import { useApp } from "@/lib/store";

export function SettingsSection() {
  const { user } = useApp();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-brock-gold" />
          Platform Settings
        </h1>
        <p className="text-sm text-muted-foreground">System configuration, security policy, and platform information.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="brock-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brock-gold" /> Security Policy</CardTitle>
            <CardDescription>Active rules enforced platform-wide</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Rule ok label="Passwords hashed with bcrypt (12 rounds)" />
            <Rule ok label="JWT access tokens (30 min TTL)" />
            <Rule ok label="JWT refresh tokens (7 days TTL)" />
            <Rule ok label="HTTP-only secure cookies" />
            <Rule ok label="Same-site cookie policy (lax)" />
            <Rule ok label="Force password change on first login" />
            <Rule ok label="Password history (last 5 passwords)" />
            <Rule ok label="Password complexity rules enforced" />
            <Rule ok label="All sensitive actions audit-logged" />
            <Rule ok label="Login history with IP + device tracking" />
            <Rule ok label="Role-based route middleware (RBAC)" />
            <Rule ok label="Database-level tenant isolation (core_id filter)" />
          </CardContent>
        </Card>

        <Card className="brock-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-4 w-4 text-brock-gold" /> Platform Info</CardTitle>
            <CardDescription>Current session and platform metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Info label="Platform name" value="BlockExchange.Buzz" />
            <Info label="Tagline" value="Trade Smarter. Grow Faster." />
            <Info label="Version" value="1.0.0" />
            <Info label="Your role" value={user?.role || "—"} />
            <Info label="Your email" value={user?.email || "—"} />
            <Info label="Account status" value={user?.accountStatus || "—"} />
            <Info label="Default currency" value="USDT" />
            <Info label="Database" value="SQLite (production-ready schema)" />
            <Info label="RBAC enforcement" value="Active on every route" />
            <Info label="Audit log retention" value="Indefinite" />
          </CardContent>
        </Card>
      </div>

      <Card className="brock-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-brock-gold" /> Account Provisioning</CardTitle>
          <CardDescription>How administrator accounts are issued on this platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <div className="font-medium mb-1">Super Admin</div>
            <div className="text-xs text-muted-foreground">
              The root platform account with unrestricted access to every feature, user, customer,
              wallet, transaction, log, and configuration setting. Credentials are issued out-of-band
              and never displayed anywhere in the storefront or admin interface.
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">Core Accounts</div>
            <div className="text-xs text-muted-foreground">
              Sub-tenant accounts that can only manage customers registered with their own unique
              invitation code. Each Core is provisioned by the Super Admin via the User Management
              screen, and credentials are delivered out-of-band.
            </div>
            <div className="text-xs text-amber-400 mt-1">
              ⚠ All accounts provisioned with a temporary password must change it on first login
              before the dashboard becomes available.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="brock-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-brock-gold" /> Tenant Isolation</CardTitle>
          <CardDescription>How data isolation is enforced between Core accounts</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>Every customer query executed by a Core account automatically includes a <code className="px-1 py-0.5 rounded bg-muted/40 text-brock-gold font-mono text-xs">WHERE core_id = currentUser.core_id</code> filter at the database level. This is enforced in the API layer via the <code className="px-1 py-0.5 rounded bg-muted/40 text-brock-gold font-mono text-xs">scopeForCore()</code> helper — Cores literally cannot retrieve records outside their assigned customer base.</p>
          <p>Only the Super Admin bypasses this restriction, and every bypass is captured in the audit log with full IP and device attribution.</p>
          <p>Customer-to-Core assignment is permanent and can only be changed by the Super Admin via the customer detail dialog.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="border-emerald-400/40 text-emerald-400 text-[9px] px-1.5 py-0">ON</Badge>
      <span>{label}</span>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
