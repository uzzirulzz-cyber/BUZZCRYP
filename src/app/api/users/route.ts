import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, hashPassword, requireSession } from "@/lib/auth";
import { handleAuthError, qp, qpInt } from "@/lib/api-utils";

// GET /api/users — Super Admin only: list all users (admin/core/customer)
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const page = qpInt(req, "page", 1);
    const pageSize = Math.min(qpInt(req, "pageSize", 50), 200);
    const search = qp(req, "search");
    const role = qp(req, "role");

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { uid: { contains: search } },
        { mobile: { contains: search } },
      ];
    }

    const [total, items] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        select: {
          id: true,
          uid: true,
          name: true,
          email: true,
          mobile: true,
          role: true,
          mustChangePassword: true,
          accountStatus: true,
          lastLogin: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // For customers, also fetch their wallet balance + core info
    const enrichedItems = await Promise.all(
      items.map(async (u) => {
        if (u.role === "CUSTOMER") {
          const cust = await db.customer.findUnique({
            where: { userId: u.id },
            select: {
              walletBalance: true,
              frozenBalance: true,
              kycStatus: true,
              invitationCode: true,
              core: { select: { invitationCode: true, user: { select: { name: true, email: true } } } },
            },
          });
          return { ...u, customer: cust };
        }
        if (u.role === "CORE") {
          const core = await db.core.findUnique({
            where: { userId: u.id },
            select: {
              invitationCode: true,
              referralCode: true,
              active: true,
              commissionEarned: true,
              _count: { select: { customers: true } },
            },
          });
          return { ...u, core };
        }
        return u;
      }),
    );

    return NextResponse.json({
      items: enrichedItems,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    });
  } catch (e) {
    return handleAuthError(e);
  }
}

// POST /api/users — Super Admin only: create a new admin/core account
// Body: { name, email, password, role: "SUPER_ADMIN" | "CORE", invitationCode?, mobile? }
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const { name, email, password, role, invitationCode, mobile } = body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      invitationCode?: string;
      mobile?: string;
    };

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "name, email, password, role are required." },
        { status: 400 },
      );
    }
    if (!["SUPER_ADMIN", "CORE"].includes(role)) {
      return NextResponse.json({ error: "Role must be SUPER_ADMIN or CORE." }, { status: 400 });
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

    const hash = await hashPassword(password);

    if (role === "CORE") {
      if (!invitationCode) {
        return NextResponse.json(
          { error: "invitationCode is required for CORE role." },
          { status: 400 },
        );
      }
      const normalizedCode = invitationCode.trim().toUpperCase();
      if (await db.core.findUnique({ where: { invitationCode: normalizedCode } })) {
        return NextResponse.json({ error: "Invitation code already in use." }, { status: 400 });
      }
      const user = await db.user.create({
        data: {
          uid: "BROCK-" + Math.random().toString(16).slice(2, 10).toUpperCase(),
          name,
          email: normalizedEmail,
          mobile: mobile || null,
          passwordHash: hash,
          role: "CORE",
          mustChangePassword: true,
          accountStatus: "ACTIVE",
          core: {
            create: {
              invitationCode: normalizedCode,
              referralCode: name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() + "-" + Math.random().toString(16).slice(2, 6).toUpperCase(),
              active: true,
            },
          },
        },
      });
      await audit(session.id, "USER_CREATED", req, `Created CORE ${user.email}`);
      return NextResponse.json({ success: true, userId: user.id });
    }

    // SUPER_ADMIN
    const user = await db.user.create({
      data: {
        uid: "BROCK-" + Math.random().toString(16).slice(2, 10).toUpperCase(),
        name,
        email: normalizedEmail,
        mobile: mobile || null,
        passwordHash: hash,
        role: "SUPER_ADMIN",
        mustChangePassword: true,
        accountStatus: "ACTIVE",
      },
    });
    await audit(session.id, "USER_CREATED", req, `Created SUPER_ADMIN ${user.email}`);
    return NextResponse.json({ success: true, userId: user.id });
  } catch (e) {
    return handleAuthError(e);
  }
}
