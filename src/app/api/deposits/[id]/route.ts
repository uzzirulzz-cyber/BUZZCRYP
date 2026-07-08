import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { handleAuthError } from "@/lib/api-utils";

// PATCH /api/deposits/[id] — Super Admin only: change status
// Body: { status: "APPROVED" | "REJECTED", note? }
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
    const { status, note } = body as { status?: string; note?: string };

    if (!status || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const existing = await db.deposit.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // If transitioning PENDING -> APPROVED, credit the wallet. If reversing, debit.
    const updated = await db.$transaction(async (tx) => {
      const d = await tx.deposit.update({
        where: { id },
        data: { status, note: note ?? existing.note },
      });
      if (existing.status !== "APPROVED" && status === "APPROVED") {
        await tx.customer.update({
          where: { id: existing.customerId },
          data: { walletBalance: { increment: existing.amount } },
        });
        await tx.walletAdjustment.create({
          data: {
            customerId: existing.customerId,
            amount: existing.amount,
            reason: `Deposit ${d.id} approved`,
            createdById: session.id,
          },
        });
      } else if (existing.status === "APPROVED" && status !== "APPROVED") {
        await tx.customer.update({
          where: { id: existing.customerId },
          data: { walletBalance: { decrement: existing.amount } },
        });
        await tx.walletAdjustment.create({
          data: {
            customerId: existing.customerId,
            amount: -existing.amount,
            reason: `Deposit ${d.id} ${status.toLowerCase()}`,
            createdById: session.id,
          },
        });
      }
      return d;
    });

    await audit(session.id, "DEPOSIT_UPDATED", req, `Deposit ${id} -> ${status}`);
    return NextResponse.json({ success: true, deposit: updated });
  } catch (e) {
    return handleAuthError(e);
  }
}

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
    const existing = await db.deposit.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // If it was approved, debit the wallet back
    if (existing.status === "APPROVED") {
      await db.customer.update({
        where: { id: existing.customerId },
        data: { walletBalance: { decrement: existing.amount } },
      });
    }
    await db.deposit.delete({ where: { id } });
    await audit(session.id, "DEPOSIT_DELETED", req, `Deleted deposit ${id}`);
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleAuthError(e);
  }
}
