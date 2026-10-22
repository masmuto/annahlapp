import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encodeToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body ?? {};

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { username: String(username).trim() },
    });

    if (!user || user.password !== String(password)) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role as "admin" | "bendahara" | "pengelola",
    };

    const token = encodeToken(payload);

    const res = NextResponse.json({ user: payload, token });
    res.cookies.set("an_nahl_session_token", token, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    console.error("[auth/login] error", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
