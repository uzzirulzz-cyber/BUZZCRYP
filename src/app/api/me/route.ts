import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleAuthError } from "@/lib/api-utils";

// GET /api/me — returns the current user's full dashboard data
// Includes: profile, wallet, frozen balance, deposits, withdrawals, trades, P&L, recent transactions
export async function GET(_req: NextRequest) {
  try {
    const session = await requireSession();

    // For customers, fetch their customer record. For admins/cores, return role-appropriate data.
    if (session.role === "CUSTOMER") {
      const customer = await db.customer.findUnique({
        where: { userId: session.id },
        include: {
          user: { select: { id: true, uid: true, name: true, email: true, mobile: true, role: true, lastLogin: true, createdAt: true } },
          core: { select: { invitationCode: true, referralCode: true, user: { select: { name: true, email: true } } } },
        },
      });
      if (!customer) return NextResponse.json({ error: "Customer record not found" }, { status: 404 });

      const [deposits, withdrawals, trades, notifications] = await Promise.all([
        db.deposit.findMany({
          where: { customerId: customer.id },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        db.withdrawal.findMany({
          where: { customerId: customer.id },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        db.trade.findMany({
          where: { customerId: customer.id },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        db.notification.findMany({
          where: { recipientId: session.id },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

      // Calculate P&L
      const totalStaked = trades.reduce((s, t) => s + t.amount, 0);
      const totalPayout = trades.reduce((s, t) => s + t.payout, 0);
      const profitLoss = totalPayout - totalStaked;
      const wins = trades.filter((t) => t.outcome === "WIN").length;
      const losses = trades.filter((t) => t.outcome === "LOSS").length;
      const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

      // Recent transactions (combined feed)
      const recentTransactions = [
        ...deposits.map((d) => ({ id: d.id, type: "DEPOSIT", amount: d.amount, currency: d.currency, status: d.status, createdAt: d.createdAt })),
        ...withdrawals.map((w) => ({ id: w.id, type: "WITHDRAWAL", amount: -w.amount, currency: w.currency, status: w.status, createdAt: w.createdAt })),
        ...trades.map((t) => ({ id: t.id, type: "TRADE", amount: t.outcome === "WIN" ? t.payout - t.amount : -t.amount, currency: "USDT", status: t.outcome, createdAt: t.createdAt })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 15);

      return NextResponse.json({
        profile: customer.user,
        customer: {
          id: customer.id,
          uid: customer.user.uid,
          walletBalance: customer.walletBalance,
          frozenBalance: customer.frozenBalance,
          totalAssets: customer.walletBalance + customer.frozenBalance,
          kycStatus: customer.kycStatus,
          accountStatus: customer.accountStatus,
          invitationCode: customer.invitationCode,
          referralCode: customer.referralCode,
          core: customer.core,
          registrationTimestamp: customer.registrationTimestamp,
        },
        stats: {
          totalDeposits: deposits.filter((d) => d.status === "APPROVED").reduce((s, d) => s + d.amount, 0),
          totalWithdrawals: withdrawals.filter((w) => w.status === "APPROVED").reduce((s, w) => s + w.amount, 0),
          pendingDeposits: deposits.filter((d) => d.status === "PENDING").length,
          pendingWithdrawals: withdrawals.filter((w) => w.status === "PENDING").length,
          totalTrades: trades.length,
          wins,
          losses,
          winRate,
          totalStaked,
          totalPayout,
          profitLoss,
        },
        deposits,
        withdrawals,
        trades,
        notifications,
        recentTransactions,
      });
    }

    // For SUPER_ADMIN and CORE, return their profile + role-specific stats
    const user = await db.user.findUnique({
      where: { id: session.id },
      include: { core: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      profile: {
        id: user.id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      core: user.core,
    });
  } catch (e) {
    return handleAuthError(e);
  }
}
