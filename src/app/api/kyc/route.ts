import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleAuthError, qp, qpInt, scopeForCore } from "@/lib/api-utils";

// GET /api/kyc — list KYC records (customers with KYC status)
// Super Admin: all; Core: own customers only
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { coreId } = scopeForCore(session);
    const page = qpInt(req, "page", 1);
    const pageSize = Math.min(qpInt(req, "pageSize", 20), 100);
    const status = qp(req, "status");

    const where: Record<string, unknown> = { accountStatus: { not: "DELETED" } };
    if (coreId) where.coreId = coreId;
    if (status) where.kycStatus = status;

    const [total, items] = await Promise.all([
      db.customer.count({ where }),
      db.customer.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, lastLogin: true } },
          core: { include: { user: { select: { name: true, email: true } } } },
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
