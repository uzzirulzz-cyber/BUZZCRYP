import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, requireSession } from "@/lib/auth";
import { handleAuthError } from "@/lib/api-utils";

// PATCH /api/kyc/[id] — Super Admin only: update KYC status of a customer
// Body: { status: "VERIFIED" | "REJECTED" | "PENDING" }
// [id] is the customer ID
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
    const { status } = body as { status?: string };

    if (!status || !["PENDING", "VERIFIED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const existing = await db.customer.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.customer.update({
      where: { id },
      data: { kycStatus: status },
    });

    await audit(session.id, "KYC_UPDATE", req, `Customer ${id} KYC -> ${status}`);
    return NextResponse.json({ success: true, customer: updated });
  } catch (e) {
    return handleAuthError(e);
  }
}
