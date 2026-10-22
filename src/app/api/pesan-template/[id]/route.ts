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
    const { nama, isi, kategori, aktif } = body ?? {};

    const data: Record<string, unknown> = {};
    if (nama !== undefined) data.nama = String(nama).trim();
    if (isi !== undefined) data.isi = String(isi);
    if (kategori !== undefined) data.kategori = kategori;
    if (aktif !== undefined) data.aktif = Boolean(aktif);

    const tpl = await db.pesanTemplate.update({ where: { id }, data });
    return NextResponse.json({ data: tpl });
  } catch (err) {
    console.error("[pesan-template PUT]", err);
    return NextResponse.json({ error: "Gagal update template" }, { status: 500 });
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
    await db.pesanTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[pesan-template DELETE]", err);
    return NextResponse.json({ error: "Gagal menghapus template" }, { status: 500 });
  }
}
