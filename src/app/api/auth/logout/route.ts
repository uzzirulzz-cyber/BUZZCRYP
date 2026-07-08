import { NextResponse } from "next/server";
import { audit, clearAuthCookies, requireSession } from "@/lib/auth";

export async function POST() {
  try {
    const s = await requireSession().catch(() => null);
    if (s) await audit(s.id, "LOGOUT", null);
    await clearAuthCookies();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
