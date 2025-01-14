"use client";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface DataPoint {
  timestamp: string;
  [key: string]: any;
}

interface ChartLine {
  key: string;
  color: string;
  name: string;
}

interface ChartProps {
  marketId: string;
}

const TIME_RANGES = [
  { label: "5M", value: "5M" },
  { label: "30M", value: "30M" },
  { label: "1H", value: "1H" },
  { label: "6H", value: "6H" },
  { label: "12H", value: "12H" },
  { label: "ALL", value: "ALL" },
];

const CustomTooltip = ({ active, payload, label, timeRange }: any) => {
  if (active && payload && payload.length) {
    const getTimeFormat = (range: string) => {
      switch (range) {
        case "1H":
        case "6H":
        case "1D":
          return "MMM d, yyyy HH:mm";
        case "1W":
        case "1M":
          return "MMM d, yyyy";
        case "ALL":
          return "MMM yyyy";
        default:
          return "MMM d, yyyy";
      }
    };

    const yesPrice = payload[0].value;
    const noPrice = 100 - yesPrice;

    return (
      <div className="bg-[#1C2127] border border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-gray-400 text-sm mb-2">
          {format(new Date(label), getTimeFormat(timeRange))}
        </p>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#22C55E" }}
          />
          <span className="text-white">Yes: {yesPrice.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#EF4444" }}
          />
          <span className="text-white">No: {noPrice.toFixed(1)}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function MarketChart({ marketId }: ChartProps) {
  const [selectedRange, setSelectedRange] = useState("ALL");
  const [chartData, setChartData] = useState<{
    data: { [key: string]: DataPoint[] };
    lines: { key: string; color: string; name: string }[];
  }>({
    data: {},
    lines: [],
  });

  const fetchChartData = async () => {
    try {
      const response = await fetch(`/api/markets/${marketId}/chart`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setChartData(data);
    } catch (error) {
      console.error("Failed to fetch chart data:", error);
    }
  };

  useEffect(() => {
    fetchChartData();

    // Set up polling for updates
    const interval = setInterval(fetchChartData, 3000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [marketId]);

  const getTimeFormatter = (range: string) => {
    switch (range) {
      case "5M":
      case "15M":
      case "30M":
      case "1H":
        return (value: string) => format(new Date(value), "HH:mm");
      case "6H":
        return (value: string) => format(new Date(value), "HH:mm");
      case "ALL":
        return (value: string) => format(new Date(value), "MMM d");
      default:
        return (value: string) => format(new Date(value), "MMM d");
    }
  };

  const getTimeFormat = (range: string) => {
    switch (range) {
      case "5M":
      case "15M":
      case "30M":
      case "1H":
      case "6H":
        return "MMM d, yyyy HH:mm";
      case "ALL":
        return "MMM d, yyyy";
      default:
        return "MMM d, yyyy";
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData.data[selectedRange]}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#2C3038"
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={getTimeFormatter(selectedRange)}
              stroke="#6B7280"
              tick={{ fill: "#6B7280" }}
              axisLine={{ stroke: "#2C3038" }}
              minTickGap={30}
            />
            <YAxis
              tickFormatter={(value) => `${value}%`}
              stroke="#6B7280"
              tick={{ fill: "#6B7280" }}
              axisLine={{ stroke: "#2C3038" }}
              domain={[0, 100]}
            />
            <Tooltip
              content={<CustomTooltip timeRange={selectedRange} />}
              isAnimationActive={false}
            />
            {chartData.lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                stroke={line.color}
                name={line.name}
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Time Range Selector */}
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
