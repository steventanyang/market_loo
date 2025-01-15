"use client";
import { useState, useMemo } from "react";
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

interface Outcome {
  outcome_id: string;
  name: string;
  current_price: number;
}

interface PricePoint {
  timestamp: Date;
  price: number;
}

interface TimeSeriesData {
  recent: PricePoint[];
  sixHour: PricePoint[];
  twelveHour: PricePoint[];
  daily: PricePoint[];
  weekly: PricePoint[];
  all: PricePoint[];
}

interface ChartProps {
  data: {
    [outcomeId: string]: TimeSeriesData;
  };
  outcomes: Outcome[];
}

const TIME_RANGES = [
  { label: "1H", value: "1H", dataKey: "recent" },
  { label: "6H", value: "6H", dataKey: "sixHour" },
  { label: "12H", value: "12H", dataKey: "twelveHour" },
  { label: "1D", value: "1D", dataKey: "daily" },
  { label: "1W", value: "1W", dataKey: "weekly" },
  { label: "ALL", value: "ALL", dataKey: "all" },
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
      <div className="bg-white rounded-lg shadow-lg p-3">
        <p className="text-gray-500 text-sm mb-2">
          {formatTimestamp(label, selectedRange)}
        </p>
        {payload.map((entry: any) => (
          <div
            key={entry.dataKey}
            className="flex items-center gap-2 text-gray-900"
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

export default function MarketChart({ data, outcomes }: ChartProps) {
  const [selectedRange, setSelectedRange] = useState<string>("1H");

  // Prepare chart data
  const chartData = useMemo(() => {
    const timeRange =
      TIME_RANGES.find((r) => r.value === selectedRange)?.dataKey || "recent";

    // Get all unique timestamps and sort them
    const timestamps = new Set<string>();
    Object.values(data).forEach((outcomeData: TimeSeriesData) => {
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
        const outcomeData = data[outcome.outcome_id];
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
  }, [data, outcomes, selectedRange]);

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
