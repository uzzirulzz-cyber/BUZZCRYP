import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// 10 Sub-Agent accounts (role: CORE) — each owns one globally unique invitation code.
const DEFAULT_CORES = Array.from({ length: 10 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    name: `Sub-Agent ${n}`,
    email: `subagent${n}@trade.com`,
    invitationCode: `PB-CORE${String(i + 1).padStart(3, "0")}`,
  };
});

async function main() {
  console.log("🌱 Seeding Brock Exchange database...");

  const defaultHash = await bcrypt.hash("default", 12);
  const superAdminHash = await bcrypt.hash("geotv123", 12);

  // ─── Super Admin ─────────────────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: "rajaji@geo.tv" },
    update: {
      // ensure password + role are correct on rerun
      passwordHash: superAdminHash,
      role: "SUPER_ADMIN",
      mustChangePassword: false,
      accountStatus: "ACTIVE",
    },
    create: {
      name: "Super Admin",
      email: "rajaji@geo.tv",
      passwordHash: superAdminHash,
      role: "SUPER_ADMIN",
      mustChangePassword: false,
      accountStatus: "ACTIVE",
    },
  });
  console.log(`  ✓ Super Admin: ${superAdmin.email}`);

  // ─── Sub-Agents (Core role) ──────────────────────────────────────────────
  for (const c of DEFAULT_CORES) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {
        passwordHash: defaultHash,
        role: "CORE",
        mustChangePassword: true,
        accountStatus: "ACTIVE",
      },
      create: {
        name: c.name,
        email: c.email,
        passwordHash: defaultHash,
        role: "CORE",
        mustChangePassword: true,
        accountStatus: "ACTIVE",
      },
    });

    const existingCore = await prisma.core.findUnique({ where: { userId: user.id } });
    if (!existingCore) {
      await prisma.core.create({
        data: { userId: user.id, invitationCode: c.invitationCode, active: true },
      });
    } else if (existingCore.invitationCode !== c.invitationCode) {
      await prisma.core.update({
        where: { id: existingCore.id },
        data: { invitationCode: c.invitationCode, active: true },
      });
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
          name: `Demo Customer ${i} (${core.invitationCode})`,
          email,
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
          walletBalance: 1000 + i * 500,
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
      await prisma.trade.create({
        data: {
          customerId: cust.id,
          pair: "BTC/USDT",
          side: "BUY",
          amount: 0.01 * i,
          price: 62000 + i * 500,
          total: 0.01 * i * (62000 + i * 500),
          status: "COMPLETED",
          createdById: superAdmin.id,
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
