import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decodeToken } from "@/lib/auth";

export const runtime = "nodejs";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("an_nahl_session_token")?.value;
  if (!token) return null;
  const s = decodeToken(token);
  if (!s || s.role !== "admin") return null;
  return s;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak. Hanya admin." }, { status: 403 });
  }
  try {
    const users = await db.user.findMany({
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
      orderBy: [{ createdAt: "asc" }],
    });
    return NextResponse.json({ data: users });
  } catch (err) {
    console.error("[users GET]", err);
    return NextResponse.json({ error: "Gagal memuat users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak. Hanya admin." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { username, password, name, role, email, phone } = body ?? {};

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: "Username, password, dan nama wajib diisi" },
        { status: 400 }
      );
    }
    if (password.length < 4) {
      return NextResponse.json(
        { error: "Password minimal 4 karakter" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { username: String(username).trim() } });
    if (existing) {
      return NextResponse.json({ error: "Username sudah dipakai" }, { status: 400 });
    }

    const user = await db.user.create({
      data: {
        username: String(username).trim(),
        password: String(password),
        name: String(name).trim(),
        role: role || "pengelola",
        email: email?.trim() || null,
        phone: phone?.trim() || null,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        email: true,
        phone: true,
        avatar: true,
        active: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (err) {
    console.error("[users POST]", err);
    return NextResponse.json({ error: "Gagal menambah user" }, { status: 500 });
  }
}
