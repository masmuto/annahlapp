import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

/**
 * GET /api/download-source
 * Download source code ZIP
 */
export async function GET(_req: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), "public", "go-an-nahl-source.zip");
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="go-an-nahl-source.zip"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[download-source]", err);
    return NextResponse.json(
      { error: "File tidak ditemukan: " + String(err) },
      { status: 404 }
    );
  }
}
