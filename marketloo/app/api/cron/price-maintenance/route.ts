import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// This endpoint will be called by Vercel Cron
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const authHeader = request.headers.get("authorization");

    // Verify this is a legitimate cron job from Vercel
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run the maintenance functions
    const { error: archiveError } = await supabase.rpc(
      "archive_hourly_price_data"
    );
    if (archiveError) {
      console.error("Error archiving hourly data:", archiveError);
    }

    const { error: consolidateError } = await supabase.rpc(
      "consolidate_price_history"
    );
    if (consolidateError) {
      console.error("Error consolidating price history:", consolidateError);
    }

    return NextResponse.json({
      message: "Maintenance tasks completed successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
