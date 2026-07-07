import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { handleAuthError, qp, qpInt, scopeForCore } from "@/lib/api-utils";

// GET /api/trades — Super Admin: all; Core: own customers only
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { coreId } = scopeForCore(session);
    const page = qpInt(req, "page", 1);
    const pageSize = Math.min(qpInt(req, "pageSize", 20), 100);
    const side = qp(req, "side");
    const customerId = qp(req, "customerId");
    const pair = qp(req, "pair");

    const where: Record<string, unknown> = {};
    if (side) where.side = side;
    if (customerId) where.customerId = customerId;
    if (pair) where.pair = pair;
    if (coreId) where.customer = { coreId };

    const [total, items] = await Promise.all([
      db.trade.count({ where }),
      db.trade.findMany({
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

// POST /api/trades — Super Admin only: record a manual trade
// Body: { customerId, pair?, side, amount, price }
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const { customerId, pair, side, amount, price } = body as {
      customerId?: string;
      pair?: string;
      side?: string;
      amount?: number;
      price?: number;
    };

    if (!customerId || !side || typeof amount !== "number" || typeof price !== "number") {
      return NextResponse.json(
        { error: "customerId, side, amount, price are required." },
        { status: 400 },
      );
    }
    if (!["BUY", "SELL"].includes(side)) {
      return NextResponse.json({ error: "side must be BUY or SELL" }, { status: 400 });
    }
    if (amount <= 0 || price <= 0) {
      return NextResponse.json({ error: "amount and price must be positive." }, { status: 400 });
    }

    const cust = await db.customer.findUnique({ where: { id: customerId } });
    if (!cust) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

    const trade = await db.trade.create({
      data: {
        customerId,
        pair: pair || "BTC/USDT",
        side,
        amount,
        price,
        total: amount * price,
        status: "COMPLETED",
        createdById: session.id,
      },
    });

    await audit(session.id, "TRADE_CREATED", req, `Trade ${trade.id}: ${side} ${amount} ${pair} @ ${price} for ${customerId}`);
    return NextResponse.json({ success: true, trade });
  } catch (e) {
    return handleAuthError(e);
  }
}
