import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleAuthError, qpInt } from "@/lib/api-utils";

// GET /api/login-history
// Super Admin: query param userId can be set; otherwise all
// Core: only own history
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const page = qpInt(req, "page", 1);
    const pageSize = Math.min(qpInt(req, "pageSize", 30), 100);
    const url = new URL(req.url);
    const userIdParam = url.searchParams.get("userId");

    const where: Record<string, unknown> = {};
    if (session.role === "CORE") {
      where.userId = session.id;
    } else if (session.role === "SUPER_ADMIN" && userIdParam) {
      where.userId = userIdParam;
    }

    const [total, items] = await Promise.all([
      db.loginHistory.count({ where }),
      db.loginHistory.findMany({
        where,
        include: { user: { select: { name: true, email: true, role: true } } },
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
