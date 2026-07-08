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
import { BlockExchangeLogo, BlockExchangeWordmark } from "@/components/brand/BlockExchangeLogo";

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
    <header className="sticky top-0 z-30 brock-nav" style={{ height: "75px" }}>
      <div className="px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BlockExchangeLogo size="sm" />
          <div className="hidden sm:block">
            <BlockExchangeWordmark size="sm" />
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
