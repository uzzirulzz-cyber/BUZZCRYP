import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { handleAuthError, qp, qpInt, scopeForCore } from "@/lib/api-utils";

// GET /api/wallets — Super Admin: all; Core: own customers' wallets + adjustments
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { coreId } = scopeForCore(session);
    const page = qpInt(req, "page", 1);
    const pageSize = Math.min(qpInt(req, "pageSize", 20), 100);
    const customerId = qp(req, "customerId");

    const where: Record<string, unknown> = {};
    if (customerId) where.customerId = customerId;
    if (coreId) where.customer = { coreId };

    const [total, items] = await Promise.all([
      db.walletAdjustment.count({ where }),
      db.walletAdjustment.findMany({
        where,
        include: {
          customer: {
            include: {
              user: { select: { name: true, email: true } },
              core: { select: { invitationCode: true } },
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

// POST /api/wallets — Super Admin only: manual wallet adjustment (credit/debit)
// Body: { customerId, amount (signed), reason }
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const { customerId, amount, reason } = body as {
      customerId?: string;
      amount?: number;
      reason?: string;
    };

    if (!customerId || typeof amount !== "number" || amount === 0 || !reason) {
      return NextResponse.json(
        { error: "customerId, non-zero amount and reason are required." },
        { status: 400 },
      );
    }

    const cust = await db.customer.findUnique({ where: { id: customerId } });
    if (!cust) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

    if (amount < 0 && cust.walletBalance + amount < 0) {
      return NextResponse.json(
        { error: `Debit exceeds balance. Available: ${cust.walletBalance}` },
        { status: 400 },
      );
    }

    const adj = await db.$transaction([
      db.walletAdjustment.create({
        data: { customerId, amount, reason, createdById: session.id },
      }),
      db.customer.update({
        where: { id: customerId },
        data: { walletBalance: { increment: amount } },
      }),
    ]);

    await audit(
      session.id,
      "WALLET_ADJUSTMENT",
      req,
      `Adjusted wallet for ${customerId} by ${amount}: ${reason}`,
    );
    return NextResponse.json({ success: true, adjustment: adj[0] });
  } catch (e) {
    return handleAuthError(e);
  }
}
