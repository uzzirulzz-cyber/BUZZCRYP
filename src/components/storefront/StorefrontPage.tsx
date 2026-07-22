"use client";

import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck, ArrowRight, Hexagon, Lock, CandlestickChart, Wallet,
  TrendingUp, TrendingDown, Globe, Zap, Users, DollarSign, CheckCircle2,
  Menu, X, Search, Star, ArrowDownLeft, ArrowUpRight, Clock,
} from "lucide-react";
import { useState, useMemo } from "react";
import { BuzzCrypLogo, BuzzCrypWordmark, BuzzCrypTagline } from "@/components/brand/BuzzCrypLogo";

const CRYPTOS = [
  { symbol: "BTC", name: "Bitcoin", price: 62540.20, change: 2.34, up: true, color: "#f7931a", category: "Major", volume: "1.2B", high: 63120, low: 61200 },
  { symbol: "ETH", name: "Ethereum", price: 3122.80, change: 1.87, up: true, color: "#627eea", category: "Major", volume: "850M", high: 3150, low: 3080 },
  { symbol: "BTG", name: "Bitcoin Gold", price: 38.52, change: -0.42, up: false, color: "#dba000", category: "Altcoin", volume: "45M", high: 39.10, low: 38.20 },
  { symbol: "BTS", name: "BitShares", price: 0.0452, change: 3.12, up: true, color: "#00a9e0", category: "Altcoin", volume: "12M", high: 0.046, low: 0.044 },
  { symbol: "USDT", name: "Tether", price: 1.0001, change: 0.01, up: true, color: "#26a17b", category: "Stablecoin", volume: "2.8B", high: 1.001, low: 0.999 },
  { symbol: "SOL", name: "Solana", price: 148.30, change: 4.56, up: true, color: "#9945ff", category: "Major", volume: "320M", high: 152, low: 144 },
  { symbol: "ADA", name: "Cardano", price: 0.6234, change: -1.23, up: false, color: "#0033ad", category: "Altcoin", volume: "180M", high: 0.635, low: 0.618 },
  { symbol: "XRP", name: "Ripple", price: 0.5891, change: 0.87, up: true, color: "#23292f", category: "Major", volume: "210M", high: 0.595, low: 0.582 },
];

