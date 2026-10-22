import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decodeToken } from "@/lib/auth";

export const runtime = "nodejs";

async function requireAuth(req: NextRequest) {
  const token = req.cookies.get("an_nahl_session_token")?.value;
  if (!token) return null;
  return decodeToken(token);
}

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const kategori = searchParams.get("kategori");
    const where: Record<string, unknown> = {};
    if (kategori && kategori !== "all") where.kategori = kategori;

    const templates = await db.pesanTemplate.findMany({
      where,
      orderBy: [{ kategori: "asc" }, { nama: "asc" }],
    });
    return NextResponse.json({ data: templates });
  } catch (err) {
    console.error("[pesan-template GET]", err);
    return NextResponse.json({ error: "Gagal memuat template" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Akses ditolak. Hanya admin." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { kode, nama, isi, kategori, aktif } = body ?? {};

    if (!kode || !nama || !isi) {
      return NextResponse.json(
        { error: "Kode, nama, dan isi wajib diisi" },
        { status: 400 }
      );
    }

    const existing = await db.pesanTemplate.findUnique({ where: { kode: String(kode).trim() } });
    if (existing) {
      return NextResponse.json({ error: "Kode template sudah dipakai" }, { status: 400 });
    }

    const tpl = await db.pesanTemplate.create({
      data: {
        kode: String(kode).trim(),
        nama: String(nama).trim(),
        isi: String(isi),
        kategori: kategori || "umum",
        aktif: aktif !== false,
      },
    });
    return NextResponse.json({ data: tpl }, { status: 201 });
  } catch (err) {
    console.error("[pesan-template POST]", err);
    return NextResponse.json({ error: "Gagal menambah template" }, { status: 500 });
  }
}
