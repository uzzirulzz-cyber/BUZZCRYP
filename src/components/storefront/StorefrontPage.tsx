"use client";

import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  ArrowRight,
  Hexagon,
  Lock,
  CandlestickChart,
  Wallet,
  TrendingUp,
  Globe,
  Zap,
  Users,
  DollarSign,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const CRYPTOS = [
  { symbol: "BTC", name: "Bitcoin", price: "62,540.20", change: "+2.34%", up: true, color: "#f7931a" },
  { symbol: "ETH", name: "Ethereum", price: "3,122.80", change: "+1.87%", up: true, color: "#627eea" },
  { symbol: "BTG", name: "Bitcoin Gold", price: "38.52", change: "-0.42%", up: false, color: "#dba000" },
  { symbol: "BTS", name: "BitShares", price: "0.0452", change: "+3.12%", up: true, color: "#00a9e0" },
  { symbol: "USDT", name: "Tether", price: "1.0001", change: "+0.01%", up: true, color: "#26a17b" },
  { symbol: "SOL", name: "Solana", price: "148.30", change: "+4.56%", up: true, color: "#9945ff" },
  { symbol: "ADA", name: "Cardano", price: "0.6234", change: "-1.23%", up: false, color: "#0033ad" },
  { symbol: "XRP", name: "Ripple", price: "0.5891", change: "+0.87%", up: true, color: "#23292f" },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Bank-Grade Security",
    desc: "JWT authentication, bcrypt hashing, HTTP-only cookies, and full audit trails on every action.",
  },
  {
    icon: Lock,
    title: "Tenant Isolation",
    desc: "Each Sub-Agent only sees customers registered with their own invitation code. Enforced at the database level.",
  },
  {
    icon: CandlestickChart,
    title: "Advanced Trading",
    desc: "Trade BTC, ETH, BTG, BTS and more with real-time order execution and complete trade history.",
  },
  {
    icon: Wallet,
    title: "Integrated Wallet",
    desc: "Deposit, withdraw, and manage balances with automated approval workflows and wallet adjustments.",
  },
  {
    icon: Zap,
    title: "Instant Settlement",
    desc: "Approved deposits credit instantly. Withdrawals process through a secure admin approval pipeline.",
  },
  {
    icon: Globe,
    title: "Global Access",
    desc: "Multi-tenant architecture built for scale, serving Sub-Agents and customers worldwide.",
  },
];

const STATS = [
  { label: "Active Traders", value: "50K+", icon: Users },
  { label: "Total Volume", value: "$2.8B", icon: DollarSign },
  { label: "Crypto Pairs", value: "120+", icon: CandlestickChart },
  { label: "Uptime", value: "99.9%", icon: TrendingUp },
];

