import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { handleAuthError, qp, qpInt, scopeForCore } from "@/lib/api-utils";

// GET /api/withdrawals — Super Admin: all; Core: own customers only
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { coreId } = scopeForCore(session);
    const page = qpInt(req, "page", 1);
    const pageSize = Math.min(qpInt(req, "pageSize", 20), 100);
    const status = qp(req, "status");
    const customerId = qp(req, "customerId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (coreId) where.customer = { coreId };

    const [total, items] = await Promise.all([
      db.withdrawal.count({ where }),
      db.withdrawal.findMany({
        where,
        include: {
          customer: {
            include: {
              user: { select: { name: true, email: true } },
              core: { select: { invitationCode: true, user: { select: { name: true, email: true } } } },
            },
          },
          createdBy: { select: { name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    });
  } catch (e) {
    return handleAuthError(e);
  }
}

// POST /api/withdrawals — Super Admin only: create withdrawal (debits wallet on APPROVED)
// Body: { customerId, amount, currency?, destAddress?, note?, status? }
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const { customerId, amount, currency, destAddress, note, status } = body as {
      customerId?: string;
      amount?: number;
      currency?: string;
      destAddress?: string;
      note?: string;
      status?: string;
    };

    if (!customerId || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "customerId and positive amount required." }, { status: 400 });
    }

    const cust = await db.customer.findUnique({ where: { id: customerId } });
    if (!cust) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

    const finalStatus = status === "REJECTED" ? "REJECTED" : status === "PENDING" ? "PENDING" : "APPROVED";

    if (finalStatus === "APPROVED" && cust.walletBalance < amount) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: ${cust.walletBalance}` },
        { status: 400 },
      );
    }

    const withdrawal = await db.$transaction(async (tx) => {
      const w = await tx.withdrawal.create({
        data: {
          customerId,
          amount,
          currency: currency || "USDT",
          destAddress: destAddress || null,
          note: note || null,
          status: finalStatus,
          createdById: session.id,
        },
      });
      if (finalStatus === "APPROVED") {
        await tx.customer.update({
          where: { id: customerId },
          data: { walletBalance: { decrement: amount } },
        });
        await tx.walletAdjustment.create({
          data: {
            customerId,
            amount: -amount,
            reason: `Withdrawal ${w.id}`,
            createdById: session.id,
          },
        });
      }
      return w;
    });

    await audit(session.id, "WITHDRAWAL_CREATED", req, `Withdrawal ${withdrawal.id}: ${amount} for ${customerId}`);
    return NextResponse.json({ success: true, withdrawal });
  } catch (e) {
    return handleAuthError(e);
  }
}
