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

// GET semua pengaturan (atau by key)
export async function GET(req: NextRequest) {
  const token = req.cookies.get("an_nahl_session_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }
  const session = decodeToken(token);
  if (!session) {
    return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    if (key) {
      const p = await db.pengaturan.findUnique({ where: { key } });
      return NextResponse.json({ data: p });
    }
    const all = await db.pengaturan.findMany();
    // Convert to object for easier frontend consumption
    const obj: Record<string, string> = {};
    all.forEach((p) => (obj[p.key] = p.value));
    return NextResponse.json({ data: obj });
  } catch (err) {
    console.error("[pengaturan GET]", err);
    return NextResponse.json({ error: "Gagal memuat pengaturan" }, { status: 500 });
  }
}

// PUT update pengaturan (bulk)
export async function PUT(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak. Hanya admin." }, { status: 403 });
  }
  try {
    const body = (await req.json()) as Record<string, string>;
    const updates = Object.entries(body).filter(([k]) => k.startsWith("wa_") || k.startsWith("app_"));

    for (const [key, value] of updates) {
      await db.pengaturan.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    return NextResponse.json({ ok: true, updated: updates.length });
  } catch (err) {
    console.error("[pengaturan PUT]", err);
    return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}
