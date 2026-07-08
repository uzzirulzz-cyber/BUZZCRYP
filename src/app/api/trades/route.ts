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
    const direction = qp(req, "direction");
    const customerId = qp(req, "customerId");
    const pair = qp(req, "pair");
    const outcome = qp(req, "outcome");

    const where: Record<string, unknown> = {};
    if (side) where.side = side;
    if (direction) where.direction = direction;
    if (outcome) where.outcome = outcome;
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

// POST /api/trades — Super Admin only: create a fixed-time trade
// Body: { customerId, pair, direction: "UP"|"DOWN", amount (stake in USDT), duration (seconds) }
// The API computes the entry price from MARKET_PRICES and the potential payout from the duration tier.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const { customerId, pair, direction, amount, duration } = body as {
      customerId?: string;
      pair?: string;
      direction?: string;
      amount?: number;
      duration?: number;
    };

    if (!customerId || !direction || typeof amount !== "number" || typeof duration !== "number") {
      return NextResponse.json(
        { error: "customerId, direction, amount, duration are required." },
        { status: 400 },
      );
    }
    if (!["UP", "DOWN"].includes(direction)) {
      return NextResponse.json({ error: "direction must be UP or DOWN" }, { status: 400 });
    }
    if (amount <= 0) {
      return NextResponse.json({ error: "Stake amount must be positive." }, { status: 400 });
    }

    // Duration tiers → potential return %
    const DURATION_TIERS: Record<number, number> = {
      30: 20,   // 30s → up to +20%
      60: 30,   // 60s → up to +30%
      120: 50,  // 120s → up to +50%
    };
    const profitPercent = DURATION_TIERS[duration];
    if (profitPercent === undefined) {
      return NextResponse.json(
        { error: "Invalid duration. Must be 30, 60, or 120 seconds." },
        { status: 400 },
      );
    }

    // Entry price from market prices
    const MARKET_PRICES: Record<string, number> = {
      "BTC/USDT": 62500,
      "ETH/USDT": 3120,
      "BTG/USDT": 38.5,
      "BTS/USDT": 0.045,
    };
    const selectedPair = pair || "BTC/USDT";
    const entryPrice = MARKET_PRICES[selectedPair] || 62500;

    const cust = await db.customer.findUnique({ where: { id: customerId } });
    if (!cust) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

    // Check sufficient balance
    if (cust.walletBalance < amount) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: ${cust.walletBalance} USDT` },
        { status: 400 },
      );
    }

    // Debit the stake from the wallet immediately, create the trade as PENDING
    const settlesAt = new Date(Date.now() + duration * 1000);
    const potentialPayout = amount * (profitPercent / 100);

    const trade = await db.$transaction(async (tx) => {
      // Debit stake
      await tx.customer.update({
        where: { id: customerId },
        data: { walletBalance: { decrement: amount } },
      });
      await tx.walletAdjustment.create({
        data: {
          customerId,
          amount: -amount,
          reason: `Trade stake (${selectedPair} ${direction} ${duration}s)`,
          createdById: session.id,
        },
      });

      const t = await tx.trade.create({
        data: {
          customerId,
          pair: selectedPair,
          side: direction, // UP/DOWN stored in side for backwards compat
          direction,
          amount,
          price: entryPrice,
          total: amount, // stake amount
          status: "PENDING",
          outcome: "PENDING",
          duration,
          profitPercent,
          payout: 0,
          settlesAt,
          createdById: session.id,
        },
      });
      return t;
    });

    await audit(
      session.id,
      "TRADE_CREATED",
      req,
      `Trade ${trade.id}: ${direction} ${amount} USDT on ${selectedPair} for ${duration}s (potential +${profitPercent}%)`,
    );

    return NextResponse.json({
      success: true,
      trade,
      message: `Trade placed. ${direction} ${amount} USDT on ${selectedPair} for ${duration}s. Potential return: up to +${profitPercent}% (${(amount + potentialPayout).toFixed(2)} USDT).`,
    });
  } catch (e) {
    return handleAuthError(e);
  }
}

// GET /api/trades/settle — settle any pending trades whose settlesAt has passed
// This is a maintenance endpoint that can be called periodically.
export async function PUT(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const pendingTrades = await db.trade.findMany({
      where: { status: "PENDING", outcome: "PENDING", settlesAt: { lte: now } },
      include: { customer: true },
    });

    // Simulate market movement: random outcome with ~50% win rate
    const MARKET_PRICES: Record<string, number> = {
      "BTC/USDT": 62500,
      "ETH/USDT": 3120,
      "BTG/USDT": 38.5,
      "BTS/USDT": 0.045,
    };

    let settled = 0;
    for (const trade of pendingTrades) {
      const entryPrice = trade.price;
      const currentPrice = MARKET_PRICES[trade.pair] || entryPrice;
      // Simulate: 50% chance price went up, 50% down
      const wentUp = Math.random() >= 0.5;
      const won =
        (trade.direction === "UP" && wentUp) ||
        (trade.direction === "DOWN" && !wentUp);

      if (won) {
        const payout = trade.amount + trade.amount * (trade.profitPercent / 100);
        await db.$transaction([
          db.trade.update({
            where: { id: trade.id },
            data: {
              status: "COMPLETED",
              outcome: "WIN",
              payout,
            },
          }),
          db.customer.update({
            where: { id: trade.customerId },
            data: { walletBalance: { increment: payout } },
          }),
          db.walletAdjustment.create({
            data: {
              customerId: trade.customerId,
              amount: payout,
              reason: `Trade payout (WIN) — ${trade.pair} ${trade.direction} ${trade.duration}s`,
              createdById: session.id,
            },
          }),
        ]);
      } else {
        await db.trade.update({
          where: { id: trade.id },
          data: {
            status: "COMPLETED",
            outcome: "LOSS",
            payout: 0,
          },
        });
      }
      settled++;
    }

    await audit(session.id, "TRADES_SETTLED", req, `Settled ${settled} pending trades`);
    return NextResponse.json({ success: true, settled });
  } catch (e) {
    return handleAuthError(e);
  }
}
