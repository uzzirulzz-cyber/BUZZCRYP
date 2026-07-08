import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { handleAuthError } from "@/lib/api-utils";

// GET /api/cores/[id] — Super Admin only
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await ctx.params;
    const core = await db.core.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, lastLogin: true, accountStatus: true, mustChangePassword: true, createdAt: true } },
        _count: { select: { customers: true } },
      },
    });
    if (!core) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(core);
  } catch (e) {
    return handleAuthError(e);
  }
}

// PATCH /api/cores/[id] — Super Admin only
// Body: { name?, active?, accountStatus?, invitationCode?(must be unique) }
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
    const { name, active, accountStatus, invitationCode } = body as {
      name?: string;
      active?: boolean;
      accountStatus?: string;
      invitationCode?: string;
    };

    const existing = await db.core.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (typeof active === "boolean") data.active = active;
    if (invitationCode) {
      const normalized = invitationCode.trim().toUpperCase();
      if (normalized !== existing.invitationCode) {
        const clash = await db.core.findUnique({ where: { invitationCode: normalized } });
        if (clash) return NextResponse.json({ error: "Invitation code in use." }, { status: 400 });
        data.invitationCode = normalized;
      }
    }

    const userUpdate: Record<string, unknown> = {};
    if (name) userUpdate.name = name;
    if (accountStatus && ["ACTIVE", "SUSPENDED", "FROZEN", "DELETED"].includes(accountStatus)) {
      userUpdate.accountStatus = accountStatus;
    }

    await db.$transaction([
      db.core.update({ where: { id }, data }),
      Object.keys(userUpdate).length > 0
        ? db.user.update({ where: { id: existing.userId }, data: userUpdate })
        : db.$executeRaw`SELECT 1`,
    ]);

    await audit(session.id, "CORE_UPDATED", req, `Updated core ${id}: ${JSON.stringify({ ...data, ...userUpdate })}`);

    return NextResponse.json({ success: true });
  } catch (e) {
    return handleAuthError(e);
  }
}

// DELETE /api/cores/[id] — Super Admin only: soft delete
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
    const core = await db.core.findUnique({ where: { id } });
    if (!core) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.$transaction([
      db.core.update({ where: { id }, data: { active: false } }),
      db.user.update({ where: { id: core.userId }, data: { accountStatus: "DELETED" } }),
    ]);
    await audit(session.id, "CORE_DELETED", req, `Deleted core ${id}`);

    return NextResponse.json({ success: true });
  } catch (e) {
    return handleAuthError(e);
  }
}
