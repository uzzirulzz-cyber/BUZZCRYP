import { NextRequest, NextResponse } from "next/server";
import { SessionUser } from "@/lib/auth";

// Standard JSON error wrapper
export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Map auth errors to HTTP responses
export function handleAuthError(e: unknown) {
  const msg = e instanceof Error ? e.message : "Internal error";
  if (msg === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
  if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
  return jsonError(msg, 500);
}

// Read query params safely
export function qp(req: NextRequest, key: string, fallback?: string) {
  const v = req.nextUrl.searchParams.get(key);
  return v ?? fallback;
}

export function qpInt(req: NextRequest, key: string, fallback: number) {
  const v = req.nextUrl.searchParams.get(key);
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}

// Strict isolation: returns the coreId that the session is allowed to query.
// Returns null if the session is Super Admin (no filter).
// Throws if a non-core/non-admin tries to query core-scoped resources.
export function scopeForCore(session: SessionUser): { coreId: string | null } {
  if (session.role === "SUPER_ADMIN") return { coreId: null };
  if (session.role === "CORE") return { coreId: session.coreId ?? null };
  // Customers shouldn't be hitting these endpoints
  throw new Error("FORBIDDEN");
}
