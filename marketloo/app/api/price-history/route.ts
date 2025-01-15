import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Define types more strictly
type Outcome = {
  outcome_id: string;
  market_id: string;
  current_price: number | null; // Note: could be null from database
};

export async function GET() {
  try {
    console.log("Price history cron job started:", new Date().toISOString());
    const supabase = await createClient();

    // 1. Get open markets
    const { data: openMarkets, error: marketsError } = await supabase
      .from("markets")
      .select("id")
      .eq("status", "open");

    if (marketsError) {
      console.error("Error fetching markets:", marketsError);
      return NextResponse.json(
        { error: "Failed to fetch markets" },
        { status: 500 }
      );
    }

    const marketIds = openMarkets?.map((m) => m.id) || [];
    console.log(`Found ${marketIds.length} open markets:`, marketIds);

    if (marketIds.length === 0) {
      return NextResponse.json(
        { message: "No open markets found" },
        { status: 200 }
      );
    }

    // 2. Get outcomes with non-null current prices
    const { data: outcomes, error: outcomesError } = await supabase
      .from("outcomes")
      .select(
        `
        outcome_id,
        market_id,
        current_price
      `
      )
      .in("market_id", marketIds)
      .not("current_price", "is", null); // Changed from neq to not is null

    if (outcomesError) {
      console.error("Error fetching outcomes:", outcomesError);
      return NextResponse.json(
        { error: "Failed to fetch outcomes" },
        { status: 500 }
      );
    }

    if (!outcomes || outcomes.length === 0) {
      console.log("No outcomes found with prices");
      return NextResponse.json(
        { message: "No outcomes found with prices" },
        { status: 200 }
      );
    }

    // Log outcomes for debugging
    console.log(
      `Found ${outcomes.length} outcomes with prices:`,
      outcomes.map((o) => ({
        outcome_id: o.outcome_id,
        price: o.current_price,
      }))
    );

    // 3. Filter out any outcomes with null prices (extra safety)
    const validOutcomes = outcomes.filter(
      (outcome): outcome is Outcome =>
        typeof outcome.current_price === "number" &&
        !isNaN(outcome.current_price)
    );

    if (validOutcomes.length === 0) {
      console.log("No valid prices found in outcomes");
      return NextResponse.json(
        { message: "No valid prices found" },
        { status: 200 }
      );
    }

    // 4. Insert price snapshots
    const { error: insertError } = await supabase
      .from("recent_price_history")
      .insert(
        validOutcomes.map((outcome) => ({
          market_id: outcome.market_id,
          outcome_id: outcome.outcome_id,
          price: (outcome.current_price ?? 0) * 100,
          timestamp: new Date().toISOString(),
        }))
      );

    if (insertError) {
      console.error("Error inserting price history:", insertError);
      return NextResponse.json(
        { error: "Failed to record price history" },
        { status: 500 }
      );
    }

    // 5. Run cleanup
    const { error: cleanupError } = await supabase.rpc(
      "cleanup_recent_price_history"
    );

    if (cleanupError) {
      console.error("Error cleaning up old data:", cleanupError);
    }

    console.log(
      `Successfully recorded ${validOutcomes.length} price snapshots`
    );
    return NextResponse.json({
      message: "Price history updated successfully",
      snapshots: validOutcomes.length,
    });
  } catch (error) {
    console.error("Price history cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
