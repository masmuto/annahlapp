import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// DELETE: hapus santri dari kelompok
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; anggotaId: string }> }
) {
  try {
    const { id, anggotaId } = await params;
    await db.anggotaKelompok.delete({
      where: { id: anggotaId, kelompokId: id },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[anggota DELETE]", err);
    return NextResponse.json({ error: "Gagal menghapus anggota" }, { status: 500 });
  }
}
