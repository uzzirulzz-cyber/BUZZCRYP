import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

// Force-set DATABASE_URL from .env file (system env has stale SQLite URL)
import fs from "fs";
const envContent = fs.readFileSync(__dirname + "/../.env", "utf8");
const dbMatch = envContent.match(/^DATABASE_URL="?(.+?)"?$/m);
const DB_URL = dbMatch ? dbMatch[1] : process.env.DATABASE_URL!;
process.env.DATABASE_URL = DB_URL;

// Use datasources override to bypass schema env() validation
const prisma = new PrismaClient({
  datasources: { db: { url: DB_URL } },
});

function generateUid(): string {
  return "BROCK-" + randomBytes(4).toString("hex").toUpperCase();
}

function generateReferralCode(name: string): string {
  const slug = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase();
  return `${slug}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

// ─── Default Sub-Agent accounts (5) ──────────────────────────────────────────
// Each Sub-Agent owns one globally-unique invitation code (BR-AG00X).
const DEFAULT_CORES = [
  { name: "SubAgent 1", email: "subagent1BR@trade.com",  password: "BRSub#1001", invitationCode: "BR-AG001" },
  { name: "SubAgent 2", email: "subagent2BR@trade2.com", password: "BRSub#1002", invitationCode: "BR-AG002" },
  { name: "SubAgent 3", email: "subagent3BR@trade3.com", password: "BRSub#1003", invitationCode: "BR-AG003" },
  { name: "SubAgent 4", email: "subagent4BR@trade4.com", password: "BRSub#1004", invitationCode: "BR-AG004" },
  { name: "SubAgent 5", email: "subagent5BR@trade5.com", password: "BRSub#1005", invitationCode: "BR-AG005" },
];

async function main() {
  console.log("🌱 Seeding BuzzCryp database...");

  const superAdminHash = await bcrypt.hash("Brock@Admin2026!", 12);

  // ─── Super Admin ─────────────────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@brockexchange.com" },
    update: {
      passwordHash: superAdminHash,
      role: "SUPER_ADMIN",
      mustChangePassword: false,
      accountStatus: "ACTIVE",
    },
    create: {
      uid: generateUid(),
      name: "Super Admin",
      email: "admin@brockexchange.com",
      mobile: "+923001234567",
      passwordHash: superAdminHash,
      role: "SUPER_ADMIN",
      mustChangePassword: false,
      accountStatus: "ACTIVE",
    },
  });
  console.log(`  ✓ Super Admin: ${superAdmin.email}  (UID: ${superAdmin.uid})`);

  // ─── Sub-Agents (Core role) ──────────────────────────────────────────────
  for (const c of DEFAULT_CORES) {
    const hash = await bcrypt.hash(c.password, 12);
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {
        passwordHash: hash,
        role: "CORE",
        mustChangePassword: true, // must change password on first login
        accountStatus: "ACTIVE",
      },
      create: {
        uid: generateUid(),
        name: c.name,
        email: c.email,
        mobile: `+92300${Math.floor(1000000 + Math.random() * 8999999)}`,
        passwordHash: hash,
        role: "CORE",
        mustChangePassword: true,
        accountStatus: "ACTIVE",
      },
    });

    const existingCore = await prisma.core.findUnique({ where: { userId: user.id } });
    if (!existingCore) {
      await prisma.core.create({
        data: {
          userId: user.id,
          invitationCode: c.invitationCode,
          referralCode: generateReferralCode(c.name),
          active: true,
        },
      });
    } else {
      const updateData: Record<string, unknown> = { active: true };
      if (existingCore.invitationCode !== c.invitationCode) {
        updateData.invitationCode = c.invitationCode;
      }
      if (!existingCore.referralCode) {
        updateData.referralCode = generateReferralCode(c.name);
      }
      await prisma.core.update({ where: { id: existingCore.id }, data: updateData });
    }

    console.log(`  ✓ Sub-Agent: ${c.email}  (code: ${c.invitationCode})`);
  }

  // ─── Seed a few demo customers for each Sub-Agent so dashboards aren't empty ──
  const cores = await prisma.core.findMany({ include: { user: true } });
  let demoCount = 0;
  for (const core of cores) {
    const existingDemos = await prisma.customer.count({
      where: { coreId: core.id, user: { email: { contains: "@demo.brock" } } },
    });
    if (existingDemos >= 2) continue;

    for (let i = 1; i <= 2; i++) {
      const email = `demo_${i}_${core.invitationCode.toLowerCase()}@demo.brock`;
      const userHash = await bcrypt.hash("default", 12);
      const cu = await prisma.user.create({
        data: {
          uid: generateUid(),
          name: `Demo Customer ${i} (${core.invitationCode})`,
          email,
          mobile: `+92301${Math.floor(1000000 + Math.random() * 8999999)}`,
          passwordHash: userHash,
          role: "CUSTOMER",
          mustChangePassword: true,
          accountStatus: "ACTIVE",
        },
      });
      const cust = await prisma.customer.create({
        data: {
          userId: cu.id,
          coreId: core.id,
          invitationCode: core.invitationCode,
          referralCode: core.referralCode,
          walletBalance: 1000 + i * 500,
          frozenBalance: i === 1 ? 100 : 0,
          level: i % 2 === 0 ? 3 : 1, // alternate Gold/Bronze
          kycStatus: i % 2 === 0 ? "VERIFIED" : "PENDING",
          accountStatus: "ACTIVE",
        },
      });

      await prisma.deposit.create({
        data: {
          customerId: cust.id,
          amount: 500 + i * 100,
          currency: "USDT",
          status: "APPROVED",
          createdById: superAdmin.id,
        },
      });
      await prisma.withdrawal.create({
        data: {
          customerId: cust.id,
          amount: 100 + i * 50,
          currency: "USDT",
          status: "PENDING",
          createdById: superAdmin.id,
        },
      });
      // Demo fixed-time trade
      const durations = [30, 60, 120] as const;
      const profits = [20, 30, 50] as const;
      const dirIdx = i % 2 === 0 ? "UP" : "DOWN";
      const durIdx = i % 3;
      const isPending = i === 1;
      await prisma.trade.create({
        data: {
          customerId: cust.id,
          pair: "BTC/USDT",
          side: dirIdx,
          direction: dirIdx,
          amount: 50 + i * 10,
          price: 62000 + i * 500,
          total: 50 + i * 10,
          status: isPending ? "PENDING" : "COMPLETED",
          outcome: isPending ? "PENDING" : (i % 3 === 0 ? "WIN" : "LOSS"),
          duration: durations[durIdx],
          profitPercent: profits[durIdx],
          payout: isPending ? 0 : (i % 3 === 0 ? (50 + i * 10) * (1 + profits[durIdx] / 100) : 0),
          settlesAt: isPending ? new Date(Date.now() + 60000) : null,
          createdById: superAdmin.id,
        },
      });

      // Welcome notification
      await prisma.notification.create({
        data: {
          recipientId: cu.id,
          createdById: superAdmin.id,
          title: "Welcome to BuzzCryp",
          body: `Your account has been created. UID: ${cu.uid}. Use invitation code ${core.invitationCode}.`,
          type: "INFO",
        },
      });

      demoCount++;
    }
  }
  console.log(`  ✓ Created ${demoCount} demo customers`);

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
