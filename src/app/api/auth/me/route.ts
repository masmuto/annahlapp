import { NextRequest, NextResponse } from "next/server";
import { decodeToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("an_nahl_session_token")?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  const user = decodeToken(token);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({ user });
}
