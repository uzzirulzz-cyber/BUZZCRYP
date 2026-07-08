import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleAuthError, qpInt } from "@/lib/api-utils";

// GET /api/notifications — current user's notifications
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const page = qpInt(req, "page", 1);
    const pageSize = Math.min(qpInt(req, "pageSize", 50), 100);
    const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";

    const where: Record<string, unknown> = { recipientId: session.id };
    if (unreadOnly) where.read = false;

    const [total, items, unreadCount] = await Promise.all([
      db.notification.count({ where }),
      db.notification.findMany({
        where,
        include: {
          createdBy: { select: { name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.notification.count({ where: { recipientId: session.id, read: false } }),
    ]);

    return NextResponse.json({
      items,
      total,
      unreadCount,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    });
  } catch (e) {
    return handleAuthError(e);
  }
}

// POST /api/notifications — Super Admin only: send notification to a user
// Body: { recipientId, title, body, type? }
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const { recipientId, title, body: message, type } = body as {
      recipientId?: string;
      title?: string;
      body?: string;
      type?: string;
    };
    if (!recipientId || !title || !message) {
      return NextResponse.json(
        { error: "recipientId, title and body are required." },
        { status: 400 },
      );
    }
    const n = await db.notification.create({
      data: {
        recipientId,
        createdById: session.id,
        title,
        body: message,
        type: type || "INFO",
      },
    });
    return NextResponse.json({ success: true, notification: n });
  } catch (e) {
    return handleAuthError(e);
  }
}
