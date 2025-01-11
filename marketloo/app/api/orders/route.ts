import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface Order {
  id: string;
  market_id: string;
  user_id: string;
  outcome_id: string;
  amount: number;
  price: number;
  type: "buying" | "selling";
  status: "pending" | "filled" | "cancelled";
  created_at: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MARKET_MAKER_ID = "d6caee95-1d81-46b4-9528-de16990fc169";

const BASE_SPREAD = 0.005; // 0.5% base spread
const LIQUIDITY_FACTOR = 0.002; // 0.2% additional variation
const VOLUME_IMPACT_FACTOR = 0.005; // Increased from 0.001 to 0.005 (0.5% impact per unit)

function calculatePriceWithImpact(
  currentPrice: number,
  amount: number,
  type: "buying" | "selling"
) {
  // Base spread and liquidity variation
  const baseVariation =
    BASE_SPREAD + (Math.random() * LIQUIDITY_FACTOR * 2 - LIQUIDITY_FACTOR);

  // Volume-based price impact (larger orders = bigger impact)
  const volumeImpact = VOLUME_IMPACT_FACTOR * Math.log10(amount + 1);

  // Direction of impact based on order type
  const direction = type === "buying" ? 1 : -1;

  // Combine all factors
  const totalImpact = baseVariation + volumeImpact * direction;

  console.log("Price Impact Calculation:", {
    currentPrice,
    amount,
    type,
    baseVariation,
    volumeImpact,
    direction,
    totalImpact,
    newPrice: currentPrice * (1 + totalImpact),
  });

  return currentPrice * (1 + totalImpact);
}

async function createMarketMakerOrder(
  marketId: string,
  outcomeId: string,
  amount: number,
  price: number,
  type: "buying" | "selling"
) {
  const { data: order, error } = await supabase
    .from("orders")
    .insert([
      {
        market_id: marketId,
        user_id: MARKET_MAKER_ID,
        outcome_id: outcomeId,
        amount,
        price,
        status: "pending",
        type: type === "buying" ? "selling" : "buying", // Opposite of the original order
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return order;
}

async function updatePricesWithConstraint(
  outcomeId: string,
  marketId: string,
  newPrice: number
) {
  // First, get all outcomes for this market
  const { data: outcomes, error: fetchError } = await supabase
    .from("outcomes")
    .select("outcome_id, current_price")
    .eq("market_id", marketId);

  if (fetchError) throw fetchError;
  if (!outcomes) throw new Error("No outcomes found");

  // For binary markets, adjust the other outcome to maintain sum = 1
  if (outcomes.length === 2) {
    const otherOutcome = outcomes.find((o) => o.outcome_id !== outcomeId);
    if (!otherOutcome) throw new Error("Other outcome not found");

    // Ensure the new price is between 0 and 1
    const constrainedPrice = Math.max(0.01, Math.min(0.99, newPrice));
    const otherPrice = 1 - constrainedPrice;

    // Update both prices atomically
    const { error: updateError } = await supabase.from("outcomes").upsert([
      { outcome_id: outcomeId, current_price: constrainedPrice },
      { outcome_id: otherOutcome.outcome_id, current_price: otherPrice },
    ]);

    if (updateError) throw updateError;

    return { updatedPrice: constrainedPrice };
  }

  // For non-binary markets (if you add them later)
  throw new Error("Only binary markets are supported currently");
}

export async function POST(request: Request) {
  try {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const body = await request.json();
    const { market_id, outcome_id, amount, type } = body;

    // Validate input
    if (!market_id || !outcome_id || !amount || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current price from outcomes table
    const { data: outcome, error: outcomeError } = await supabase
      .from("outcomes")
      .select("current_price")
      .eq("outcome_id", outcome_id)
      .single();

    if (outcomeError || !outcome) {
      throw new Error("Failed to get outcome price");
    }

    // Create the initial order
    const { data: newOrder, error: insertError } = await supabase
      .from("orders")
      .insert([
        {
          market_id,
          user_id: MARKET_MAKER_ID,
          outcome_id,
          amount,
          price: outcome.current_price,
          status: "pending",
          type,
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // Find matching orders
    const { data: matchingOrders, error: matchError } = await supabase
      .from("orders")
      .select("*")
      .eq("market_id", market_id)
      .eq("status", "pending")
      .eq("outcome_id", outcome_id)
      .neq("user_id", MARKET_MAKER_ID)
      .eq("type", type === "buying" ? "selling" : "buying")
      .order("created_at", { ascending: true });

    if (matchError) throw matchError;

    let remainingAmount = Number(amount);
    const matchedTrades = [];

    // Process matching orders
    if (matchingOrders && matchingOrders.length > 0) {
      for (const matchingOrder of matchingOrders) {
        const tradeAmount = Math.min(remainingAmount, matchingOrder.amount);

        // Create trade record
        const { error: tradeError } = await supabase.from("trades").insert({
          market_id,
          buyer_order_id: type === "buying" ? newOrder.id : matchingOrder.id,
          seller_order_id: type === "buying" ? matchingOrder.id : newOrder.id,
          amount: tradeAmount,
          price: matchingOrder.price,
          outcome_id,
        });

        if (tradeError) throw tradeError;

        // Update matching order
        const { error: updateMatchError } = await supabase
          .from("orders")
          .update({
            amount: matchingOrder.amount - tradeAmount,
            status:
              matchingOrder.amount - tradeAmount === 0 ? "filled" : "pending",
          })
          .eq("id", matchingOrder.id);

        if (updateMatchError) throw updateMatchError;

        // Update prices with constraint
        await updatePricesWithConstraint(
          outcome_id,
          market_id,
          matchingOrder.price
        );

        matchedTrades.push({
          amount: tradeAmount,
          price: matchingOrder.price,
        });

        remainingAmount -= tradeAmount;
        if (remainingAmount === 0) break;
      }
    }

    // If there's still remaining amount, create a market maker order
    if (remainingAmount > 0) {
      console.log(
        "Creating market maker order for remaining amount:",
        remainingAmount
      );

      // Calculate price with volume impact
      const priceVariation = calculatePriceWithImpact(
        outcome.current_price,
        remainingAmount,
        type
      );

      console.log("Market Maker Price Update:", {
        oldPrice: outcome.current_price,
        newPrice: priceVariation,
        change:
          ((priceVariation - outcome.current_price) / outcome.current_price) *
            100 +
          "%",
      });

      const marketMakerOrder = await createMarketMakerOrder(
        market_id,
        outcome_id,
        remainingAmount,
        priceVariation,
        type
      );

      // Create trade with market maker
      const { error: mmTradeError } = await supabase.from("trades").insert({
        market_id,
        buyer_order_id: type === "buying" ? newOrder.id : marketMakerOrder.id,
        seller_order_id: type === "buying" ? marketMakerOrder.id : newOrder.id,
        amount: remainingAmount,
        price: priceVariation,
        outcome_id,
      });

      if (mmTradeError) throw mmTradeError;

      // Update market maker order status
      const { error: updateMmError } = await supabase
        .from("orders")
        .update({ status: "filled" })
        .eq("id", marketMakerOrder.id);

      if (updateMmError) throw updateMmError;

      // Update prices with constraint
      const { updatedPrice } = await updatePricesWithConstraint(
        outcome_id,
        market_id,
        priceVariation
      );

      console.log("Prices Updated in Database:", {
        outcomeId: outcome_id,
        newPrice: updatedPrice,
        sumCheck: "100%", // Will always sum to 1 now
      });

      matchedTrades.push({
        amount: remainingAmount,
        price: priceVariation,
        market_maker: true,
      });

      remainingAmount = 0;
    }

    // Update the original order's status
    const { error: updateNewOrderError } = await supabase
      .from("orders")
      .update({
        status: remainingAmount === 0 ? "filled" : "pending",
      })
      .eq("id", newOrder.id);

    if (updateNewOrderError) throw updateNewOrderError;

    return NextResponse.json({
      order: newOrder,
      trades: matchedTrades,
      remainingAmount,
    });
  } catch (error: any) {
    console.error("Order processing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process order" },
      { status: 500 }
    );
  }
}
