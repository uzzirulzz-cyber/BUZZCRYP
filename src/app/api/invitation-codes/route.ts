import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleAuthError } from "@/lib/api-utils";

// GET /api/invitation-codes — Super Admin: all; Core: only its own
export async function GET() {
  try {
    const session = await requireSession();
    if (session.role === "SUPER_ADMIN") {
      const cores = await db.core.findMany({
        include: {
          user: { select: { name: true, email: true, accountStatus: true } },
          _count: { select: { customers: true } },
        },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ items: cores });
    }
    if (session.role === "CORE") {
      const core = await db.core.findUnique({
        where: { userId: session.id },
        include: {
          user: { select: { name: true, email: true, accountStatus: true } },
          _count: { select: { customers: true } },
        },
      });
      if (!core) return NextResponse.json({ items: [] });
      return NextResponse.json({ items: [core] });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (e) {
    return handleAuthError(e);
  }
}
