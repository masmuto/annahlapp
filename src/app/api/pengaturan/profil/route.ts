import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decodeToken, encodeToken } from "@/lib/auth";

export const runtime = "nodejs";

// GET profil user yang sedang login
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("an_nahl_session_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Belum login" }, { status: 401 });
    }
    const session = decodeToken(token);
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
    }
    const user = await db.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        email: true,
        phone: true,
        avatar: true,
        active: true,
        lastLogin: true,
        createdAt: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ data: user });
  } catch (err) {
    console.error("[profil GET]", err);
    return NextResponse.json({ error: "Gagal memuat profil" }, { status: 500 });
  }
}

// PUT update profil sendiri (name, email, phone, avatar, optional password)
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get("an_nahl_session_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Belum login" }, { status: 401 });
    }
    const session = decodeToken(token);
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
    }
    const body = await req.json();
    const { name, email, phone, avatar, password } = body ?? {};

    const data: Record<string, unknown> = {
      name: name?.trim() || undefined,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      avatar: avatar?.trim() || null,
    };
    if (password && password.length >= 4) {
      data.password = String(password);
    }

    const updated = await db.user.update({
      where: { id: session.id },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        email: true,
        phone: true,
        avatar: true,
      },
    });

    // Re-issue token dengan nama terbaru
    const newToken = encodeToken({
      id: updated.id,
      username: updated.username,
      name: updated.name,
      role: updated.role as "admin" | "bendahara" | "pengelola",
    });
    const res = NextResponse.json({ data: updated, token: newToken });
    res.cookies.set("an_nahl_session_token", newToken, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    console.error("[profil PUT]", err);
    return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
  }
}
