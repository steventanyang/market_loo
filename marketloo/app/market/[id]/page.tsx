"use client";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import Image from "next/image";
import { useState } from "react";
import MarketChart from "@/components/MarketChart";

interface Outcome {
  name: string;
  probability: number;
  buyPrice: number;
  sellPrice: number;
  volume: string;
}

interface Market {
  id: string;
  title: string;
  icon: string;
  volume: string;
  endDate: string;
  outcomes: Outcome[];
}

// Mock data for testing
const MOCK_MARKET: Market = {
  id: "1",
  title: "Super Bowl Champion 2025",
  icon: "/nfl-logo.png", // You'll need to add this image to public folder
  volume: "$1,110,484,661",
  endDate: "Feb 9, 2025",
  outcomes: [
    {
      name: "Lions",
      probability: 24,
      buyPrice: 24.4,
      sellPrice: 75.9,
      volume: "$10,056,972",
    },
    {
      name: "Chiefs",
      probability: 23,
      buyPrice: 23.2,
      sellPrice: 77.0,
      volume: "$8,692,718",
    },
    {
      name: "Ravens",
      probability: 13,
      buyPrice: 12.9,
      sellPrice: 87.4,
      volume: "$4,632,820",
    },
    {
      name: "Bills",
      probability: 13,
      buyPrice: 12.7,
      sellPrice: 87.4,
      volume: "$6,460,861",
    },
  ],
};

// Helper function to generate dates
const generateDatePoints = (
  startDate: Date,
  numberOfPoints: number,
  intervalMinutes: number
) => {
  return Array.from({ length: numberOfPoints }, (_, i) => {
    const date = new Date(startDate);
    date.setMinutes(
      date.getMinutes() - (numberOfPoints - 1 - i) * intervalMinutes
    );
    return date.toISOString();
  });
};

// Generate sample data for different time ranges
const now = new Date();
const MOCK_CHART_DATA = {
  "1H": generateDatePoints(now, 60, 1).map((timestamp) => ({
    timestamp,
    lions: 24 + Math.random() * 4,
    chiefs: 23 + Math.random() * 2,
    ravens: 12 + Math.random() * 2,
    bills: 12 + Math.random() * 2,
  })),
  "6H": generateDatePoints(now, 72, 5).map((timestamp) => ({
    timestamp,
    lions: 24 + Math.random() * 4,
    chiefs: 23 + Math.random() * 2,
    ravens: 12 + Math.random() * 2,
    bills: 12 + Math.random() * 2,
  })),
  "1D": generateDatePoints(now, 96, 15).map((timestamp) => ({
    timestamp,
    lions: 24 + Math.random() * 4,
    chiefs: 23 + Math.random() * 2,
    ravens: 12 + Math.random() * 2,
    bills: 12 + Math.random() * 2,
  })),
  "1W": generateDatePoints(now, 168, 60).map((timestamp) => ({
    timestamp,
    lions: 24 + Math.random() * 4,
    chiefs: 23 + Math.random() * 2,
    ravens: 12 + Math.random() * 2,
    bills: 12 + Math.random() * 2,
  })),
  "1M": generateDatePoints(now, 30, 24 * 60).map((timestamp) => ({
    timestamp,
    lions: 24 + Math.random() * 4,
    chiefs: 23 + Math.random() * 2,
    ravens: 12 + Math.random() * 2,
    bills: 12 + Math.random() * 2,
  })),
  ALL: [
    {
      timestamp: "2023-10-01T00:00:00Z",
      lions: 24.3,
      chiefs: 23.1,
      ravens: 12.8,
      bills: 12.7,
    },
    {
      timestamp: "2023-11-01T00:00:00Z",
      lions: 25.1,
      chiefs: 22.8,
      ravens: 13.2,
      bills: 12.9,
    },
    {
      timestamp: "2023-12-01T00:00:00Z",
      lions: 27.2,
      chiefs: 23.4,
      ravens: 13.5,
      bills: 13.1,
    },
    {
      timestamp: "2024-01-01T00:00:00Z",
      lions: 28.0,
      chiefs: 23.2,
      ravens: 13.8,
      bills: 13.4,
    },
  ],
};

const CHART_LINES = [
  { key: "lions", color: "#4CAF50", name: "Lions" },
  { key: "chiefs", color: "#2196F3", name: "Chiefs" },
  { key: "ravens", color: "#FF5722", name: "Ravens" },
  { key: "bills", color: "#9C27B0", name: "Bills" },
];

