import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, hashPassword, requireSession, generateUid } from "@/lib/auth";
import { randomBytes } from "crypto";
import { handleAuthError } from "@/lib/api-utils";

function generateReferralCode(name: string): string {
  const slug = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase();
  return `${slug}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

// POST /api/admin/reset — Super Admin only
// Wipes ALL data from the platform and re-seeds with ONLY the default admin accounts
// (Super Admin + 5 Sub-Agents). No demo customers, no dummy deposits/withdrawals/trades.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ⚠️ DESTRUCTIVE OPERATION — wipe all tables in dependency order
    // Delete child tables first, then parent tables
    await db.$transaction([
      db.notification.deleteMany({}),
      db.walletAdjustment.deleteMany({}),
      db.trade.deleteMany({}),
      db.withdrawal.deleteMany({}),
      db.deposit.deleteMany({}),
      db.passwordHistory.deleteMany({}),
      db.loginHistory.deleteMany({}),
      db.auditLog.deleteMany({}),
      db.customer.deleteMany({}),
      db.core.deleteMany({}),
      db.user.deleteMany({}),
    ]);

    // Re-seed with ONLY the default accounts — no dummy entries
    const defaultHash = await hashPassword("default", 12);
    const superAdminHash = await hashPassword("123playbeat", 12);

    // Super Admin
    const superAdmin = await db.user.create({
      data: {
        uid: generateUid(),
        name: "Super Admin",
        email: "crdbixx@gmail.com",
        mobile: "+923001234567",
        passwordHash: superAdminHash,
        role: "SUPER_ADMIN",
        mustChangePassword: false,
        accountStatus: "ACTIVE",
      },
    });

    // 5 Sub-Agents with PB-AG001 to PB-AG005 invitation codes
    const DEFAULT_CORES = [
      { name: "SubAgent 1", email: "subagent1@trade.com",  invitationCode: "PB-AG001" },
      { name: "SubAgent 2", email: "subagent2@trade2.com", invitationCode: "PB-AG002" },
      { name: "SubAgent 3", email: "subagent3@trade3.com", invitationCode: "PB-AG003" },
      { name: "SubAgent 4", email: "subagent4@trade4.com", invitationCode: "PB-AG004" },
      { name: "SubAgent 5", email: "subagent5@trade5.com", invitationCode: "PB-AG005" },
    ];

    for (const c of DEFAULT_CORES) {
      const user = await db.user.create({
        data: {
          uid: generateUid(),
          name: c.name,
          email: c.email,
          passwordHash: defaultHash,
          role: "CORE",
          mustChangePassword: true,
          accountStatus: "ACTIVE",
        },
      });
      await db.core.create({
        data: {
          userId: user.id,
          invitationCode: c.invitationCode,
          referralCode: generateReferralCode(c.name),
          active: true,
        },
      });
    }

    await audit(
      session.id,
      "PLATFORM_RESET",
      req,
      "Platform reset to defaults. All demo/dummy data wiped. Re-seeded with Super Admin + 5 Sub-Agents only.",
    );

    return NextResponse.json({
      success: true,
      message: "Platform reset complete. All demo data wiped. Only default admin accounts remain.",
      seeded: {
        superAdmin: superAdmin.email,
        subAgents: DEFAULT_CORES.length,
        demoCustomers: 0,
        demoDeposits: 0,
        demoWithdrawals: 0,
        demoTrades: 0,
      },
    });
  } catch (e) {
    return handleAuthError(e);
  }
}
