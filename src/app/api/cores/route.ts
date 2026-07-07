import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, hashPassword, requireSession } from "@/lib/auth";
import { handleAuthError, qp, qpInt } from "@/lib/api-utils";

// GET /api/cores — Super Admin only
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const page = qpInt(req, "page", 1);
    const pageSize = Math.min(qpInt(req, "pageSize", 50), 200);
    const search = qp(req, "search");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { invitationCode: { contains: search } },
      ];
    }

    const [total, items] = await Promise.all([
      db.core.count({ where }),
      db.core.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              lastLogin: true,
              accountStatus: true,
              mustChangePassword: true,
            },
          },
          _count: { select: { customers: true } },
        },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const itemsWithStats = await Promise.all(
      items.map(async (c) => {
        const agg = await db.customer.aggregate({
          where: { coreId: c.id, accountStatus: { not: "DELETED" } },
          _sum: { walletBalance: true },
        });
        return {
          ...c,
          customerCount: c._count.customers,
          totalWalletBalance: agg._sum.walletBalance ?? 0,
        };
      }),
    );

    return NextResponse.json({
      items: itemsWithStats,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    });
  } catch (e) {
    return handleAuthError(e);
  }
}

// POST /api/cores — Super Admin only: create new Core account with unique invitation code
// Body: { name, email, password, invitationCode }
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const { name, email, password, invitationCode } = body as {
      name?: string;
      email?: string;
      password?: string;
      invitationCode?: string;
    };

    if (!name || !email || !password || !invitationCode) {
      return NextResponse.json(
        { error: "name, email, password and invitationCode are required." },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }
    const normalizedEmail = email.toLowerCase().trim();
    if (await db.user.findUnique({ where: { email: normalizedEmail } })) {
      return NextResponse.json({ error: "Email already in use." }, { status: 400 });
    }
    const normalizedCode = invitationCode.trim().toUpperCase();
    if (await db.core.findUnique({ where: { invitationCode: normalizedCode } })) {
      return NextResponse.json({ error: "Invitation code already in use." }, { status: 400 });
    }

    const hash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash: hash,
        role: "CORE",
        mustChangePassword: true,
        accountStatus: "ACTIVE",
        core: {
          create: {
            invitationCode: normalizedCode,
            active: true,
          },
        },
      },
      include: { core: true },
    });

    await audit(session.id, "CORE_CREATED", req, `Created core ${user.email} with code ${normalizedCode}`);

    return NextResponse.json({ success: true, userId: user.id, coreId: user.core?.id });
  } catch (e) {
    return handleAuthError(e);
  }
}
