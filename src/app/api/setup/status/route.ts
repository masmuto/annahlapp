import { NextResponse } from "next/server";
import { readSupabaseConfig, maskConfig } from "@/lib/supabase-config";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// GET /api/setup/status — overall app setup status
// Returns:
//   - supabase: { configured, initialized, ... }
//   - database: { hasUsers, userCount }
//   - needsSetup: true if first-time setup required
export async function GET() {
  const config = readSupabaseConfig();

  let userCount = 0;
  let dbError: string | null = null;
  try {
    userCount = await db.user.count();
  } catch (err) {
    dbError = String(err);
  }

  const needsSetup = userCount === 0;

  return NextResponse.json({
    supabase: maskConfig(config),
    database: {
      hasUsers: userCount > 0,
      userCount,
      error: dbError,
    },
    needsSetup,
    // First-time setup is required if:
    //   - DB has no users, AND
    //   - Either Supabase is not configured OR not initialized
    needsSupabaseSetup: needsSetup && (!config.configured || !config.initialized),
  });
}
