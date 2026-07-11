import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { handleAuthError } from "@/lib/api-utils";

// PATCH /api/customers/[id]/level — Super Admin only
// Body: { level: 1 | 2 | 3 | 4 | 5 }
// 1=Bronze, 2=Silver, 3=Gold, 4=Platinum, 5=Diamond
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const { level } = body as { level?: number };

    if (typeof level !== "number" || level < 1 || level > 5) {
      return NextResponse.json(
        { error: "Level must be a number between 1 and 5" },
        { status: 400 },
      );
    }

    const existing = await db.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const updated = await db.customer.update({
      where: { id },
      data: { level },
    });

    const levelNames: Record<number, string> = {
      1: "Bronze", 2: "Silver", 3: "Gold", 4: "Platinum", 5: "Diamond",
    };

    await audit(
      session.id,
      "CUSTOMER_LEVEL_UPDATED",
      req,
      `Customer ${id} level changed from ${levelNames[existing.level] || existing.level} to ${levelNames[level]}`,
    );

    return NextResponse.json({
      success: true,
      customer: updated,
      message: `Customer level set to ${levelNames[level]}`,
    });
  } catch (e) {
    return handleAuthError(e);
  }
}