// Add proper type for the page props
interface PageProps {
  params: {
    id: string;
  };
}

// Update the component signature
export default function MarketPage({ params }: PageProps) {
  // State for form controls
  const [selectedOutcome, setSelectedOutcome] = useState<"Yes" | "No">("Yes");
  const [tradeType, setTradeType] = useState<"Buy" | "Sell">("Buy");
  const [limitPrice, setLimitPrice] = useState("23.2");
  const [shares, setShares] = useState("0");

  // Helper function to increment/decrement numeric values
  const adjustValue = (
    value: string,
    increment: boolean,
    step: number = 0.1
  ) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    const newValue = increment ? numValue + step : numValue - step;
    return newValue.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-[#1C2127] text-white">
      <TopBar />

      <div className="max-w-7xl mx-auto p-6">
        {/* Market Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[#2C3038] rounded-lg flex items-center justify-center">
            <Image
              src={MOCK_MARKET.icon}
              alt="Market icon"
              width={32}
              height={32}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{MOCK_MARKET.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{MOCK_MARKET.volume} Vol.</span>
              <span>•</span>
              <span>Ends {MOCK_MARKET.endDate}</span>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <MarketChart data={MOCK_CHART_DATA} lines={CHART_LINES} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Scrollable Outcomes */}
          <div className="space-y-4">
            {MOCK_MARKET.outcomes.map((outcome) => (
              <div
                key={outcome.name}
                className="bg-[#2C3038] rounded-lg p-4 border border-gray-700"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{outcome.name}</span>
                    <span className="text-gray-400">
                      {outcome.probability}%
                    </span>
                  </div>
                  <span className="text-gray-400">{outcome.volume} Vol.</span>
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-2 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition">
                    Buy {outcome.buyPrice}¢
                  </button>
                  <button className="flex-1 px-4 py-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition">
                    Sell {outcome.sellPrice}¢
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Fixed Trading Interface */}
          <div className="bg-[#2C3038] rounded-lg p-6 h-fit sticky top-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                <span className="font-semibold">Chiefs</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTradeType("Buy")}
                  className={`px-4 py-2 rounded-lg transition ${
                    tradeType === "Buy"
                      ? "bg-blue-500 text-white"
                      : "bg-[#1C2127] text-gray-400 hover:text-white"
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setTradeType("Sell")}
                  className={`px-4 py-2 rounded-lg transition ${
                    tradeType === "Sell"
                      ? "bg-blue-500 text-white"
                      : "bg-[#1C2127] text-gray-400 hover:text-white"
                  }`}
                >
                  Sell
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Outcome
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedOutcome("Yes")}
                    className={`flex-1 py-3 rounded-lg transition ${
                      selectedOutcome === "Yes"
                        ? "bg-green-600 text-white"
                        : "bg-[#1C2127] text-gray-400 hover:text-white"
                    }`}
                  >
                    Yes 23.2¢
                  </button>
                  <button
                    onClick={() => setSelectedOutcome("No")}
                    className={`flex-1 py-3 rounded-lg transition ${
                      selectedOutcome === "No"
                        ? "bg-red-600 text-white"
                        : "bg-[#1C2127] text-gray-400 hover:text-white"
                    }`}
                  >
                    No 77.0¢
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Limit Price
                </label>
                <div className="flex items-center bg-[#1C2127] rounded-lg">
                  <button
                    onClick={() =>
                      setLimitPrice((prev) => adjustValue(prev, false))
                    }
                    className="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={`${limitPrice}¢`}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, "");
                      setLimitPrice(value);
                    }}
                    className="flex-1 bg-transparent text-center focus:outline-none"
                  />
                  <button
                    onClick={() =>
                      setLimitPrice((prev) => adjustValue(prev, true))
                    }
                    className="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Shares
                </label>
                <div className="flex items-center bg-[#1C2127] rounded-lg">
                  <button
                    onClick={() =>
                      setShares((prev) => adjustValue(prev, false, 1))
                    }
                    className="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={shares}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setShares(value);
                    }}
                    className="flex-1 bg-transparent text-center focus:outline-none"
                  />
                  <button
                    onClick={() =>
                      setShares((prev) => adjustValue(prev, true, 1))
                    }
                    className="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    +
                  </button>
                </div>
              </div>

              <button className="w-full py-3 bg-blue-500 text-white rounded-lg mt-6 hover:bg-blue-600 transition">
                {tradeType} {selectedOutcome}
              </button>

              <p className="text-xs text-gray-400 text-center">
                By trading, you agree to the Terms of Use
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
