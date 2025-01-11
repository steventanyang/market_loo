import { createClient } from "@supabase/supabase-js";
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

interface User {
  id: string;
  balance: number;
  username: string;
  email: string;
}

interface Position {
  id: string;
  user_id: string;
  market_id: string;
  outcome_id: string;
  amount: number;
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

    // Just get the user's balance
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("balance_of_poo")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "Failed to fetch user balance" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { market_id, outcome_id, amount, type } = body;

    // If selling, check if user has enough shares
    if (type === "selling") {
      const { data: position, error: positionError } = await supabase
        .from("positions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("market_id", market_id)
        .eq("outcome_id", outcome_id)
        .single();

      if (positionError && positionError.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        throw positionError;
      }

      const currentPosition = position?.amount || 0;
      if (currentPosition < amount) {
        return NextResponse.json(
          { error: "Insufficient shares to sell" },
          { status: 400 }
        );
      }
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

    // Calculate total cost
    const totalCost = amount * outcome.current_price;

    // Check if user has enough balance for buying
    if (type === "buying" && userData.balance_of_poo < totalCost) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Create the initial order with the user's ID (not market maker)
    const { data: newOrder, error: insertError } = await supabase
      .from("orders")
      .insert([
        {
          market_id,
          user_id: user.id, // Use actual user ID instead of market maker
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

    // Update user's balance immediately for the initial order
    if (type === "buying") {
      const { error: balanceError } = await supabase
        .from("users")
        .update({ balance_of_poo: userData.balance_of_poo - totalCost })
        .eq("id", user.id);

      if (balanceError) throw balanceError;
    }

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

    // After processing trades, update positions
    for (const trade of matchedTrades) {
      if (type === "buying") {
        // Update buyer position (current user)
        const { data: currentPosition } = await supabase
          .from("positions")
          .select("amount")
          .eq("user_id", user.id)
          .eq("market_id", market_id)
          .eq("outcome_id", outcome_id)
          .single();

        if (currentPosition) {
          // Update existing position
          const { error: updateError } = await supabase
            .from("positions")
            .update({
              amount: currentPosition.amount + trade.amount,
            })
            .eq("user_id", user.id)
            .eq("market_id", market_id)
            .eq("outcome_id", outcome_id);

          if (updateError) throw updateError;
        } else {
          // Create new position
          const { error: insertError } = await supabase
            .from("positions")
            .insert({
              user_id: user.id,
              market_id,
              outcome_id,
              amount: trade.amount,
            });

          if (insertError) throw insertError;
        }

        // Update seller position if not market maker
        if (!trade.market_maker) {
          const sellerId = matchingOrders.find(
            (o) => o.price === trade.price
          )?.user_id;

          if (sellerId) {
            const { data: sellerPosition } = await supabase
              .from("positions")
              .select("amount")
              .eq("user_id", sellerId)
              .eq("market_id", market_id)
              .eq("outcome_id", outcome_id)
              .single();

            if (sellerPosition) {
              const { error: updateError } = await supabase
                .from("positions")
                .update({
                  amount: sellerPosition.amount - trade.amount,
                })
                .eq("user_id", sellerId)
                .eq("market_id", market_id)
                .eq("outcome_id", outcome_id);

              if (updateError) throw updateError;
            } else {
              const { error: insertError } = await supabase
                .from("positions")
                .insert({
                  user_id: sellerId,
                  market_id,
                  outcome_id,
                  amount: -trade.amount,
                });

              if (insertError) throw insertError;
            }
          }
        }
      } else {
        // Selling
        // Update seller position (current user)
        const { data: currentPosition } = await supabase
          .from("positions")
          .select("amount")
          .eq("user_id", user.id)
          .eq("market_id", market_id)
          .eq("outcome_id", outcome_id)
          .single();

        if (currentPosition) {
          const { error: updateError } = await supabase
            .from("positions")
            .update({
              amount: currentPosition.amount - trade.amount,
            })
            .eq("user_id", user.id)
            .eq("market_id", market_id)
            .eq("outcome_id", outcome_id);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from("positions")
            .insert({
              user_id: user.id,
              market_id,
              outcome_id,
              amount: -trade.amount,
            });

          if (insertError) throw insertError;
        }

        // Update buyer position if not market maker
        if (!trade.market_maker) {
          const buyerId = matchingOrders.find(
            (o) => o.price === trade.price
          )?.user_id;

          if (buyerId) {
            const { data: buyerPosition } = await supabase
              .from("positions")
              .select("amount")
              .eq("user_id", buyerId)
              .eq("market_id", market_id)
              .eq("outcome_id", outcome_id)
              .single();

            if (buyerPosition) {
              const { error: updateError } = await supabase
                .from("positions")
                .update({
                  amount: buyerPosition.amount + trade.amount,
                })
                .eq("user_id", buyerId)
                .eq("market_id", market_id)
                .eq("outcome_id", outcome_id);

              if (updateError) throw updateError;
            } else {
              const { error: insertError } = await supabase
                .from("positions")
                .insert({
                  user_id: buyerId,
                  market_id,
                  outcome_id,
                  amount: trade.amount,
                });

              if (insertError) throw insertError;
            }
          }
        }
      }
    }

    // After trades are processed, if it was a sell order, credit the user's account
    if (type === "selling") {
      const totalEarned = matchedTrades.reduce(
        (sum, trade) => sum + trade.amount * trade.price,
        0
      );

      const { error: balanceError } = await supabase
        .from("users")
        .update({ balance_of_poo: userData.balance_of_poo + totalEarned })
        .eq("id", user.id);

      if (balanceError) throw balanceError;
    }

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
