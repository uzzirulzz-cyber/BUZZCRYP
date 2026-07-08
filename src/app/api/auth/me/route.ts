import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// GET /api/auth/me — returns the current session user (or null)
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({ user: session });
}
