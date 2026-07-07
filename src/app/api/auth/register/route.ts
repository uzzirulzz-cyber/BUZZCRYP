import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, getClientInfo, hashPassword, requireSession } from "@/lib/auth";

// POST /api/auth/register
// Customer self-registration using an invitation code.
// Body: { name, email, password, invitationCode }
export async function POST(req: NextRequest) {
  const { ip, device } = getClientInfo(req);
  try {
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
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain uppercase, lowercase, and a digit." },
        { status: 400 },
      );
    }

    // Look up invitation code in cores
    const core = await db.core.findUnique({
      where: { invitationCode: invitationCode.trim().toUpperCase() },
      include: { user: true },
    });
    if (!core) {
      return NextResponse.json({ error: "Invalid invitation code." }, { status: 400 });
    }
    if (!core.active) {
      return NextResponse.json({ error: "Invitation code is disabled." }, { status: 400 });
    }
    if (core.user.accountStatus !== "ACTIVE") {
      return NextResponse.json(
        { error: "Owning Core account is not active." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 400 });
    }

    const hash = await hashPassword(password);

    // Atomic create: user + customer record. Assignment to Core is permanent.
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

    // Try to attribute registration to a session if Super Admin is creating on behalf
    const session = await requireSession().catch(() => null);
    await audit(
      session?.id ?? user.id,
      "CUSTOMER_REGISTERED",
      req,
      `Customer ${user.email} registered with code ${core.invitationCode} (Core: ${core.user.email})`,
    );
    await db.loginHistory.create({
      data: {
        userId: user.id,
        ip,
        device,
        success: true,
      },
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      customerId: user.customer?.id,
      coreId: core.id,
      invitationCode: core.invitationCode,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
