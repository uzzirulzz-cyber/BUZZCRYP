import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { handleAuthError } from "@/lib/api-utils";

// DELETE /api/trades/[id] — Super Admin only
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await ctx.params;
    const t = await db.trade.findUnique({ where: { id } });
    if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.trade.delete({ where: { id } });
    await audit(session.id, "TRADE_DELETED", req, `Deleted trade ${id}`);
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleAuthError(e);
  }
}
