import Link from "next/link";

interface Market {
  id: string;
  question: string;
  yesPercentage: number;
  noPercentage: number;
  volume: number;
  timeframe: "Weekly" | "Monthly";
}

const sampleMarkets: Market[] = [
  {
    id: "btc-100k",
    question: "Will BTC reach $100k in 2024?",
    yesPercentage: 62,
    noPercentage: 38,
    volume: 45000,
    timeframe: "Monthly",
  },
  {
    id: "eth-pos",
    question: "Will ETH merge to PoS in Q1?",
    yesPercentage: 78,
    noPercentage: 22,
    volume: 32000,
    timeframe: "Weekly",
  },
  // Add more markets as needed
];

export default async function Home() {
  return (
    <main className="min-h-screen p-4 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-12 text-center">
        MarketLoo: Your Virtual Trading Playground
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sampleMarkets.map((market) => (
          <div
            key={market.id}
            className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-4">{market.question}</h2>

            <div className="flex gap-2 mb-4">
              <span className="bg-green-800/50 text-green-400 px-3 py-1 rounded-full text-sm">
                Yes {market.yesPercentage}%
              </span>
              <span className="bg-red-800/50 text-red-400 px-3 py-1 rounded-full text-sm">
                No {market.noPercentage}%
              </span>
            </div>

            <div className="text-gray-400 text-sm flex justify-between items-center">
              <span>${market.volume.toLocaleString()} Vol.</span>
              <span>{market.timeframe}</span>
            </div>

            <Link
              href="/sign-in"
              className="mt-4 block text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Trade Now
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/sign-in"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Sign In to Trade
        </Link>
      </div>
    </main>
  );
}
