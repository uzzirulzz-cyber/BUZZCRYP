import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, getSession, hashPassword, requireSession } from "@/lib/auth";
import { handleAuthError, qp, qpInt, scopeForCore } from "@/lib/api-utils";

// GET /api/customers
// Super Admin: list all customers
// Core: list only customers with their coreId (data isolation enforced)
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { coreId } = scopeForCore(session);
    const page = qpInt(req, "page", 1);
    const pageSize = Math.min(qpInt(req, "pageSize", 20), 100);
    const search = qp(req, "search");
    const status = qp(req, "status");
    const kyc = qp(req, "kyc");

    const where: Record<string, unknown> = {};
    if (coreId) where.coreId = coreId;
    if (status) where.accountStatus = status;
    if (kyc) where.kycStatus = kyc;
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { invitationCode: { contains: search } },
      ];
    }

    const [total, items] = await Promise.all([
      db.customer.count({ where }),
      db.customer.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, lastLogin: true, accountStatus: true } },
          core: { include: { user: { select: { email: true, name: true } } } },
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

// POST /api/customers
// Super Admin only: register a new customer on behalf of a Core
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

    const core = await db.core.findUnique({
      where: { invitationCode: invitationCode.trim().toUpperCase() },
      include: { user: true },
    });
    if (!core) {
      return NextResponse.json({ error: "Invalid invitation code." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 400 });
    }

    const hash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash: hash,
        role: "CUSTOMER",
        mustChangePassword: false,
        accountStatus: "ACTIVE",
        customer: {
          create: {
            coreId: core.id,
            invitationCode: core.invitationCode,
            walletBalance: 0,
            kycStatus: "PENDING",
            accountStatus: "ACTIVE",
          },
        },
      },
      include: { customer: true },
    });

    await audit(session.id, "CUSTOMER_CREATED", req, `Created customer ${user.email} under ${core.invitationCode}`);

    return NextResponse.json({ success: true, userId: user.id, customerId: user.customer?.id });
  } catch (e) {
    return handleAuthError(e);
  }
}

// GET /api/customers/me — returns the current customer's own profile (for customer role)
export async function OPTIONS() {
  return NextResponse.json({});
}

// Helper export for /api/customers/me — handled in separate file
export const _getSession = getSession;
