import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { handleAuthError } from "@/lib/api-utils";

// PATCH /api/trades/[id]/settle — Super Admin only
// Manually set the outcome of a pending trade to WIN or LOSS
// Body: { outcome: "WIN" | "LOSS" }
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
    const { outcome } = body as { outcome?: string };

    if (!outcome || !["WIN", "LOSS"].includes(outcome)) {
      return NextResponse.json(
        { error: "outcome must be WIN or LOSS" },
        { status: 400 },
      );
    }

    const trade = await db.trade.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }
    if (trade.status !== "PENDING" || trade.outcome !== "PENDING") {
      return NextResponse.json(
        { error: `Trade already settled as ${trade.outcome}` },
        { status: 400 },
      );
    }

    if (outcome === "WIN") {
      const payout = trade.amount + trade.amount * (trade.profitPercent / 100);
      await db.$transaction([
        db.trade.update({
          where: { id },
          data: {
            status: "COMPLETED",
            outcome: "WIN",
            payout,
            exitPrice: trade.price * (1 + (trade.direction === "UP" ? 0.005 : -0.005)),
            settlesAt: new Date(),
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
            reason: `Trade payout (ADMIN SET WIN) — ${trade.pair} ${trade.direction} ${trade.duration}s`,
            createdById: session.id,
          },
        }),
      ]);
      await audit(
        session.id,
        "TRADE_SETTLED",
        req,
        `Admin set trade ${id} as WIN. Payout: ${payout} USDT to customer ${trade.customerId}`,
      );
      return NextResponse.json({
        success: true,
        message: `Trade settled as WIN. Payout: ${payout} USDT credited to customer wallet.`,
        payout,
      });
    } else {
      // LOSS — stake already deducted, no payout
      await db.trade.update({
        where: { id },
        data: {
          status: "COMPLETED",
          outcome: "LOSS",
          payout: 0,
          exitPrice: trade.price * (1 + (trade.direction === "UP" ? -0.005 : 0.005)),
          settlesAt: new Date(),
        },
      });
      await audit(
        session.id,
        "TRADE_SETTLED",
        req,
        `Admin set trade ${id} as LOSS. No payout. Stake retained by platform.`,
      );
      return NextResponse.json({
        success: true,
        message: "Trade settled as LOSS. No payout. Stake retained by platform.",
      });
    }
  } catch (e) {
    return handleAuthError(e);
  }
}
