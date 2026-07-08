import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  audit,
  getClientInfo,
  hashPassword,
  requireSession,
  verifyPassword,
} from "@/lib/auth";

// POST /api/auth/change-password
// Body: { currentPassword, newPassword }
// Used for both first-login forced change and voluntary password change.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => ({}));
    const { currentPassword, newPassword } = body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "currentPassword and newPassword are required." },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 },
      );
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: "New password must contain uppercase, lowercase, and a digit." },
        { status: 400 },
      );
    }
    if (newPassword.toLowerCase() === "default") {
      return NextResponse.json(
        { error: "New password cannot be 'default'." },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({ where: { id: session.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        { error: "New password must be different from current." },
        { status: 400 },
      );
    }

    // Reject if same as last 5 historical passwords
    const history = await db.passwordHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    for (const h of history) {
      if (await verifyPassword(newPassword, h.passwordHash)) {
        return NextResponse.json(
          { error: "Password was used recently. Choose a different one." },
          { status: 400 },
        );
      }
    }

    const newHash = await hashPassword(newPassword);

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash, mustChangePassword: false },
      }),
      db.passwordHistory.create({
        data: { userId: user.id, passwordHash: newHash },
      }),
    ]);

    const { ip, device } = getClientInfo(req);
    await audit(user.id, "PASSWORD_CHANGE", req, "User changed password");

    await db.loginHistory.create({
      data: {
        userId: user.id,
        ip,
        device,
        success: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
