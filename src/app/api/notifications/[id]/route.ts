import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { handleAuthError } from "@/lib/api-utils";

// PATCH /api/notifications/[id] — mark as read
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const n = await db.notification.findUnique({ where: { id } });
    if (!n) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (n.recipientId !== session.id && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const updated = await db.notification.update({
      where: { id },
      data: { read: true },
    });
    return NextResponse.json({ success: true, notification: updated });
  } catch (e) {
    return handleAuthError(e);
  }
}

// DELETE /api/notifications/[id] — delete notification
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const n = await db.notification.findUnique({ where: { id } });
    if (!n) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (n.recipientId !== session.id && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await db.notification.delete({ where: { id } });
    await audit(session.id, "NOTIFICATION_DELETED", req, `Deleted notification ${id}`);
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleAuthError(e);
  }
}
