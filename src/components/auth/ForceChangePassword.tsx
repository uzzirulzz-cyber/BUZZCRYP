"use client";

import { useState } from "react";
import { KeyRound, ShieldAlert, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store";
import { toast } from "sonner";

export function ForceChangePassword() {
  const { user, refreshUser, logout } = useApp();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirm) {
      toast.error("All fields are required");
      return;
    }
    if (newPassword !== confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast.error("Password must contain uppercase, lowercase, and a digit");
      return;
    }
    if (newPassword.toLowerCase() === "default") {
      toast.error("Password cannot be 'default'");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to change password");
        return;
      }
      toast.success("Password updated. Please sign in again.");
      await logout();
      await refreshUser();
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const checks = [
    { label: "At least 8 characters", ok: newPassword.length >= 8 },
    { label: "Contains uppercase", ok: /[A-Z]/.test(newPassword) },
    { label: "Contains lowercase", ok: /[a-z]/.test(newPassword) },
    { label: "Contains a digit", ok: /[0-9]/.test(newPassword) },
    { label: "Not 'default'", ok: newPassword.length > 0 && newPassword.toLowerCase() !== "default" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-brock-gold/10 border border-brock-gold/30 flex items-center justify-center">
            <ShieldAlert className="h-7 w-7 text-brock-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Set a new password</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Hi <span className="text-foreground font-medium">{user?.name}</span>, your account is
              using a default password. For security, you must set a new one before accessing the platform.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 brock-card rounded-xl p-6">
          <div className="space-y-2">
            <Label htmlFor="cur">Current password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="cur"
                type={show ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pl-10 bg-input/40"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new">New password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="new"
                type={show ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 pr-10 bg-input/40"
                autoComplete="new-password"
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
            <Label htmlFor="conf">Confirm new password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="conf"
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="pl-10 bg-input/40"
                autoComplete="new-password"
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
                <span className={c.ok ? "text-foreground" : "text-muted-foreground"}>
                  {c.label}
                </span>
              </li>
            ))}
          </ul>

          <Button
            type="submit"
            disabled={loading}
            className="w-full brock-gradient-gold text-brock-navy font-semibold hover:opacity-90"
          >
            {loading ? "Updating..." : "Update password"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        <button
          type="button"
          onClick={() => logout()}
          className="block mx-auto text-xs text-muted-foreground hover:text-foreground underline"
        >
          Sign out instead
        </button>
      </div>
    </div>
  );
}
