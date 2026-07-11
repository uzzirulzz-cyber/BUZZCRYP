import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  audit,
  clearAuthCookies,
  getClientInfo,
  requireSession,
  setAuthCookies,
  verifyPassword,
} from "@/lib/auth";

// POST /api/auth/login
// Body: { email, password }
export async function POST(req: NextRequest) {
  const { ip, device } = getClientInfo(req);
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({
      where: { email: email.trim() },
      include: { core: true, customer: true },
    });

    if (!user) {
      await audit(null, "LOGIN_FAILED", req, `Unknown email: ${email}`);
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    if (user.accountStatus === "DELETED") {
      await audit(user.id, "LOGIN_FAILED", req, "Deleted account login attempt");
      return NextResponse.json({ error: "Account does not exist." }, { status: 403 });
    }
    if (user.accountStatus === "SUSPENDED") {
      await audit(user.id, "LOGIN_FAILED", req, "Suspended account login attempt");
      return NextResponse.json({ error: "Account suspended. Contact Super Admin." }, { status: 403 });
    }
    if (user.accountStatus === "FROZEN") {
      await audit(user.id, "LOGIN_FAILED", req, "Frozen account login attempt");
      return NextResponse.json({ error: "Account frozen. Contact Super Admin." }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await db.loginHistory.create({
        data: { userId: user.id, ip, device, success: false },
      });
      await audit(user.id, "LOGIN_FAILED", req, "Bad password");
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    // Successful login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
    await db.loginHistory.create({
      data: { userId: user.id, ip, device, success: true },
    });
    await audit(user.id, "LOGIN_SUCCESS", req, `Role: ${user.role}`);

    // Issue JWT tokens and set HTTP-only cookies
    await setAuthCookies({
      sub: user.id,
      uid: user.uid,
      email: user.email,
      role: user.role as "SUPER_ADMIN" | "CORE" | "CUSTOMER",
      coreId: user.core?.id ?? null,
      customerId: user.customer?.id ?? null,
      name: user.name,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        accountStatus: user.accountStatus,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET /api/auth/login — quick helper that returns whether default password still works
// Used by the UI to show "first login" hints. Not security-sensitive.
export async function GET() {
  return NextResponse.json({ ok: true, service: "brock-auth" });
}

// DELETE /api/auth/login — alias for logout (some clients prefer DELETE)
export async function DELETE() {
  try {
    const s = await requireSession().catch(() => null);
    if (s) await audit(s.id, "LOGOUT", null);
    await clearAuthCookies();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
