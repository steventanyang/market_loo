import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

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

    // Get request body
    const body = await request.json();
    const { type, title, description, closes_at } = body;

    // Create market
    const { data: market, error: marketError } = await supabase
      .from("markets")
      .insert([
        {
          title,
          description,
          closes_at,
          user_id: user.id,
          status: "open",
        },
      ])
      .select()
      .single();

    if (marketError) throw marketError;

    if (type === "binary") {
      const { option_name } = body;

      // Create option
      const { data: option, error: optionError } = await supabase
        .from("options")
        .insert([
          {
            market_id: market.id,
            name: option_name,
          },
        ])
        .select()
        .single();

      if (optionError) throw optionError;

      // Create yes outcome
      const { data: yesOutcome, error: yesError } = await supabase
        .from("outcomes")
        .insert([
          {
            market_id: market.id,
            name: "Yes",
            initial_price: 0.5,
            current_price: 0.5,
          },
        ])
        .select()
        .single();

      if (yesError) throw yesError;

      // Create no outcome
      const { data: noOutcome, error: noError } = await supabase
        .from("outcomes")
        .insert([
          {
            market_id: market.id,
            name: "No",
            initial_price: 0.5,
            current_price: 0.5,
          },
        ])
        .select()
        .single();

      if (noError) throw noError;

      // Update option with outcome IDs
      const { error: updateError } = await supabase
        .from("options")
        .update({
          yes_outcome_id: yesOutcome.outcome_id,
          no_outcome_id: noOutcome.outcome_id,
        })
        .eq("id", option.id);

      if (updateError) throw updateError;
    } else {
      // Multi-outcome market
      const { outcomes } = body;
      const initialPrice = 1 / outcomes.length;

      // For each outcome, create a Yes/No pair of outcomes and an option
      for (const outcomeName of outcomes) {
        // Create Yes outcome
        const { data: yesOutcome, error: yesError } = await supabase
          .from("outcomes")
          .insert([
            {
              market_id: market.id,
              name: "Yes",
              initial_price: initialPrice,
              current_price: initialPrice,
            },
          ])
          .select()
          .single();

        if (yesError) throw yesError;

        // Create No outcome
        const { data: noOutcome, error: noError } = await supabase
          .from("outcomes")
          .insert([
            {
              market_id: market.id,
              name: "No",
              initial_price: 1 - initialPrice,
              current_price: 1 - initialPrice,
            },
          ])
          .select()
          .single();

        if (noError) throw noError;

        // Create option linking the Yes/No outcomes
        const { error: optionError } = await supabase.from("options").insert([
          {
            market_id: market.id,
            name: `${outcomeName}`,
            yes_outcome_id: yesOutcome.outcome_id,
            no_outcome_id: noOutcome.outcome_id,
          },
        ]);

        if (optionError) throw optionError;
      }
    }

    return NextResponse.json({ success: true, market });
  } catch (error: any) {
    console.error("Error creating market:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create market" },
      { status: 500 }
    );
  }
}
