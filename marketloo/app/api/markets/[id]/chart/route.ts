import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  subHours,
  subMinutes,
  addMinutes,
  isAfter,
  isBefore,
  parseISO,
} from "date-fns";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function generate5MinuteIntervals(startDate: Date, endDate: Date) {
  const intervals = [];
  let currentDate = startDate;

  while (
    isBefore(currentDate, endDate) ||
    currentDate.getTime() === endDate.getTime()
  ) {
    intervals.push(currentDate);
    currentDate = addMinutes(currentDate, 5);
  }

  return intervals;
}

function generateFakeDataPoints(
  startTime: Date,
  endTime: Date,
  initialPrice: number = 50
) {
  const intervals = generate5MinuteIntervals(startTime, endTime);
  const dataPoints = [];
  let lastPrice = initialPrice;
  let trend = 0; // Current trend strength (-1 to 1)
  let volatility = 0.5; // Base volatility

  for (const timestamp of intervals) {
    // Randomly adjust trend (mean reversion)
    if (Math.random() < 0.1) {
      // 10% chance to change trend
      trend = (Math.random() - 0.5) * 2; // New random trend between -1 and 1
    }

    // Randomly adjust volatility
    if (Math.random() < 0.05) {
      // 5% chance to change volatility
      volatility = 0.1 + Math.random() * 0.9; // Random volatility between 0.1 and 1
    }

    // Calculate price change
    const trendComponent = trend * 0.5; // Trend influence
    const randomComponent = (Math.random() - 0.5) * volatility * 2; // Random noise
    const meanReversion = (50 - lastPrice) * 0.01; // Slight pull toward 50
    const totalChange = trendComponent + randomComponent + meanReversion;

    // Apply the change
    let newPrice = lastPrice + totalChange;

    // Ensure price stays within bounds and add some resistance near boundaries
    if (newPrice < 10) {
      newPrice = 10 + Math.random() * 5; // Bounce off lower bound
      trend = Math.abs(trend); // Reverse trend if hitting lower bound
    } else if (newPrice > 90) {
      newPrice = 90 - Math.random() * 5; // Bounce off upper bound
      trend = -Math.abs(trend); // Reverse trend if hitting upper bound
    }

    dataPoints.push({
      timestamp: timestamp.toISOString(),
      price: newPrice,
    });

    lastPrice = newPrice;
  }

  // Add final point with similar logic
  const finalChange = (Math.random() - 0.5) * volatility + trend * 0.5;
  let finalPrice = Math.max(10, Math.min(90, lastPrice + finalChange));

  dataPoints.push({
    timestamp: endTime.toISOString(),
    price: finalPrice,
  });

  return dataPoints;
}

function findClosestPrice(
  timestamp: Date,
  trades: any[],
  outcome_id: string,
  initialPrice: number
) {
  // Find the latest trade before this timestamp
  const previousTrades = trades.filter(
    (trade) =>
      trade.outcome_id === outcome_id &&
      isBefore(parseISO(trade.created_at), timestamp)
  );

  if (previousTrades.length === 0) {
    return initialPrice;
  }

  // Get the most recent trade
  const latestTrade = previousTrades[previousTrades.length - 1];
  return latestTrade.price * 100;
}

// Update the Params interface to match Next.js expectations
interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const marketId = resolvedParams.id;
    const now = new Date();
    const marketStart = subHours(now, 24);

    const timeRanges = {
      "5M": subMinutes(now, 5),
      "30M": subMinutes(now, 30),
      "1H": subHours(now, 1),
      "6H": subHours(now, 6),
      "12H": subHours(now, 12),
      ALL: marketStart,
    };

    try {
      // Try to get real data first
      const { data: market } = await supabase
        .from("markets")
        .select("*")
        .eq("id", marketId)
        .single();

      if (market) {
        const { data: options } = await supabase
          .from("options")
          .select(
            `
            yes_outcome_id,
            outcomes!inner (
              outcome_id,
              name,
              initial_price,
              current_price
            )
          `
          )
          .eq("market_id", marketId)
          .eq("outcomes.outcome_id", "options.yes_outcome_id")
          .limit(1);

        if (options && options.length > 0) {
          const option = options[0];
          const outcome = option.outcomes[0];

          const { data: trades } = await supabase
            .from("trades")
            .select("*")
            .eq("market_id", marketId)
            .eq("outcome_id", option.yes_outcome_id)
            .order("created_at", { ascending: true });

          if (trades && trades.length > 0) {
            // Use real data if available
            const priceHistory: { [key: string]: any[] } = {};

            Object.entries(timeRanges).forEach(([range, startTime]) => {
              const intervals = generate5MinuteIntervals(startTime, now);

              priceHistory[range] = intervals.map((timestamp) => ({
                timestamp: timestamp.toISOString(),
                price: findClosestPrice(
                  timestamp,
                  trades,
                  option.yes_outcome_id,
                  outcome.initial_price
                ),
              }));

              if (isAfter(now, intervals[intervals.length - 1])) {
                priceHistory[range].push({
                  timestamp: now.toISOString(),
                  price: outcome.current_price * 100,
                });
              }
            });

            return NextResponse.json({
              data: priceHistory,
              lines: [{ key: "price", name: "Yes", color: "#22C55E" }],
            });
          }
        }
      }

      // If we get here, generate fake data
      const priceHistory: { [key: string]: any[] } = {};
      const startPrice = 50;

      Object.entries(timeRanges).forEach(([range, startTime]) => {
        priceHistory[range] = generateFakeDataPoints(
          startTime,
          now,
          startPrice
        );
      });

      return NextResponse.json({
        data: priceHistory,
        lines: [{ key: "price", name: "Yes", color: "#22C55E" }],
      });
    } catch (error) {
      // If anything fails, return fake data
      const priceHistory: { [key: string]: any[] } = {};
      const startPrice = 50;

      Object.entries(timeRanges).forEach(([range, startTime]) => {
        priceHistory[range] = generateFakeDataPoints(
          startTime,
          now,
          startPrice
        );
      });

      return NextResponse.json({
        data: priceHistory,
        lines: [{ key: "price", name: "Yes", color: "#22C55E" }],
      });
    }
  } catch (error: any) {
    console.error("Chart API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