export function StorefrontPage() {
  const { setView, user } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  const goLogin = () => {
    setView("login");
    setMenuOpen(false);
  };

  const goAdmin = () => {
    setView("admin");
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Navbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-brock-gold/15 bg-brock-navy/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => setView("storefront")} className="flex items-center gap-3">
            <BrockLogo size="sm" />
            <div>
              <div className="text-lg font-bold leading-tight">
                <span className="text-white">BROCK</span>
                <span className="brock-text-gold">EX</span>
                <span className="text-brock-blue">CHANGE</span>
              </div>
              <div className="text-[9px] tracking-widest text-muted-foreground leading-tight">
                TRADE SMART. INVEST BETTER.
              </div>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#markets" className="text-muted-foreground hover:text-foreground transition-colors">Markets</a>
            <a href="#security" className="text-muted-foreground hover:text-foreground transition-colors">Security</a>
            <a href="#stats" className="text-muted-foreground hover:text-foreground transition-colors">Stats</a>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Button onClick={goAdmin} size="sm" className="brock-gradient-gold text-brock-navy font-semibold">
                Dashboard <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={goLogin} size="sm" className="brock-gradient-gold text-brock-navy font-semibold hidden sm:flex">
                Sign In <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-brock-gold/15 bg-brock-navy/95 backdrop-blur-md">
            <div className="px-4 py-3 space-y-2">
              <a href="#features" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-muted-foreground">Features</a>
              <a href="#markets" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-muted-foreground">Markets</a>
              <a href="#security" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-muted-foreground">Security</a>
              <a href="#stats" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-muted-foreground">Stats</a>
              {!user && (
                <Button onClick={goLogin} className="w-full brock-gradient-gold text-brock-navy font-semibold">
                  Sign In <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/4 top-20 w-96 h-96 bg-brock-gold/5 rounded-full blur-3xl" />
          <div className="absolute right-1/4 bottom-20 w-96 h-96 bg-brock-blue/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="border-brock-gold/40 text-brock-gold">
                <Hexagon className="h-3 w-3 mr-1" /> Secure Institutional Trading
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Trade Smart.
                <br />
                <span className="brock-text-gold">Invest Better.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Brock Exchange is a secure, role-based crypto trading platform with
                multi-tenant isolation, full audit trails, and bank-grade security.
                Built for institutions that demand control and transparency.
              </p>
              <div className="flex flex-wrap gap-3">
                {user ? (
                  <Button onClick={goAdmin} size="lg" className="brock-gradient-gold text-brock-navy font-semibold">
                    Open Dashboard <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={goLogin} size="lg" className="brock-gradient-gold text-brock-navy font-semibold">
                    Sign In to Platform <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                )}
                <a href="#markets">
                  <Button size="lg" variant="outline" className="border-brock-gold/30">
                    <CandlestickChart className="h-5 w-5 mr-2" /> View Markets
                  </Button>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brock-gold" /> JWT + bcrypt
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brock-gold" /> Tenant isolation
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brock-gold" /> Full audit logs
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brock-gold" /> RBAC enforced
                </div>
              </div>
            </div>

            {/* Hero chart card */}
            <div className="relative">
              <Card className="brock-card p-6 brock-glow-gold">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">BTC/USDT</div>
                    <div className="text-2xl font-bold brock-text-gold">$62,540.20</div>
                  </div>
                  <Badge variant="outline" className="border-emerald-400/40 text-emerald-400">
                    <TrendingUp className="h-3 w-3 mr-1" /> +2.34%
                  </Badge>
                </div>
                {/* Mini candlestick chart */}
                <div className="flex items-end gap-1.5 h-40 mb-4">
                  {[
                    { h: 60, up: true }, { h: 80, up: false }, { h: 50, up: true },
                    { h: 90, up: true }, { h: 70, up: false }, { h: 110, up: true },
                    { h: 85, up: true }, { h: 95, up: false }, { h: 120, up: true },
                    { h: 75, up: false }, { h: 100, up: true }, { h: 130, up: true },
                  ].map((c, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div
                        className="w-0.5"
                        style={{ height: c.h, background: c.up ? "#1e90ff" : "#d4af37" }}
                      />
                      <div
                        className="w-full rounded-sm"
                        style={{
                          height: c.h * 0.6,
                          background: c.up ? "#1e90ff" : "#d4af37",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-md bg-muted/30 p-2">
                    <div className="text-muted-foreground">24h High</div>
                    <div className="font-semibold">$63,120</div>
                  </div>
                  <div className="rounded-md bg-muted/30 p-2">
                    <div className="text-muted-foreground">24h Low</div>
                    <div className="font-semibold">$61,200</div>
                  </div>
                  <div className="rounded-md bg-muted/30 p-2">
                    <div className="text-muted-foreground">Volume</div>
                    <div className="font-semibold">$1.2B</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ──────────────────────────────────────────────── */}
      <section id="stats" className="border-y border-brock-gold/15 bg-brock-navy/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <Icon className="h-8 w-8 mx-auto text-brock-gold mb-2" />
                <div className="text-3xl font-bold brock-text-gold">{value}</div>
                <div className="text-sm text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Markets ────────────────────────────────────────────── */}
      <section id="markets" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">
              Supported <span className="brock-text-gold">Markets</span>
            </h2>
            <p className="text-muted-foreground mt-2">
              Trade the world&apos;s top cryptocurrencies with deep liquidity and tight spreads.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {CRYPTOS.map((c) => (
              <Card key={c.symbol} className="brock-card hover:brock-glow-gold transition-all cursor-default">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                        style={{ background: `${c.color}20`, color: c.color }}
                      >
                        {c.symbol.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{c.symbol}</div>
                        <div className="text-[10px] text-muted-foreground">{c.name}</div>
                      </div>
                    </div>
                    {c.up ? (
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-destructive rotate-180" />
                    )}
                  </div>
                  <div className="text-lg font-bold">${c.price}</div>
                  <div className={`text-xs ${c.up ? "text-emerald-400" : "text-destructive"}`}>
                    {c.change}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────── */}
      <section id="features" className="py-16 border-y border-brock-gold/15 bg-brock-navy/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">
              Why <span className="brock-text-gold">Brock Exchange</span>?
            </h2>
            <p className="text-muted-foreground mt-2">
              A trading platform engineered for security, compliance, and institutional control.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="brock-card hover:border-brock-gold/30 transition-colors">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-brock-gold/10 border border-brock-gold/30 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-brock-gold" />
                  </div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Security ───────────────────────────────────────────── */}
      <section id="security" className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Card className="brock-card brock-glow-blue">
            <CardContent className="p-8 sm:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-brock-blue/10 border border-brock-blue/30 flex items-center justify-center">
                    <ShieldCheck className="h-7 w-7 text-brock-blue" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold">
                    Security is not optional.
                    <br />
                    <span className="brock-text-gold">It&apos;s the foundation.</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Every password is hashed with bcrypt (12 rounds). Every session uses
                    JWT access and refresh tokens stored in HTTP-only cookies. Every
                    sensitive action is written to an immutable audit log with IP and
                    device attribution.
                  </p>
                  <ul className="space-y-2 text-sm">
                    {[
                      "Role-based access control (RBAC) on every route",
                      "Database-level tenant isolation per Sub-Agent",
                      "Forced password change on first login",
                      "Password history prevents reuse of last 5",
                      "Login history with IP + device tracking",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-brock-gold shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-brock-gold/5 to-brock-blue/5 rounded-2xl blur-2xl" />
                  <Card className="brock-card relative p-6 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Lock className="h-4 w-4 text-brock-gold" />
                      <span className="font-mono">bcrypt(12 rounds)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <ShieldCheck className="h-4 w-4 text-brock-gold" />
                      <span className="font-mono">JWT + HTTP-only cookies</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Hexagon className="h-4 w-4 text-brock-gold" />
                      <span className="font-mono">core_id WHERE filter</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-brock-gold" />
                      <span className="font-mono">audit_log on every action</span>
                    </div>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────── */}
      <section className="py-16 border-t border-brock-gold/15 bg-brock-navy/40">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to <span className="brock-text-gold">trade smart</span>?
          </h2>
          <p className="text-muted-foreground text-lg">
            Sign in with the credentials issued by your platform administrator to access
            the trading dashboard.
          </p>
          {user ? (
            <Button onClick={goAdmin} size="lg" className="brock-gradient-gold text-brock-navy font-semibold">
              Open Dashboard <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          ) : (
            <Button onClick={goLogin} size="lg" className="brock-gradient-gold text-brock-navy font-semibold">
              Sign In to Platform <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          )}
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-brock-gold/15 bg-brock-navy/60 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrockLogo size="sm" />
              <div>
                <div className="text-sm font-bold">
                  <span className="text-white">BROCK</span>
                  <span className="brock-text-gold">EX</span>
                  <span className="text-brock-blue">CHANGE</span>
                </div>
                <div className="text-[10px] tracking-widest text-muted-foreground">
                  TRADE SMART. INVEST BETTER.
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-center sm:text-right">
              © 2026 Brock Exchange. All rights reserved.
              <br />
              <span className="text-brock-blue">Authorized access only.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BrockLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "w-14 h-14" : size === "sm" ? "w-8 h-8" : "w-10 h-10";
  return (
    <div className={`relative ${dims}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="storefrontGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5d27a" />
            <stop offset="100%" stopColor="#d4af37" />
          </linearGradient>
          <linearGradient id="storefrontBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4fa9ff" />
            <stop offset="100%" stopColor="#1e90ff" />
          </linearGradient>
        </defs>
        <polygon
          points="50,5 90,27 90,73 50,95 10,73 10,27"
          fill="none"
          stroke="url(#storefrontGold)"
          strokeWidth="3"
        />
        <text x="32" y="62" fontFamily="Geist, sans-serif" fontSize="38" fontWeight="900" fill="url(#storefrontGold)">B</text>
        <text x="55" y="62" fontFamily="Geist, sans-serif" fontSize="38" fontWeight="900" fill="url(#storefrontBlue)">E</text>
      </svg>
    </div>
  );
}
