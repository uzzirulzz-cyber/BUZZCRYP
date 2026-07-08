"use client";

import { useState } from "react";
import { UserPlus, Mail, Lock, User as UserIcon, Phone, Ticket, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store";
import { toast } from "sonner";

export function RegisterForm() {
  const { setView } = useApp();
  const [invitationCode, setInvitationCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationCode || !name || !email || !password || !confirm) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error("Password must contain uppercase, lowercase, and a digit");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationCode,
          name,
          email,
          mobile: mobile || undefined,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }
      toast.success(`Account created! Your UID is ${data.uid}. Please sign in.`);
      setView("login");
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const checks = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "Contains uppercase", ok: /[A-Z]/.test(password) },
    { label: "Contains lowercase", ok: /[a-z]/.test(password) },
    { label: "Contains a digit", ok: /[0-9]/.test(password) },
    { label: "Passwords match", ok: password.length > 0 && password === confirm },
  ];

  return (
    <div className="min-h-screen flex items-stretch">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-3">
          <BrockLogo />
          <div>
            <div className="text-2xl font-bold tracking-tight">
              <span className="text-white">BROCK</span>
              <span className="brock-text-gold">EX</span>
              <span className="text-brock-blue">CHANGE</span>
            </div>
            <div className="text-xs text-muted-foreground tracking-widest">
              TRADE SMART. INVEST BETTER.
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Open your
            <br />
            <span className="brock-text-gold">trading account.</span>
          </h1>
          <p className="text-muted-foreground max-w-md leading-relaxed">
            Register with your Sub-Agent&apos;s invitation code to create a
            Brock Exchange account. Receive a unique UID, access live markets,
            and start trading in minutes.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {[
              { icon: Ticket, label: "Invitation-code gated" },
              { icon: UserIcon, label: "Unique Brock UID" },
              { icon: Lock, label: "bcrypt + JWT auth" },
              { icon: CheckCircle2, label: "Bank-grade security" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-md brock-card text-sm">
                <Icon className="h-4 w-4 text-brock-gold" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-muted-foreground">
          © 2026 Brock Exchange. All rights reserved.
        </div>
      </div>

      {/* Right register form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 py-8">
          <div className="lg:hidden flex flex-col items-center gap-2 mb-4">
            <BrockLogo />
            <div className="text-xl font-bold tracking-tight">
              <span className="text-white">BROCK</span>
              <span className="brock-text-gold">EX</span>
              <span className="text-brock-blue">CHANGE</span>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-bold">Create account</h2>
            <p className="text-sm text-muted-foreground">
              Enter your details and the invitation code from your Sub-Agent
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Invitation Code *</Label>
              <div className="relative">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="code"
                  placeholder="PB-CORE001"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                  className="pl-10 bg-input/40 border-brock-gold/20 font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-input/40 border-brock-gold/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-input/40 border-brock-gold/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="pl-10 bg-input/40 border-brock-gold/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-input/40 border-brock-gold/20"
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

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm"
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="pl-10 bg-input/40 border-brock-gold/20"
                  required
                />
              </div>
            </div>

            <ul className="space-y-1 text-xs">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  <CheckCircle2
                    className={`h-3.5 w-3.5 ${c.ok ? "text-brock-gold" : "text-muted-foreground/50"}`}
                  />
                  <span className={c.ok ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                </li>
              ))}
            </ul>

            <Button
              type="submit"
              disabled={loading}
              className="w-full brock-gradient-gold text-brock-navy font-semibold hover:opacity-90"
            >
              {loading ? "Creating account..." : "Create account"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setView("login")}
              className="text-brock-gold hover:underline font-medium"
            >
              Sign in
            </button>
          </div>

          <button
            type="button"
            onClick={() => setView("storefront")}
            className="block mx-auto text-xs text-muted-foreground hover:text-foreground underline"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}

function BrockLogo() {
  return (
    <div className="relative w-14 h-14">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="regGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5d27a" />
            <stop offset="100%" stopColor="#d4af37" />
          </linearGradient>
          <linearGradient id="regBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4fa9ff" />
            <stop offset="100%" stopColor="#1e90ff" />
          </linearGradient>
        </defs>
        <polygon
          points="50,5 90,27 90,73 50,95 10,73 10,27"
          fill="none"
          stroke="url(#regGold)"
          strokeWidth="3"
        />
        <text x="32" y="62" fontFamily="Geist, sans-serif" fontSize="38" fontWeight="900" fill="url(#regGold)">B</text>
        <text x="55" y="62" fontFamily="Geist, sans-serif" fontSize="38" fontWeight="900" fill="url(#regBlue)">E</text>
      </svg>
    </div>
  );
}
