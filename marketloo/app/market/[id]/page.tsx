import { createClient } from "@/utils/supabase/client";
import TopBar from "@/components/TopBar";
import Image from "next/image";
import MarketChart from "@/components/MarketChart";
import { OutcomesList, TradingInterface } from "@/components/MarketTrading";
import { Market } from "@/types/market";

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

type MarketPageProps = {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function MarketPage({ params }: MarketPageProps) {
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
          <OutcomesList outcomes={MOCK_MARKET.outcomes} />
          <TradingInterface />
        </div>
      </div>
    </div>
  );
}
