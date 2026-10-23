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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, role, email, phone, password, active } = body ?? {};

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name).trim();
    if (role !== undefined) data.role = role;
    if (email !== undefined) data.email = email?.trim() || null;
    if (phone !== undefined) data.phone = phone?.trim() || null;
    if (active !== undefined) data.active = Boolean(active);
    if (password && String(password).length >= 4) {
      data.password = String(password);
    }

    const user = await db.user.update({
      where: { id },
      data,
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
    return NextResponse.json({ data: user });
  } catch (err) {
    console.error("[users PUT]", err);
    return NextResponse.json({ error: "Gagal update user" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  try {
    const { id } = await params;

    // Cegah hapus diri sendiri
    if (id === session.id) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus akun sendiri" },
        { status: 400 }
      );
    }

    // Cegah hapus admin terakhir
    const adminCount = await db.user.count({ where: { role: "admin", active: true } });
    const target = await db.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    if (target.role === "admin" && adminCount <= 1) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus admin terakhir" },
        { status: 400 }
      );
    }

    await db.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[users DELETE]", err);
    return NextResponse.json({ error: "Gagal menghapus user" }, { status: 500 });
  }
}
