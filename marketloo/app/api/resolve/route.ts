import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    // Verify the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { market_id, outcome_id } = await request.json();

    // Get the winning outcome name
    const { data: winningOutcome, error: outcomeError } = await supabase
      .from("outcomes")
      .select("name")
      .eq("outcome_id", outcome_id)
      .single();

    if (outcomeError || !winningOutcome) {
      throw new Error("Failed to get winning outcome");
    }

    // 1. Get all positions for this market
    const { data: positions, error: positionsError } = await supabase
      .from("positions")
      .select("*")
      .eq("market_id", market_id);

    if (positionsError) throw positionsError;

    // 2. For each position, calculate payout
    for (const position of positions) {
      const payout = position.outcome_id === outcome_id ? position.amount : 0;

      if (payout > 0) {
        // Update user's balance
        const { error: updateError } = await supabase.rpc("add_to_balance", {
          user_id: position.user_id,
          amount: payout,
        });

        if (updateError) throw updateError;
      }
    }

    // 3. Mark market as resolved with the winning outcome name
    const { error: marketError } = await supabase
      .from("markets")
      .update({
        status: "resolved",
        outcome: winningOutcome.name,
        closes_at: new Date().toISOString(),
      })
      .eq("id", market_id);

    if (marketError) throw marketError;

    // 4. Mark the winning outcome in the outcomes table
    const { error: updateOutcomeError } = await supabase
      .from("outcomes")
      .update({ is_winner: true })
      .eq("outcome_id", outcome_id);

    if (updateOutcomeError) throw updateOutcomeError;

    // 5. Cancel any pending orders
    const { error: ordersError } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("market_id", market_id)
      .eq("status", "pending");

    if (ordersError) throw ordersError;

    return NextResponse.json({
      success: true,
      winningOutcome: winningOutcome.name,
    });
  } catch (error: any) {
    console.error("Market resolution error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resolve market" },
      { status: 500 }
    );
  }
}