const CATEGORIES = ["All", "Major", "Altcoin", "Stablecoin"];

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
  const [selectedCoin, setSelectedCoin] = useState<typeof CRYPTOS[0] | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [watchlist, setWatchlist] = useState<string[]>(["BTC", "ETH"]);

  const goLogin = () => {
    setView("login");
    setMenuOpen(false);
  };

  const goAdmin = () => {
    setView("admin");
    setMenuOpen(false);
  };

  const goRegister = () => {
    setView("register");
    setMenuOpen(false);
  };

  const toggleWatchlist = (symbol: string) => {
    setWatchlist((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  const filteredCryptos = useMemo(() => {
    return CRYPTOS.filter((c) => {
      const matchesSearch =
        !search ||
        c.symbol.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || c.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  const openCoin = (coin: typeof CRYPTOS[0]) => {
    setSelectedCoin(coin);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Navbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 brock-nav" style={{ height: "75px" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-full flex items-center justify-between">
          <button onClick={() => setView("storefront")} className="flex items-center gap-3">
            <BuzzCrypLogo size="sm" />
            <BuzzCrypWordmark size="md" />
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
      <section className="relative overflow-hidden brock-hero-bg" style={{ padding: "90px 0" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/4 top-20 w-96 h-96 rounded-full blur-3xl" style={{ background: "rgba(0, 208, 255, 0.06)" }} />
          <div className="absolute right-1/4 bottom-20 w-96 h-96 rounded-full blur-3xl" style={{ background: "rgba(91, 91, 245, 0.08)" }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="border-brock-gold/40 text-brock-gold">
                <Hexagon className="h-3 w-3 mr-1" /> Secure Institutional Trading
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight" style={{ fontSize: "60px" }}>
                Trade Smarter.
                <br />
                <span className="brock-text-gold">Grow Faster.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                BuzzCryp is a secure, role-based crypto trading platform with
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
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">
              Supported <span className="brock-text-gold">Markets</span>
            </h2>
            <p className="text-muted-foreground mt-2">
              Trade the world&apos;s top cryptocurrencies. Click any card to view details and start trading.
            </p>
          </div>

          {/* Search + Category filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search coins by name or symbol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md bg-input/40 border border-brock-gold/20 text-sm focus:outline-none focus:border-brock-gold/50"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    category === cat
                      ? "brock-gradient-gold text-brock-navy"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Crypto grid - clickable cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredCryptos.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No coins match your search
              </div>
            )}
            {filteredCryptos.map((c) => (
              <Card
                key={c.symbol}
                onClick={() => openCoin(c)}
                className="brock-card hover:brock-glow-gold transition-all cursor-pointer group"
              >
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
                        <div className="font-semibold text-sm group-hover:text-brock-gold transition-colors">{c.symbol}</div>
                        <div className="text-[10px] text-muted-foreground">{c.name}</div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWatchlist(c.symbol); }}
                      className="opacity-60 hover:opacity-100 transition-opacity"
                      title={watchlist.includes(c.symbol) ? "Remove from watchlist" : "Add to watchlist"}
                    >
                      <Star className={`h-4 w-4 ${watchlist.includes(c.symbol) ? "fill-brock-gold text-brock-gold" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                  <div className="text-lg font-bold">${c.price.toLocaleString()}</div>
                  <div className={`text-xs flex items-center gap-1 ${c.up ? "text-emerald-400" : "text-destructive"}`}>
                    {c.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {c.up ? "+" : ""}{c.change}%
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/40 flex justify-between text-[10px] text-muted-foreground">
                    <span>Vol: ${c.volume}</span>
                    <span className="text-brock-gold">Trade →</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Watchlist section */}
          {watchlist.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-brock-gold fill-brock-gold" /> My Watchlist
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {CRYPTOS.filter((c) => watchlist.includes(c.symbol)).map((c) => (
                  <Card
                    key={`wl-${c.symbol}`}
                    onClick={() => openCoin(c)}
                    className="brock-card hover:brock-glow-gold transition-all cursor-pointer"
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px]"
                          style={{ background: `${c.color}20`, color: c.color }}
                        >
                          {c.symbol.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-semibold text-xs">{c.symbol}</div>
                          <div className="text-[10px] text-muted-foreground">${c.price.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className={`text-xs ${c.up ? "text-emerald-400" : "text-destructive"}`}>
                        {c.up ? "+" : ""}{c.change}%
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────── */}
      <section id="features" className="py-16 border-y border-brock-gold/15 bg-brock-navy/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">
              Why <span className="brock-text-gold">BuzzCryp</span>?
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
              <BuzzCrypLogo size="sm" />
              <BuzzCrypWordmark size="sm" />
            </div>
            <div className="text-xs text-muted-foreground text-center sm:text-right">
              © 2026 BuzzCryp. All rights reserved.
              <br />
              <span className="text-brock-blue">Authorized access only.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── Coin Detail Dialog ─────────────────────────────────── */}
      {selectedCoin && (
        <CoinDetailDialog
          coin={selectedCoin}
          onClose={() => setSelectedCoin(null)}
          onSignIn={() => { setSelectedCoin(null); goLogin(); }}
          onRegister={() => { setSelectedCoin(null); goRegister(); }}
          isAuthenticated={!!user}
        />
      )}
    </div>
  );
}

// ─── Coin Detail Dialog ──────────────────────────────────────────────────────

function CoinDetailDialog({
  coin, onClose, onSignIn, onRegister, isAuthenticated,
}: {
  coin: typeof CRYPTOS[0];
  onClose: () => void;
  onSignIn: () => void;
  onRegister: () => void;
  isAuthenticated: boolean;
}) {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [amount, setAmount] = useState("");

  const price = coin.price;
  const stake = parseFloat(amount || "0");
  const total = stake * price;

  const handleTrade = () => {
    if (!isAuthenticated) {
      onSignIn();
      return;
    }
    // If authenticated, they'd go to the admin/user dashboard trade section
    onSignIn();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
              style={{ background: `${coin.color}20`, color: coin.color }}
            >
              {coin.symbol.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                {coin.symbol}/USDT
                <Badge variant="outline" className={coin.up ? "border-emerald-400/40 text-emerald-400" : "border-destructive/40 text-destructive"}>
                  {coin.up ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {coin.up ? "+" : ""}{coin.change}%
                </Badge>
              </div>
              <DialogDescription>{coin.name}</DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Price + stats grid */}
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-md bg-muted/30 p-2">
              <div className="text-[10px] text-muted-foreground">Price</div>
              <div className="text-sm font-bold brock-text-gold">${price.toLocaleString()}</div>
            </div>
            <div className="rounded-md bg-muted/30 p-2">
              <div className="text-[10px] text-muted-foreground">24h High</div>
              <div className="text-sm font-semibold">${coin.high.toLocaleString()}</div>
            </div>
            <div className="rounded-md bg-muted/30 p-2">
              <div className="text-[10px] text-muted-foreground">24h Low</div>
              <div className="text-sm font-semibold">${coin.low.toLocaleString()}</div>
            </div>
            <div className="rounded-md bg-muted/30 p-2">
              <div className="text-[10px] text-muted-foreground">Volume</div>
              <div className="text-sm font-semibold">${coin.volume}</div>
            </div>
          </div>

          {/* Mini chart */}
          <div className="rounded-md brock-card p-3">
            <div className="text-xs text-muted-foreground mb-2">Price movement (simulated)</div>
            <div className="flex items-end gap-1 h-24">
              {Array.from({ length: 24 }).map((_, i) => {
                const base = 50;
                const variance = Math.sin(i / 3) * 20 + (coin.up ? i : -i) * 1.5;
                const h = Math.max(10, base + variance + Math.random() * 10);
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${h}%`,
                      background: coin.up ? "#1e90ff" : "#d4af37",
                      opacity: 0.3 + (i / 24) * 0.7,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Trade form */}
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSide("BUY")}
                  className={`rounded-lg border p-2 text-sm font-semibold transition-all ${
                    side === "BUY" ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400" : "border-border/40 bg-muted/20"
                  }`}
                >
                  <ArrowDownLeft className="h-4 w-4 inline mr-1" /> BUY
                </button>
                <button
                  onClick={() => setSide("SELL")}
                  className={`rounded-lg border p-2 text-sm font-semibold transition-all ${
                    side === "SELL" ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-border/40 bg-muted/20"
                  }`}
                >
                  <ArrowUpRight className="h-4 w-4 inline mr-1" /> SELL
                </button>
              </div>
              <div className="space-y-1.5">
                <Label>Amount ({coin.symbol})</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.001"
                />
              </div>
              <div className="rounded-md bg-muted/30 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Price</span>
                  <span>${price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Estimated Total</span>
                  <span className="brock-text-gold">${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <Button onClick={handleTrade} className="w-full brock-gradient-gold text-brock-navy font-semibold">
                {side === "BUY" ? "Buy" : "Sell"} {coin.symbol} → Go to Trade
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md bg-brock-gold/5 border border-brock-gold/20 p-3 text-sm text-center">
                <p className="text-muted-foreground mb-1">Sign in to trade {coin.symbol}</p>
                <p className="text-xs">You need an account to place buy/sell orders on BuzzCryp.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={onSignIn} className="brock-gradient-gold text-brock-navy font-semibold">
                  Sign In
                </Button>
                <Button onClick={onRegister} variant="outline" className="border-brock-gold/30">
                  Create Account
                </Button>
              </div>
            </div>
          )}

          {/* Trade duration info */}
          {isAuthenticated && (
            <div className="rounded-md bg-muted/20 p-3 text-xs">
              <div className="font-semibold mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3 text-brock-gold" /> Fixed-Time Trading Options
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-center">
                  <div className="text-brock-gold font-bold">+20%</div>
                  <div className="text-[10px] text-muted-foreground">30 seconds</div>
                </div>
                <div className="text-center">
                  <div className="text-brock-gold font-bold">+30%</div>
                  <div className="text-[10px] text-muted-foreground">60 seconds</div>
                </div>
                <div className="text-center">
                  <div className="text-brock-gold font-bold">+50%</div>
                  <div className="text-[10px] text-muted-foreground">120 seconds</div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Potential returns are illustrative. Trade from the dashboard for full UP/DOWN fixed-time trading.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
