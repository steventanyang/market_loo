"use client";
import { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { createClient } from "@/utils/supabase/client";

interface Outcome {
  outcome_id: string;
  name: string;
  current_price: number;
}

interface PricePoint {
  timestamp: Date;
  price: number;
}

interface PriceHistory {
  recent: PricePoint[];
  sixHour: PricePoint[];
  twelveHour: PricePoint[];
  daily: PricePoint[];
  weekly: PricePoint[];
  all: PricePoint[];
}

interface ChartProps {
  marketId: string;
  outcomes: Outcome[];
}

const TIME_RANGES = [
  { label: "1H", value: "1H", dataKey: "recent" },
  { label: "6H", value: "6H", dataKey: "sixHour" },
  { label: "12H", value: "12H", dataKey: "twelveHour" },
  { label: "1D", value: "1D", dataKey: "daily" },
  { label: "1W", value: "1W", dataKey: "weekly" },
] as const;

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe"];

const formatTimestamp = (timestamp: string, selectedRange: string) => {
  const date = new Date(timestamp);
  switch (selectedRange) {
    case "1H":
      return format(date, "HH:mm");
    case "6H":
    case "12H":
      return format(date, "HH:mm");
    case "1D":
      return format(date, "HH:mm");
    case "1W":
      return format(date, "MMM d HH:mm");
    case "ALL":
      return format(date, "MMM d");
    default:
      return format(date, "MMM d");
  }
};

const CustomTooltip = ({ active, payload, label, selectedRange }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="
        bg-gray-900/90 
        backdrop-blur-sm 
        rounded-lg 
        shadow-[0_8px_16px_rgba(0,0,0,0.4)] 
        border 
        border-gray-700/50 
        p-3 
        transform 
        -translate-y-2
        z-50
      "
      >
        <p className="text-gray-300 text-sm mb-2">
          {formatTimestamp(label, selectedRange)}
        </p>
        {payload.map((entry: any) => (
          <div
            key={entry.dataKey}
            className="flex items-center gap-2 text-gray-100"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium">{entry.name}</span>
            <span>{entry.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function MarketChart({ marketId, outcomes }: ChartProps) {
  const [selectedRange, setSelectedRange] = useState<string>("1H");
  const [priceHistory, setPriceHistory] = useState<{
    [outcomeId: string]: PriceHistory;
  }>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch price history data
  useEffect(() => {
    async function fetchPriceHistory() {
      const supabase = createClient();
      const now = new Date();

      // Define time ranges for queries
      const timeRanges = {
        recent: now.getTime() - 60 * 60 * 1000, // 1 hour ago
        sixHour: now.getTime() - 6 * 60 * 60 * 1000,
        twelveHour: now.getTime() - 12 * 60 * 60 * 1000,
        daily: now.getTime() - 24 * 60 * 60 * 1000,
        weekly: now.getTime() - 7 * 24 * 60 * 60 * 1000,
        all: now.getTime() - 30 * 24 * 60 * 60 * 1000,
      };

      const historyData: { [outcomeId: string]: PriceHistory } = {};

      for (const outcome of outcomes) {
        // Get recent high-resolution data (5-min intervals for last hour)
        const { data: recentData } = await supabase
          .from("recent_price_history")
          .select("price, timestamp")
          .eq("market_id", marketId)
          .eq("outcome_id", outcome.outcome_id)
          .gte("timestamp", new Date(timeRanges.recent).toISOString())
          .order("timestamp", { ascending: true });

        // Get archived hourly data
        const { data: hourlyData } = await supabase
          .from("archived_price_history")
          .select("price, timestamp")
          .eq("market_id", marketId)
          .eq("outcome_id", outcome.outcome_id)
          .eq("interval_type", "1h")
          .gte("timestamp", new Date(timeRanges.weekly).toISOString())
          .order("timestamp", { ascending: true });

        // Get archived 6-hour data
        const { data: sixHourData } = await supabase
          .from("archived_price_history")
          .select("price, timestamp")
          .eq("market_id", marketId)
          .eq("outcome_id", outcome.outcome_id)
          .eq("interval_type", "6h")
          .gte("timestamp", new Date(timeRanges.all).toISOString())
          .order("timestamp", { ascending: true });

        // Transform data into PricePoint format
        const transformData = (data: any[]): PricePoint[] =>
          (data || []).map((point) => ({
            timestamp: new Date(point.timestamp),
            price: point.price,
          }));

        historyData[outcome.outcome_id] = {
          recent: transformData(recentData || []),
          sixHour: transformData(hourlyData?.slice(0, 24) || []),
          twelveHour: transformData(hourlyData?.slice(0, 48) || []),
          daily: transformData(hourlyData?.slice(0, 24) || []),
          weekly: transformData(hourlyData || []),
          all: transformData(sixHourData || []),
        };
      }

      setPriceHistory(historyData);
      setIsLoading(false);
    }

    fetchPriceHistory();
  }, [marketId, outcomes]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const timeRange =
      TIME_RANGES.find((r) => r.value === selectedRange)?.dataKey || "recent";

    // Get all unique timestamps and sort them
    const timestamps = new Set<string>();
    Object.values(priceHistory).forEach((outcomeData: PriceHistory) => {
      outcomeData[timeRange]?.forEach((point) => {
        timestamps.add(point.timestamp.toISOString());
      });
    });

    const sortedTimestamps = Array.from(timestamps).sort();

    // Create a data point for each timestamp
    const points = sortedTimestamps.map((timestamp) => {
      // Start with the timestamp
      const point: { [key: string]: any } = { timestamp };

      // For each timestamp, get all outcome prices at that exact moment
      outcomes.forEach((outcome) => {
        const outcomeData = priceHistory[outcome.outcome_id];
        if (outcomeData?.[timeRange]) {
          const pricePoint = outcomeData[timeRange].find(
            (p) => p.timestamp.toISOString() === timestamp
          );
          // If we have a price for this outcome at this timestamp, add it
          point[`price_${outcome.outcome_id}`] = pricePoint?.price ?? null;
        }
      });

      return point;
    });

    // Ensure we have a continuous line by interpolating missing points
    const interpolatedPoints = points.map((point, index, array) => {
      const result = { ...point };

      // For each outcome
      outcomes.forEach((outcome) => {
        const key = `price_${outcome.outcome_id}`;

        // If this point has no value but we have values before and after,
        // interpolate the value
        if (result[key] === null && index > 0 && index < array.length - 1) {
          const prev = array[index - 1][key];
          const next = array[index + 1][key];
          if (prev !== null && next !== null) {
            result[key] = (prev + next) / 2;
          }
        }
      });

      return result;
    });

    return interpolatedPoints;
  }, [priceHistory, outcomes, selectedRange]);

  if (isLoading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <div className="text-gray-400">Loading price history...</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#2C3038"
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => formatTimestamp(value, selectedRange)}
              stroke="#6B7280"
              tick={{ fill: "#6B7280" }}
              minTickGap={30}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              stroke="#6B7280"
              tick={{ fill: "#6B7280" }}
            />
            <Tooltip
              content={<CustomTooltip selectedRange={selectedRange} />}
              cursor={{ stroke: "#4B5563" }}
              wrapperStyle={{ outline: "none" }}
            />
            <Legend />
            {outcomes.map((outcome, index) => (
              <Line
                key={outcome.outcome_id}
                type="monotone"
                dataKey={`price_${outcome.outcome_id}`}
                name={outcome.name}
                stroke={COLORS[index % COLORS.length]}
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-2">
        {TIME_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => setSelectedRange(range.value)}
            className={`px-4 py-2 rounded-lg transition ${
              selectedRange === range.value
                ? "bg-white text-black"
                : "bg-[#2C3038] text-gray-400 hover:text-white"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}
