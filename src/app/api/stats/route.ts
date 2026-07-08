import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleAuthError, scopeForCore } from "@/lib/api-utils";

// GET /api/stats — dashboard overview stats
// Super Admin: platform-wide; Core: scoped to own customers
export async function GET(_req: NextRequest) {
  try {
    const session = await requireSession();
    const { coreId } = scopeForCore(session);

    const customerWhere = coreId
      ? { coreId }
      : { accountStatus: { not: "DELETED" } };

    const [
      totalCustomers,
      activeCustomers,
      verifiedKyc,
      pendingKyc,
      totalCores,
      activeCores,
      walletSumAgg,
      depositSumAgg,
      withdrawalSumAgg,
      pendingDeposits,
      pendingWithdrawals,
      totalTrades,
      recentDeposits,
      recentWithdrawals,
      recentTrades,
      recentTradeRows,
    ] = await Promise.all([
      db.customer.count({ where: customerWhere }),
      db.customer.count({ where: { ...customerWhere, accountStatus: "ACTIVE" } }),
      db.customer.count({ where: { ...customerWhere, kycStatus: "VERIFIED" } }),
      db.customer.count({ where: { ...customerWhere, kycStatus: "PENDING" } }),
      coreId ? Promise.resolve(1) : db.core.count({ where: { user: { accountStatus: { not: "DELETED" } } } }),
      coreId ? Promise.resolve(1) : db.core.count({ where: { active: true, user: { accountStatus: "ACTIVE" } } }),
      db.customer.aggregate({ where: customerWhere, _sum: { walletBalance: true } }),
      db.deposit.aggregate({
        where: { customer: customerWhere, status: "APPROVED" },
        _sum: { amount: true },
      }),
      db.withdrawal.aggregate({
        where: { customer: customerWhere, status: "APPROVED" },
        _sum: { amount: true },
      }),
      db.deposit.count({ where: { customer: customerWhere, status: "PENDING" } }),
      db.withdrawal.count({ where: { customer: customerWhere, status: "PENDING" } }),
      db.trade.count({ where: { customer: customerWhere } }),
      db.deposit.findMany({
        where: { customer: customerWhere },
        include: { customer: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.withdrawal.findMany({
        where: { customer: customerWhere },
        include: { customer: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.trade.findMany({
        where: { customer: customerWhere },
        include: { customer: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // pull last 30 trades and group client-side for the volume series
      db.trade.findMany({
        where: { customer: customerWhere },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    // Build 14-day volume series client-side
    const days: Array<{ day: string; total: number; count: number }> = [];
    const today = new Date();
    const map = new Map<string, { total: number; count: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, { total: 0, count: 0 });
    }
    for (const r of recentTradeRows) {
      const key = r.createdAt.toISOString().slice(0, 10);
      if (map.has(key)) {
        const v = map.get(key)!;
        v.total += r.total;
        v.count += 1;
      }
    }
    for (const [day, v] of map.entries()) days.push({ day, ...v });

    return NextResponse.json({
      totals: {
        customers: totalCustomers,
        activeCustomers,
        verifiedKyc,
        pendingKyc,
        cores: totalCores,
        activeCores,
        totalWalletBalance: walletSumAgg._sum.walletBalance ?? 0,
        totalDeposits: depositSumAgg._sum.amount ?? 0,
        totalWithdrawals: withdrawalSumAgg._sum.amount ?? 0,
        pendingDeposits,
        pendingWithdrawals,
        totalTrades,
      },
      recent: {
        deposits: recentDeposits,
        withdrawals: recentWithdrawals,
        trades: recentTrades,
      },
      tradeVolumeSeries: days,
    });
  } catch (e) {
    return handleAuthError(e);
  }
}
