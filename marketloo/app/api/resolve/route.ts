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

    // Get all options for this market
    const { data: marketOptions, error: optionsError } = await supabase
      .from("options")
      .select("*")
      .eq("market_id", market_id);

    if (optionsError) throw optionsError;

    // Get the winning outcome details
    const { data: winningOutcome, error: outcomeError } = await supabase
      .from("outcomes")
      .select("name")
      .eq("outcome_id", outcome_id)
      .single();

    if (outcomeError || !winningOutcome) {
      throw new Error("Failed to get winning outcome");
    }

    // Find which option contains the winning outcome
    const winningOption = marketOptions?.find(
      (option) =>
        option.yes_outcome_id === outcome_id ||
        option.no_outcome_id === outcome_id
    );

    if (!winningOption) {
      throw new Error("Could not find option containing the winning outcome");
    }

    // Determine if this was a "yes" or "no" outcome
    const isYesOutcome = winningOption.yes_outcome_id === outcome_id;

    // Create arrays to track winning and losing outcome IDs
    const winningOutcomeIds: string[] = [];
    const losingOutcomeIds: string[] = [];

    // Process all options to determine winning and losing outcomes
    marketOptions.forEach((option) => {
      if (option.id === winningOption.id) {
        // For the winning option
        if (isYesOutcome) {
          winningOutcomeIds.push(option.yes_outcome_id);
          losingOutcomeIds.push(option.no_outcome_id);
        } else {
          winningOutcomeIds.push(option.no_outcome_id);
          losingOutcomeIds.push(option.yes_outcome_id);
        }
      } else {
        // For all other options, both outcomes are losing
        losingOutcomeIds.push(option.yes_outcome_id);
        losingOutcomeIds.push(option.no_outcome_id);
      }
    });

    // 1. Get all positions for this market
    const { data: positions, error: positionsError } = await supabase
      .from("positions")
      .select("*")
      .eq("market_id", market_id);

    if (positionsError) throw positionsError;

    // 2. For each position, calculate payout
    for (const position of positions) {
      const isWinningOutcome = winningOutcomeIds.includes(position.outcome_id);
      const payout = isWinningOutcome ? position.amount : 0;

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

    // 4. Mark all winning outcomes in the outcomes table
    const { error: updateWinningOutcomesError } = await supabase
      .from("outcomes")
      .update({ is_winner: true })
      .in("outcome_id", winningOutcomeIds);

    if (updateWinningOutcomesError) throw updateWinningOutcomesError;

    // Mark all losing outcomes as not winners
    const { error: updateLosingOutcomesError } = await supabase
      .from("outcomes")
      .update({ is_winner: false })
      .in("outcome_id", losingOutcomeIds);

    if (updateLosingOutcomesError) throw updateLosingOutcomesError;

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
      winningOutcomeIds,
      losingOutcomeIds,
    });
  } catch (error: any) {
    console.error("Market resolution error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resolve market" },
      { status: 500 }
    );
  }
}
