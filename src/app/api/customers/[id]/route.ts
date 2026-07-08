import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { handleAuthError, scopeForCore } from "@/lib/api-utils";

// GET /api/customers/[id] — fetch single customer (with RBAC + ownership check)
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const { coreId } = scopeForCore(session);

    const cust = await db.customer.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, lastLogin: true, accountStatus: true, mustChangePassword: true } },
        core: { include: { user: { select: { email: true, name: true } } } },
      },
    });
    if (!cust) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (coreId && cust.coreId !== coreId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(cust);
  } catch (e) {
    return handleAuthError(e);
  }
}

// PATCH /api/customers/[id]
// Super Admin: can change kycStatus, accountStatus, coreId (reassign), walletBalance (with audit)
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
    const { kycStatus, accountStatus, coreId: newCoreId } = body as {
      kycStatus?: string;
      accountStatus?: string;
      coreId?: string;
    };

    const existing = await db.customer.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (kycStatus && ["PENDING", "VERIFIED", "REJECTED"].includes(kycStatus)) {
      data.kycStatus = kycStatus;
    }
    if (accountStatus && ["ACTIVE", "SUSPENDED", "FROZEN", "DELETED"].includes(accountStatus)) {
      data.accountStatus = accountStatus;
      await db.user.update({
        where: { id: existing.userId },
        data: { accountStatus },
      });
    }
    if (newCoreId && newCoreId !== existing.coreId) {
      const newCore = await db.core.findUnique({ where: { id: newCoreId } });
      if (!newCore) return NextResponse.json({ error: "Core not found" }, { status: 404 });
      data.coreId = newCoreId;
      data.invitationCode = newCore.invitationCode;
    }

    const updated = await db.customer.update({ where: { id }, data });
    await audit(
      session.id,
      "CUSTOMER_UPDATED",
      req,
      `Updated customer ${id}: ${JSON.stringify(data)}`,
    );

    return NextResponse.json(updated);
  } catch (e) {
    return handleAuthError(e);
  }
}

// DELETE /api/customers/[id] — soft delete (set status DELETED)
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

    const cust = await db.customer.findUnique({ where: { id } });
    if (!cust) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.$transaction([
      db.customer.update({ where: { id }, data: { accountStatus: "DELETED" } }),
      db.user.update({ where: { id: cust.userId }, data: { accountStatus: "DELETED" } }),
    ]);
    await audit(session.id, "CUSTOMER_DELETED", req, `Deleted customer ${id}`);

    return NextResponse.json({ success: true });
  } catch (e) {
    return handleAuthError(e);
  }
}
