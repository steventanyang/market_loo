import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// This endpoint will be called every 5 minutes to record current prices

// Add this type definition
type Outcome = {
  outcome_id: string;
  market_id: string;
  current_price: number;
};

export async function GET() {
  try {
    console.log("Price history cron job started:", new Date().toISOString());
    const supabase = await createClient();

    // First, get open market IDs
    const { data: openMarkets } = await supabase
      .from("markets")
      .select("id")
      .eq("status", "open");

    const marketIds = openMarkets?.map((m) => m.id) || [];

    if (marketIds.length === 0) {
      console.log("No open markets found");
      return NextResponse.json(
        { message: "No open markets found" },
        { status: 200 }
      );
    }

    // Then get outcomes for those markets
    const { data: outcomes, error: outcomesError } = (await supabase
      .from("outcomes")
      .select(
        `
        outcome_id,
        market_id,
        current_price
      `
      )
      .in("market_id", marketIds)
      .neq("current_price", null)) as { data: Outcome[] | null; error: any };

    if (outcomesError) {
      console.error("Error fetching outcomes:", outcomesError);
      return NextResponse.json(
        { error: "Failed to fetch outcomes" },
        { status: 500 }
      );
    }

    if (!outcomes?.length) {
      return NextResponse.json(
        { message: "No active markets found" },
        { status: 200 }
      );
    }

    // Insert price snapshots into recent_price_history
    const { error: insertError } = await supabase
      .from("recent_price_history")
      .insert(
        outcomes.map((outcome) => ({
          market_id: outcome.market_id,
          outcome_id: outcome.outcome_id,
          price: outcome.current_price,
        }))
      );

    if (insertError) {
      console.error("Error inserting price history:", insertError);
      return NextResponse.json(
        { error: "Failed to record price history" },
        { status: 500 }
      );
    }

    // Run cleanup function to remove old data
    const { error: cleanupError } = await supabase.rpc(
      "cleanup_recent_price_history"
    );

    if (cleanupError) {
      console.error("Error cleaning up old data:", cleanupError);
    }

    console.log("Price snapshots recorded:", outcomes.length);
    return NextResponse.json({
      message: "Price history updated successfully",
      snapshots: outcomes.length,
    });
  } catch (error) {
    console.error("Price history cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
