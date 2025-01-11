import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import Link from "next/link";

// Mock data for markets (expanded)
const MOCK_MARKETS = [
  {
    id: "1",
    title: "Will BTC reach $100k in 2024?",
    yesPercentage: 62,
    noPercentage: 38,
    volume: "$45k Vol.",
    timeframe: "Monthly",
  },
  {
    id: "2",
    title: "Will ETH merge to PoS in Q1?",
    yesPercentage: 78,
    noPercentage: 22,
    volume: "$32k Vol.",
    timeframe: "Weekly",
  },
  {
    id: 3,
    title: "Will Apple release VR headset?",
    yesPercentage: 89,
    noPercentage: 11,
    volume: "$28k Vol.",
    timeframe: "Monthly",
  },
  {
    id: 4,
    title: "Will Ethereum hit $5k before July 2024?",
    yesPercentage: 71,
    noPercentage: 29,
    volume: "$38k Vol.",
    timeframe: "Monthly",
  },
  {
    id: 5,
    title: "Will SpaceX successfully launch Starship in Q2?",
    yesPercentage: 82,
    noPercentage: 18,
    volume: "$25k Vol.",
    timeframe: "Weekly",
  },
  {
    id: 6,
    title: "Will Solana surpass $150 by end of March?",
    yesPercentage: 65,
    noPercentage: 35,
    volume: "$22k Vol.",
    timeframe: "Weekly",
  },
  {
    id: 7,
    title: "Will Fed cut rates in March 2024?",
    yesPercentage: 45,
    noPercentage: 55,
    volume: "$56k Vol.",
    timeframe: "Monthly",
  },
  {
    id: 8,
    title: "Will NVIDIA stock hit $600 in Q1?",
    yesPercentage: 73,
    noPercentage: 27,
    volume: "$34k Vol.",
    timeframe: "Weekly",
  },
  {
    id: 9,
    title: "Will Trump win Republican nomination?",
    yesPercentage: 84,
    noPercentage: 16,
    volume: "$92k Vol.",
    timeframe: "Monthly",
  },
  {
    id: 10,
    title: "Will ChatGPT-5 launch before June?",
    yesPercentage: 42,
    noPercentage: 58,
    volume: "$18k Vol.",
    timeframe: "Monthly",
  },
  {
    id: 11,
    title: "Will Meta stock reach $500?",
    yesPercentage: 67,
    noPercentage: 33,
    volume: "$29k Vol.",
    timeframe: "Weekly",
  },
  {
    id: 12,
    title: "Will Amazon split its stock in 2024?",
    yesPercentage: 31,
    noPercentage: 69,
    volume: "$15k Vol.",
    timeframe: "Monthly",
  },
  {
    id: 13,
    title: "Will XRP win against SEC?",
    yesPercentage: 76,
    noPercentage: 24,
    volume: "$43k Vol.",
    timeframe: "Monthly",
  },
  {
    id: 14,
    title: "Will Tesla deliver 2M cars in 2024?",
    yesPercentage: 58,
    noPercentage: 42,
    volume: "$31k Vol.",
    timeframe: "Monthly",
  },
  {
    id: 15,
    title: "Will DOJ file antitrust case against Apple?",
    yesPercentage: 63,
    noPercentage: 37,
    volume: "$27k Vol.",
    timeframe: "Weekly",
  },
  {
    id: 16,
    title: "Will Bitcoin ETF reach $10B AUM in Q2?",
    yesPercentage: 69,
    noPercentage: 31,
    volume: "$48k Vol.",
    timeframe: "Monthly",
  },
  {
    id: 17,
    title: "Will Disney+ surpass Netflix subscribers?",
    yesPercentage: 23,
    noPercentage: 77,
    volume: "$19k Vol.",
    timeframe: "Monthly",
  },
  {
    id: 18,
    title: "Will China GDP grow >5% in 2024?",
    yesPercentage: 41,
    noPercentage: 59,
    volume: "$36k Vol.",
    timeframe: "Monthly",
  },
  {
    id: 19,
    title: "Will MSFT market cap exceed $4T?",
    yesPercentage: 72,
    noPercentage: 28,
    volume: "$33k Vol.",
    timeframe: "Weekly",
  },
  {
    id: 20,
    title: "Will Coinbase stock hit $200?",
    yesPercentage: 68,
    noPercentage: 32,
    volume: "$24k Vol.",
    timeframe: "Weekly",
  },
  {
    id: 21,
    title: "Will Reddit IPO in first half 2024?",
    yesPercentage: 77,
    noPercentage: 23,
    volume: "$21k Vol.",
    timeframe: "Monthly",
  },
  {
    id: 22,
    title: "Will AI regulation pass in EU?",
    yesPercentage: 81,
    noPercentage: 19,
    volume: "$17k Vol.",
    timeframe: "Monthly",
  },
  {
    id: 23,
    title: "Will Google launch custom AI chips?",
    yesPercentage: 59,
    noPercentage: 41,
    volume: "$23k Vol.",
    timeframe: "Weekly",
  },
  {
    id: 24,
    title: "Will Apple car project be cancelled?",
    yesPercentage: 47,
    noPercentage: 53,
    volume: "$26k Vol.",
    timeframe: "Monthly",
  },
  {
    id: 25,
    title: "Will Spotify achieve profitability in Q2?",
    yesPercentage: 54,
    noPercentage: 46,
    volume: "$20k Vol.",
    timeframe: "Weekly",
  },
  {
    id: 26,
    title: "Will UK enter recession in 2024?",
    yesPercentage: 61,
    noPercentage: 39,
    volume: "$30k Vol.",
    timeframe: "Monthly",
  },
  {
    id: 27,
    title: "Will OpenAI release GPT-Store?",
    yesPercentage: 88,
    noPercentage: 12,
    volume: "$35k Vol.",
    timeframe: "Weekly",
  },
  {
    id: 28,
    title: "Will Dogecoin reach $1?",
    yesPercentage: 15,
    noPercentage: 85,
    volume: "$40k Vol.",
    timeframe: "Monthly",
  },
  {
    id: 29,
    title: "Will Steam Deck 2 launch in 2024?",
    yesPercentage: 44,
    noPercentage: 56,
    volume: "$16k Vol.",
    timeframe: "Monthly",
  },
  {
    id: 30,
    title: "Will Twitter rebrand back from X?",
    yesPercentage: 12,
    noPercentage: 88,
    volume: "$37k Vol.",
    timeframe: "Monthly",
  },
];

