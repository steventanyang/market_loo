"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import ActivityFeed from "@/components/ActivityFeed";

interface Market {
  id: string;
  title: string;
  volume: number;
  closes_at: string;
  options: {
    id: string;
    name: string;
    yes_outcome: {
      outcome_id: string;
      current_price: number;
    };
    no_outcome: {
      outcome_id: string;
      current_price: number;
    };
  }[];
}

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchMarkets() {
      const { data, error } = await supabase
        .from("markets")
        .select(
          `
          id,
          title,
          volume,
          closes_at,
          options (
            id,
            name,
            yes_outcome:outcomes!options_yes_outcome_id_fkey (
              outcome_id,
              current_price
            ),
            no_outcome:outcomes!options_no_outcome_id_fkey (
              outcome_id,
              current_price
            )
          )
        `
        )
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(4);

      if (!error && data) {
        setMarkets(data as unknown as Market[]);
      }
    }

    fetchMarkets();
  }, []);

  return (
    <main className="min-h-screen bg-[#1C2127] text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-900/50 to-transparent pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6 text-center">MarketLoo</h1>
          <p className="text-xl text-gray-300 text-center max-w-2xl mx-auto mb-12">
            Your Virtual Trading Playground - Predict, Trade, and Win
          </p>
          <div className="flex justify-center">
            <Link
              href="/sign-in"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors text-lg"
            >
              Start Trading
            </Link>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 -mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Markets Preview */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-semibold mb-6">Popular Markets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {markets.map((market) => {
                const isBinary = market.options.length === 1;
                const yesPrice = isBinary
                  ? market.options[0].yes_outcome.current_price
                  : 0;

                return (
                  <div
                    key={market.id}
                    className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition cursor-pointer h-[200px]"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="text-lg font-semibold mb-1 truncate">
                          {market.title}
                        </h3>
                        {isBinary && (
                          <div className="flex flex-col items-center">
                            <span className="text-white font-bold mb-1">
                              {(yesPrice * 100).toFixed(0)}%
                            </span>
                            <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${yesPrice * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 mb-3">
                        Ends {new Date(market.closes_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Market Options */}
                    <div className="px-4 pb-4 h-[calc(100%-100px)] flex flex-col">
                      {isBinary ? (
                        <div className="flex flex-col justify-end h-full">
                          <div className="grid grid-cols-2 gap-2 w-full mt-auto">
                            <button className="w-full px-3 py-2 bg-green-600/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-600/30 transition">
                              Yes{" "}
                              {(
                                market.options[0].yes_outcome.current_price *
                                100
                              ).toFixed(0)}
                              %
                            </button>
                            <button className="w-full px-3 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 transition">
                              No{" "}
                              {(
                                market.options[0].no_outcome.current_price * 100
                              ).toFixed(0)}
                              %
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 overflow-y-auto hide-scrollbar">
                          {market.options.map((option) => (
                            <div
                              key={option.id}
                              className="flex items-center justify-between py-2 px-3 bg-[#1C2127] rounded-lg"
                            >
                              <span className="text-sm font-medium min-w-[100px] mr-4">
                                {option.name}
                              </span>
                              <div className="grid grid-cols-2 gap-2 w-full max-w-[200px]">
                                <button className="w-full px-3 py-2 bg-green-600/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-600/30 transition">
                                  Yes{" "}
                                  {(
                                    option.yes_outcome.current_price * 100
                                  ).toFixed(0)}
                                  %
                                </button>
                                <button className="w-full px-3 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 transition">
                                  No{" "}
                                  {(
                                    option.no_outcome.current_price * 100
                                  ).toFixed(0)}
                                  %
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-semibold mb-6">Live Activity</h2>
            <ActivityFeed />
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-[#2C3038] p-8 rounded-lg">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              {/* Icon */}
            </div>
            <h3 className="text-xl font-semibold mb-2">Virtual Trading</h3>
            <p className="text-gray-400">
              Practice trading with virtual currency in a risk-free environment
            </p>
          </div>
          <div className="bg-[#2C3038] p-8 rounded-lg">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              {/* Icon */}
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-Time Updates</h3>
            <p className="text-gray-400">
              See market movements and trades as they happen
            </p>
          </div>
          <div className="bg-[#2C3038] p-8 rounded-lg">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              {/* Icon */}
            </div>
            <h3 className="text-xl font-semibold mb-2">Compete & Learn</h3>
            <p className="text-gray-400">
              Track your performance and compete with other traders
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
