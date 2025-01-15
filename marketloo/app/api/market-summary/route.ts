import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get("market_id");

    if (!marketId) {
      return NextResponse.json(
        { error: "Market ID is required" },
        { status: 400 }
      );
    }

    // Get market details
    const { data: market, error: marketError } = await supabase
      .from("markets")
      .select(
        `
        *,
        options (
          id,
          name,
          yes_outcome:outcomes!options_yes_outcome_id_fkey (
            outcome_id,
            current_price
          ),
          no_outcome:outcomes!options_no_outcome_id_fkey (
            outcome_id,
            current_price
          )
        )
      `
      )
      .eq("id", marketId)
      .single();

    if (marketError) {
      return NextResponse.json(
        { error: "Failed to fetch market details" },
        { status: 500 }
      );
    }

    // Get trade statistics
    const { data: trades, error: tradesError } = await supabase
      .from("trades")
      .select("*")
      .eq("market_id", marketId);

    if (tradesError) {
      return NextResponse.json(
        { error: "Failed to fetch trade data" },
        { status: 500 }
      );
    }

    // Get unique traders
    const { data: uniqueTraders, error: tradersError } = await supabase
      .from("positions")
      .select("user_id", { count: "exact", head: true })
      .eq("market_id", marketId);

    if (tradersError) {
      return NextResponse.json(
        { error: "Failed to fetch trader data" },
        { status: 500 }
      );
    }

    // Calculate market statistics
    const totalTrades = trades?.length || 0;
    const totalVolume = market?.volume || 0;
    const uniqueTraderCount = uniqueTraders?.count || 0;
    const averageTradeSize = totalTrades > 0 ? totalVolume / totalTrades : 0;

    // Prepare market data for LLM
    const marketData = {
      title: market?.title,
      description: market?.description,
      status: market?.status,
      created_at: market?.created_at,
      closes_at: market?.closes_at,
      volume: totalVolume,
      total_trades: totalTrades,
      unique_traders: uniqueTraderCount,
      average_trade_size: averageTradeSize,
      options: market?.options.map((option: any) => ({
        name: option.name,
        yes_price: option.yes_outcome.current_price,
        no_price: option.no_outcome.current_price,
      })),
    };

    // Generate summary with OpenAI
    const prompt = `Generate a concise market summary based on the following data. Focus on market activity, trading patterns, and current market sentiment. Keep it professional but engaging:
    ${JSON.stringify(marketData, null, 2)}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    const summary = completion.choices[0].message.content;

    return NextResponse.json({
      market: marketData,
      summary,
    });
  } catch (error: any) {
    console.error("Market summary error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate market summary" },
      { status: 500 }
    );
  }
}
