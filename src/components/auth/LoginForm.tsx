"use client";

import { useState } from "react";
import { ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff, Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store";
import { toast } from "sonner";
import { BuzzCrypLogo, BuzzCrypWordmark } from "@/components/brand/BuzzCrypLogo";

export function LoginForm() {
  const refreshUser = useApp((s) => s.refreshUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login failed");
        return;
      }
      toast.success("Welcome back to BuzzCryp");
      await refreshUser();
      // Redirect based on role
      const u = useApp.getState().user;
      if (u?.role === "CUSTOMER") useApp.getState().setView("user-dashboard");
      else if (u?.role === "CORE") useApp.getState().setView("agent-panel");
      else useApp.getState().setView("admin");
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          {/* candlestick chart backdrop */}
          <div className="absolute left-8 top-1/3 flex items-end gap-2">
            {[
              { h: 80, up: true },
              { h: 110, up: false },
              { h: 60, up: true },
              { h: 130, up: true },
              { h: 90, up: false },
              { h: 150, up: true },
              { h: 100, up: true },
            ].map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="w-1"
                  style={{
                    height: c.h,
                    background: c.up ? "#1e90ff" : "#d4af37",
                  }}
                />
                <div
                  className="w-3 rounded-sm"
                  style={{
                    height: c.h * 0.6,
                    background: c.up ? "#1e90ff" : "#d4af37",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <BuzzCrypLogo size="lg" />
          <BuzzCrypWordmark size="md" />
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Secure Crypto Trading,
            <br />
            <span className="brock-text-gold">Built for Institutions.</span>
          </h1>
          <p className="text-muted-foreground max-w-md leading-relaxed">
            Multi-tenant isolation, role-based access control, and full audit
            trails. Each Core account manages only the customers registered with
            its own invitation code — Super Admin retains complete platform
            oversight.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {[
              { icon: ShieldCheck, label: "JWT + bcrypt" },
              { icon: Lock, label: "HTTP-only cookies" },
              { icon: Hexagon, label: "Tenant isolation" },
              { icon: ArrowRight, label: "Full audit logs" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-2 rounded-md brock-card text-sm"
              >
                <Icon className="h-4 w-4 text-brock-gold" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-muted-foreground">
          © 2026 BuzzCryp. All rights reserved.
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex flex-col items-center gap-2 mb-4">
            <BuzzCrypLogo size="md" />
            <BuzzCrypWordmark size="sm" />
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-bold">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access the trading platform
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@trade.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-input/40 border-brock-gold/20"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-input/40 border-brock-gold/20"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full brock-gradient-gold text-brock-navy font-semibold hover:opacity-90"
            >
              {loading ? "Signing in..." : "Sign in"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="rounded-lg brock-card p-4 text-xs space-y-2">
            <div className="font-semibold text-brock-gold">Authorized Access Only</div>
            <div className="text-muted-foreground">
              This is a private trading platform. Use the credentials issued to you by the platform
              administrator. Accounts provisioned with a temporary password must change it on first login
              before the dashboard becomes available.
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => useApp.getState().setView("register")}
              className="text-brock-gold hover:underline font-medium"
            >
              Create account
            </button>
          </div>

          <button
            type="button"
            onClick={() => useApp.getState().setView("storefront")}
            className="block mx-auto text-xs text-muted-foreground hover:text-foreground underline"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}

