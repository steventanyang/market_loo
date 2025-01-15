"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import ActivityFeed from "@/components/ActivityFeed";
import MarketIcon from "@/components/MarketIcon";

// Move the PercentageBar and YesNoButtons components from protected/page.tsx here
const PercentageBar = ({ percentage }: { percentage: number }) => (
  <div className="w-full">
    <div className="flex justify-center items-center mb-2">
      <span className="text-white font-bold text-lg">
        {percentage.toFixed(0)}%
      </span>
    </div>
    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
      <div
        className="h-full bg-green-500 rounded-full"
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);

const YesNoButtons = ({
  yesPrice,
  noPrice,
}: {
  yesPrice: number;
  noPrice: number;
}) => (
  <div className="grid grid-cols-2 gap-2 w-full mt-auto">
    <button className="w-full px-3 py-2 bg-green-600/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-600/30 transition">
      Yes {(yesPrice * 100).toFixed(0)}%
    </button>
    <button className="w-full px-3 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 transition">
      No {(noPrice * 100).toFixed(0)}%
    </button>
  </div>
);

interface Market {
  id: string;
  title: string;
  description: string;
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

export default function TradeContent() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchMarkets() {
      const { data, error } = await supabase
        .from("markets")
        .select(
          `
          *,
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
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching markets:", error);
        setError("Error loading markets");
      } else {
        setMarkets(data || []);
      }
    }

    fetchMarkets();
  }, []);

  if (error) return <div>{error}</div>;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {markets.map((market: Market) => {
          const isBinary = market.options.length === 1;
          const yesPrice = isBinary
            ? market.options[0].yes_outcome.current_price
            : 0;

          return (
            <Link href={`/market/${market.id}`} key={market.id}>
              <div className="bg-texture hover-card rounded-lg overflow-hidden border border-gray-700/50 hover:border-gray-500 transition cursor-pointer h-[240px]">
                {/* Market Header */}
                <div className="p-4 flex items-start gap-4">
                  <MarketIcon />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold mb-1 min-h-[3.5rem]">
                      {market.title}
                    </h3>
                  </div>
                </div>

                {/* Market Options */}
                <div className="px-4 pb-4 h-[calc(100%-76px)] flex flex-col">
                  {isBinary ? (
                    <div className="flex flex-col h-full">
                      <div className="flex-grow flex items-center">
                        <PercentageBar percentage={yesPrice * 100} />
                      </div>
                      <div className="mb-4">
                        <YesNoButtons
                          yesPrice={market.options[0].yes_outcome.current_price}
                          noPrice={market.options[0].no_outcome.current_price}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-full">
                      <div className="flex flex-col gap-2 overflow-y-auto hide-scrollbar h-full pb-4">
                        {market.options.map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center justify-between py-2 px-3 bg-[#161920]/80 rounded-lg"
                          >
                            <span className="text-sm font-medium min-w-[100px] mr-4">
                              {option.name}
                            </span>
                            <YesNoButtons
                              yesPrice={option.yes_outcome.current_price}
                              noPrice={option.no_outcome.current_price}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#1c1f28] via-[#1c1f28]/80 to-transparent pointer-events-none"></div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="flex justify-center mt-8">
        <button className="px-6 py-3 bg-texture hover-card rounded-lg border border-gray-700/50 hover:border-gray-500 text-gray-400 hover:text-white transition-all">
          Show More Markets
        </button>
      </div>

      <ActivityFeed />
    </>
  );
}
