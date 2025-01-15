import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Price maintenance job started:", new Date().toISOString());
    const supabase = await createClient();

    // Run the maintenance functions
    console.log("Starting hourly data archival...");
    const { error: archiveError } = await supabase.rpc(
      "archive_hourly_price_data"
    );
    if (archiveError) {
      console.error("Error archiving hourly data:", archiveError);
    } else {
      console.log("Hourly data archived successfully");
    }

    console.log("Starting price history consolidation...");
    const { error: consolidateError } = await supabase.rpc(
      "consolidate_price_history"
    );
    if (consolidateError) {
      console.error("Error consolidating price history:", consolidateError);
    } else {
      console.log("Price history consolidated successfully");
    }

    // Get counts for logging
    const { count: recentCount } = await supabase
      .from("recent_price_history")
      .select("*", { count: "exact", head: true });

    const { count: archivedCount } = await supabase
      .from("archived_price_history")
      .select("*", { count: "exact", head: true });

    console.log("Current data counts:", {
      recentPricePoints: recentCount,
      archivedPricePoints: archivedCount,
    });

    return NextResponse.json({
      message: "Maintenance tasks completed successfully",
      stats: {
        recentPricePoints: recentCount,
        archivedPricePoints: archivedCount,
      },
    });
  } catch (error) {
    console.error("Price maintenance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