// Mock data for recent activity
const RECENT_ACTIVITY = [
  {
    id: 1,
    user: "Alex",
    action: "bought",
    market: "BTC $100k",
    amount: "$480",
    position: "Yes",
    price: "0.62",
    time: "2m ago",
  },
  // Add more activity items
];

// Mock data for leaderboard
const LEADERBOARD = [
  {
    rank: 1,
    user: "TradingPro",
    profit: "$29,952",
    winRate: "78%",
  },
  // Add more leaderboard entries
];

export default async function ProtectedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-[#1C2127] text-white">
      <TopBar />

      {/* Markets Grid */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_MARKETS.map((market) => (
            <Link href={`/market/${market.id}`} key={market.id}>
              <div className="bg-[#2C3038] rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition cursor-pointer h-full">
                <h3 className="text-xl font-semibold mb-4">{market.title}</h3>

                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-green-600/20 text-green-400 rounded">
                      Yes {market.yesPercentage}%
                    </button>
                    <button className="px-4 py-2 bg-red-600/20 text-red-400 rounded">
                      No {market.noPercentage}%
                    </button>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-400">
                  <span>{market.volume}</span>
                  <span className="mx-2">•</span>
                  <span>{market.timeframe}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Show More Button */}
        <div className="flex justify-center mt-8">
          <button className="px-6 py-3 bg-[#2C3038] hover:bg-[#363B44] rounded-lg transition">
            Show More Markets
          </button>
        </div>

        {/* Testing Button */}
        <div className="flex justify-center mt-4">
          <Link href="/testing">
            <button className="bg-blue-500 text-white p-2 rounded">
              Testing
            </button>
          </Link>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {/* Recent Activity */}
          <div className="bg-[#2C3038] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex justify-between items-center">
              Recent Activity
              <button className="text-sm text-gray-400 hover:text-white">
                See all
              </button>
            </h2>
            <div className="space-y-4">
              {RECENT_ACTIVITY.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{activity.user}</span>
                    <span>{activity.action}</span>
                    <span
                      className={
                        activity.position === "Yes"
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {activity.position}
                    </span>
                    <span>on {activity.market}</span>
                  </div>
                  <div className="text-gray-400">{activity.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-[#2C3038] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex justify-between items-center">
              Top Traders
              <button className="text-sm text-gray-400 hover:text-white">
                See all
              </button>
            </h2>
            <div className="space-y-4">
              {LEADERBOARD.map((trader) => (
                <div
                  key={trader.rank}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">#{trader.rank}</span>
                    <span>{trader.user}</span>
                  </div>
                  <div className="text-green-400">{trader.profit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
