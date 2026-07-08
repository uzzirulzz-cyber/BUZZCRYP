import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, hashPassword, requireSession } from "@/lib/auth";
import { handleAuthError } from "@/lib/api-utils";

// PATCH /api/users/[id] — Super Admin only
// Body: { name?, email?, mobile?, accountStatus?, mustChangePassword?, resetPassword? }
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const { name, email, mobile, accountStatus, mustChangePassword, resetPassword } = body as {
      name?: string;
      email?: string;
      mobile?: string;
      accountStatus?: string;
      mustChangePassword?: boolean;
      resetPassword?: string;
    };

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== existing.email) {
        const clash = await db.user.findUnique({ where: { email: normalizedEmail } });
        if (clash) return NextResponse.json({ error: "Email already in use." }, { status: 400 });
        data.email = normalizedEmail;
      }
    }
    if (mobile !== undefined) data.mobile = mobile || null;
    if (accountStatus && ["ACTIVE", "SUSPENDED", "FROZEN", "DELETED"].includes(accountStatus)) {
      data.accountStatus = accountStatus;
    }
    if (typeof mustChangePassword === "boolean") {
      data.mustChangePassword = mustChangePassword;
    }
    if (resetPassword) {
      if (resetPassword.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters." },
          { status: 400 },
        );
      }
      data.passwordHash = await hashPassword(resetPassword);
      data.mustChangePassword = true;
    }

    const updated = await db.user.update({ where: { id }, data });
    await audit(
      session.id,
      "USER_UPDATED",
      req,
      `Updated user ${id}: ${JSON.stringify({ name, email, mobile, accountStatus, mustChangePassword, resetPassword: !!resetPassword })}`,
    );
    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        uid: updated.uid,
        name: updated.name,
        email: updated.email,
        mobile: updated.mobile,
        role: updated.role,
        accountStatus: updated.accountStatus,
        mustChangePassword: updated.mustChangePassword,
      },
    });
  } catch (e) {
    return handleAuthError(e);
  }
}

// DELETE /api/users/[id] — Super Admin only: soft delete
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await ctx.params;
    if (id === session.id) {
      return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });
    }
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.user.update({ where: { id }, data: { accountStatus: "DELETED" } });
    await audit(session.id, "USER_DELETED", req, `Deleted user ${id}`);
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleAuthError(e);
  }
}
