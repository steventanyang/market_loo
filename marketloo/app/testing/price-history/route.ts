import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Endpoint to manually insert test data
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get a test market and its outcomes
    const { data: market } = await supabase
      .from("markets")
      .select("id, outcomes(outcome_id)")
      .eq("status", "active")
      .single();

    if (!market?.outcomes) {
      return NextResponse.json(
        { error: "No active market found" },
        { status: 404 }
      );
    }

    // Insert test data points for the last hour
    const now = new Date();
    const testData = [];

    for (let i = 0; i < 12; i++) {
      // 12 points, 5 minutes apart
      const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000); // go back in time

      for (const outcome of market.outcomes) {
        testData.push({
          market_id: market.id,
          outcome_id: outcome.outcome_id,
          price: 50 + Math.random() * 10 - 5, // Random price around 50
          timestamp: timestamp.toISOString(),
        });
      }
    }

    const { error: insertError } = await supabase
      .from("recent_price_history")
      .insert(testData);

    if (insertError) {
      console.error("Error inserting test data:", insertError);
      return NextResponse.json(
        { error: "Failed to insert test data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Test data inserted successfully",
      count: testData.length,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
