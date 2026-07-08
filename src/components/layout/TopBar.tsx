"use client";

import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, LogOut, ShieldCheck, User as UserIcon, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BrockLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims =
    size === "lg" ? "w-14 h-14" : size === "sm" ? "w-7 h-7" : "w-10 h-10";
  return (
    <div className={`relative ${dims}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="goldGradH" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5d27a" />
            <stop offset="100%" stopColor="#d4af37" />
          </linearGradient>
          <linearGradient id="blueGradH" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4fa9ff" />
            <stop offset="100%" stopColor="#1e90ff" />
          </linearGradient>
        </defs>
        <polygon
          points="50,5 90,27 90,73 50,95 10,73 10,27"
          fill="none"
          stroke="url(#goldGradH)"
          strokeWidth="3"
        />
        <text x="32" y="62" fontFamily="Geist, sans-serif" fontSize="38" fontWeight="900" fill="url(#goldGradH)">B</text>
        <text x="55" y="62" fontFamily="Geist, sans-serif" fontSize="38" fontWeight="900" fill="url(#blueGradH)">E</text>
      </svg>
    </div>
  );
}

export function TopBar() {
  const { user, logout } = useApp();
  const [pwOpen, setPwOpen] = useState(false);
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const changePassword = async () => {
    if (!cur || !nw || !confirm) return toast.error("All fields required");
    if (nw !== confirm) return toast.error("New passwords do not match");
    if (nw.length < 8) return toast.error("Password too short");
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: cur, newPassword: nw }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed");
      toast.success("Password changed");
      setPwOpen(false);
      setCur(""); setNw(""); setConfirm("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-brock-gold/15 bg-sidebar/80 backdrop-blur-md">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrockLogo size="sm" />
          <div className="hidden sm:block">
            <div className="text-sm font-bold leading-tight">
              <span className="text-white">BROCK</span>
              <span className="brock-text-gold">EX</span>
              <span className="text-brock-blue">CHANGE</span>
            </div>
            <div className="text-[10px] tracking-widest text-muted-foreground leading-tight">
              TRADE SMART. INVEST BETTER.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              user?.role === "SUPER_ADMIN"
                ? "border-brock-gold/40 text-brock-gold"
                : "border-brock-blue/40 text-brock-blue"
            }
          >
            <ShieldCheck className="h-3 w-3 mr-1" />
            {user?.role === "SUPER_ADMIN" ? "Super Admin" : "Core"}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 px-2 hover:bg-sidebar-accent">
                <Avatar className="h-7 w-7 mr-2">
                  <AvatarFallback className="bg-brock-gold/20 text-brock-gold text-xs">
                    {user?.name?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-sm font-medium">{user?.name}</span>
                  <span className="text-[10px] text-muted-foreground">{user?.email}</span>
                </div>
                <ChevronDown className="h-4 w-4 ml-1 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPwOpen(true)}>
                <KeyRound className="h-4 w-4 mr-2" /> Change password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Profile page coming soon")}>
                <UserIcon className="h-4 w-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Set a new password for your account. Last 5 passwords cannot be reused.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cp">Current password</Label>
              <Input id="cp" type="password" value={cur} onChange={(e) => setCur(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np">New password</Label>
              <Input id="np" type="password" value={nw} onChange={(e) => setNw(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfp">Confirm new password</Label>
              <Input id="cfp" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPwOpen(false)}>Cancel</Button>
            <Button onClick={changePassword} disabled={saving} className="brock-gradient-gold text-brock-navy">
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
