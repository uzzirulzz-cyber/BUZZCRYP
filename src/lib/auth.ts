import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const JWT_SECRET = process.env.JWT_SECRET || "brock-exchange-super-secret-change-me-2026";
export const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "brock-exchange-refresh-secret-change-me-2026";

export const ACCESS_TOKEN_TTL = "30m"; // 30 min access token
export const REFRESH_TOKEN_TTL = "7d"; // 7 day refresh token
export const BCRYPT_ROUNDS = 12;

export const COOKIE_ACCESS = "brock_access";
export const COOKIE_REFRESH = "brock_refresh";

export type Role = "SUPER_ADMIN" | "CORE" | "CUSTOMER";

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  coreId?: string | null;
  customerId?: string | null;
  name: string;
}

// ─── Password hashing ────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function isPasswordInHistory(
  userId: string,
  plain: string,
  keepLast = 5,
): Promise<boolean> {
  const recent = await db.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: keepLast,
  });
  for (const entry of recent) {
    if (await verifyPassword(plain, entry.passwordHash)) return true;
  }
  return false;
}

export function validatePasswordComplexity(plain: string): { ok: boolean; message?: string } {
  if (plain.length < 8)
    return { ok: false, message: "Password must be at least 8 characters long." };
  if (!/[A-Z]/.test(plain))
    return { ok: false, message: "Password must contain at least one uppercase letter." };
  if (!/[a-z]/.test(plain))
    return { ok: false, message: "Password must contain at least one lowercase letter." };
  if (!/[0-9]/.test(plain)) return { ok: false, message: "Password must contain at least one digit." };
  if (plain.toLowerCase() === "default")
    return { ok: false, message: "Password cannot be 'default'." };
  return { ok: true };
}

// ─── JWT helpers ─────────────────────────────────────────────────────────────

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ─── Cookie helpers ──────────────────────────────────────────────────────────

export async function setAuthCookies(payload: JwtPayload) {
  const access = signAccessToken(payload);
  const refresh = signRefreshToken(payload);
  const c = await cookies();
  c.set(COOKIE_ACCESS, access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 30,
  });
  c.set(COOKIE_REFRESH, refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookies() {
  const c = await cookies();
  c.delete(COOKIE_ACCESS);
  c.delete(COOKIE_REFRESH);
}

export async function getAuthPayload(): Promise<JwtPayload | null> {
  const c = await cookies();
  const access = c.get(COOKIE_ACCESS)?.value;
  if (access) {
    const payload = verifyAccessToken(access);
    if (payload) return payload;
  }
  // Try refresh token
  const refresh = c.get(COOKIE_REFRESH)?.value;
  if (refresh) {
    const payload = verifyRefreshToken(refresh);
    if (payload) {
      // Issue new access token cookie
      await setAuthCookies(payload);
      return payload;
    }
  }
  return null;
}

// ─── Auth session helpers ────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  coreId?: string | null;
  customerId?: string | null;
  mustChangePassword: boolean;
  accountStatus: string;
}

export async function getSession(): Promise<SessionUser | null> {
  const payload = await getAuthPayload();
  if (!payload) return null;
  // Fetch fresh user state from DB
  const user = await db.user.findUnique({
    where: { id: payload.sub },
    include: { core: true, customer: true },
  });
  if (!user || user.accountStatus === "DELETED") return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    coreId: user.core?.id ?? null,
    customerId: user.customer?.id ?? null,
    mustChangePassword: user.mustChangePassword,
    accountStatus: user.accountStatus,
  };
}

export async function requireSession(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHORIZED");
  return s;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const s = await requireSession();
  if (s.role !== "SUPER_ADMIN") throw new Error("FORBIDDEN");
  return s;
}

export async function requireCore(): Promise<SessionUser> {
  const s = await requireSession();
  if (s.role !== "CORE") throw new Error("FORBIDDEN");
  return s;
}

// ─── Audit logging ───────────────────────────────────────────────────────────

export async function audit(
  userId: string | null,
  action: string,
  req: Request | null,
  detail?: string,
) {
  let ip: string | undefined;
  let device: string | undefined;
  if (req) {
    ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
    device = req.headers.get("user-agent") || undefined;
  }
  await db.auditLog.create({
    data: { userId, action, ip, device, detail },
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getClientInfo(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const device = req.headers.get("user-agent") || "unknown";
  return { ip, device };
}
