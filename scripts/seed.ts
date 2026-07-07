import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_CORES = [
  { name: "Core 1", email: "core1@trade.com", invitationCode: "PB-CORE001" },
  { name: "Core 2", email: "core2@trade.com", invitationCode: "PB-CORE002" },
  { name: "Core 3", email: "core3@trade.com", invitationCode: "PB-CORE003" },
  { name: "Core 4", email: "core4@trade.com", invitationCode: "PB-CORE004" },
  { name: "Core 5", email: "core5@trade.com", invitationCode: "PB-CORE005" },
];

async function main() {
  console.log("🌱 Seeding Brock Exchange database...");

  const defaultHash = await bcrypt.hash("default", 12);
  const superAdminHash = await bcrypt.hash("123playbeat", 12);

  // ─── Super Admin ─────────────────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: "crdbixx@gmail.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "crdbixx@gmail.com",
      passwordHash: superAdminHash,
      role: "SUPER_ADMIN",
      mustChangePassword: false,
      accountStatus: "ACTIVE",
    },
  });
  console.log(`  ✓ Super Admin: ${superAdmin.email}`);

  // ─── Cores ───────────────────────────────────────────────────────────────
  for (const c of DEFAULT_CORES) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        name: c.name,
        email: c.email,
        passwordHash: defaultHash,
        role: "CORE",
        mustChangePassword: true, // must change default password on first login
        accountStatus: "ACTIVE",
      },
    });

    // ensure Core profile exists with invitation code
    const existingCore = await prisma.core.findUnique({ where: { userId: user.id } });
    if (!existingCore) {
      await prisma.core.create({
        data: {
          userId: user.id,
          invitationCode: c.invitationCode,
          active: true,
        },
      });
    } else if (existingCore.invitationCode !== c.invitationCode) {
      await prisma.core.update({
        where: { id: existingCore.id },
        data: { invitationCode: c.invitationCode },
      });
    }

    console.log(`  ✓ Core: ${c.email}  (code: ${c.invitationCode})`);
  }

  // ─── Seed a few demo customers for each Core so dashboards aren't empty ──
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

      // demo deposit
      await prisma.deposit.create({
        data: {
          customerId: cust.id,
          amount: 500 + i * 100,
          currency: "USDT",
          status: "APPROVED",
          createdById: superAdmin.id,
        },
      });
      // demo withdrawal
      await prisma.withdrawal.create({
        data: {
          customerId: cust.id,
          amount: 100 + i * 50,
          currency: "USDT",
          status: "PENDING",
          createdById: superAdmin.id,
        },
      });
      // demo trade
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
  console.log("");
  console.log("Login credentials:");
  console.log("  Super Admin : crdbixx@gmail.com / 123playbeat");
  console.log("  Core 1-5    : core1@trade.com ... core5@trade.com / default");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
