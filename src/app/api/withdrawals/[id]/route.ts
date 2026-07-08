import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { handleAuthError } from "@/lib/api-utils";

// PATCH /api/withdrawals/[id] — Super Admin only: change status (approve / reject)
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

    const existing = await db.withdrawal.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.$transaction(async (tx) => {
      const w = await tx.withdrawal.update({
        where: { id },
        data: { status, note: note ?? existing.note },
      });
      // On approve, debit wallet (if not previously approved)
      if (existing.status !== "APPROVED" && status === "APPROVED") {
        const cust = await tx.customer.findUnique({ where: { id: existing.customerId } });
        if (!cust || cust.walletBalance < existing.amount) {
          throw new Error("Insufficient balance for approval");
        }
        await tx.customer.update({
          where: { id: existing.customerId },
          data: { walletBalance: { decrement: existing.amount } },
        });
        await tx.walletAdjustment.create({
          data: {
            customerId: existing.customerId,
            amount: -existing.amount,
            reason: `Withdrawal ${w.id} approved`,
            createdById: session.id,
          },
        });
      } else if (existing.status === "APPROVED" && status !== "APPROVED") {
        // Reverse: refund the wallet
        await tx.customer.update({
          where: { id: existing.customerId },
          data: { walletBalance: { increment: existing.amount } },
        });
        await tx.walletAdjustment.create({
          data: {
            customerId: existing.customerId,
            amount: existing.amount,
            reason: `Withdrawal ${w.id} ${status.toLowerCase()}`,
            createdById: session.id,
          },
        });
      }
      return w;
    });

    await audit(session.id, "WITHDRAWAL_UPDATED", req, `Withdrawal ${id} -> ${status}`);
    return NextResponse.json({ success: true, withdrawal: updated });
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
    const existing = await db.withdrawal.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (existing.status === "APPROVED") {
      // refund the wallet
      await db.customer.update({
        where: { id: existing.customerId },
        data: { walletBalance: { increment: existing.amount } },
      });
    }
    await db.withdrawal.delete({ where: { id } });
    await audit(session.id, "WITHDRAWAL_DELETED", req, `Deleted withdrawal ${id}`);
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleAuthError(e);
  }
}
