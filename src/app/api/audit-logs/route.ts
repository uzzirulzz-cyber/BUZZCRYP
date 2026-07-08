import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleAuthError, qp, qpInt } from "@/lib/api-utils";

// GET /api/audit-logs — Super Admin: all; Core: only own logs (filtered by user)
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role === "CUSTOMER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const page = qpInt(req, "page", 1);
    const pageSize = Math.min(qpInt(req, "pageSize", 50), 200);
    const action = qp(req, "action");
    const userId = qp(req, "userId");
    const search = qp(req, "search");

    const where: Record<string, unknown> = {};
    if (action) where.action = { contains: action };
    if (userId) where.userId = userId;
    if (search) where.detail = { contains: search };

    // Cores can only see logs about themselves
    if (session.role === "CORE") {
      where.userId = session.id;
    }

    const [total, items] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, role: true } },
        },
        orderBy: { timestamp: "desc" },
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
