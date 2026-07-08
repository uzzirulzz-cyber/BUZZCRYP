import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { handleAuthError, qp, qpInt, scopeForCore } from "@/lib/api-utils";

// GET /api/deposits — Super Admin: all, Core: only own customers
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
      db.deposit.count({ where }),
      db.deposit.findMany({
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

// POST /api/deposits — Super Admin only: credit customer wallet
// Body: { customerId, amount, currency?, txHash?, note? }
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const { customerId, amount, currency, txHash, note, status } = body as {
      customerId?: string;
      amount?: number;
      currency?: string;
      txHash?: string;
      note?: string;
      status?: string;
    };

    if (!customerId || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "customerId and positive amount required." }, { status: 400 });
    }

    const cust = await db.customer.findUnique({ where: { id: customerId } });
    if (!cust) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

    const finalStatus = status === "PENDING" ? "PENDING" : status === "REJECTED" ? "REJECTED" : "APPROVED";

    // Create deposit + adjust wallet in a transaction
    const deposit = await db.$transaction(async (tx) => {
      const d = await tx.deposit.create({
        data: {
          customerId,
          amount,
          currency: currency || "USDT",
          txHash: txHash || null,
          note: note || null,
          status: finalStatus,
          createdById: session.id,
        },
      });
      if (finalStatus === "APPROVED") {
        await tx.customer.update({
          where: { id: customerId },
          data: { walletBalance: { increment: amount } },
        });
        await tx.walletAdjustment.create({
          data: {
            customerId,
            amount,
            reason: `Deposit ${d.id}`,
            createdById: session.id,
          },
        });
      }
      return d;
    });

    await audit(session.id, "DEPOSIT_CREATED", req, `Deposit ${deposit.id}: ${amount} ${currency || "USDT"} for ${customerId}`);
    return NextResponse.json({ success: true, deposit });
  } catch (e) {
    return handleAuthError(e);
  }
}

// PATCH /api/deposits/[id]/approve and /reject are separate routes below.
