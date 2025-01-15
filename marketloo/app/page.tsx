"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import ActivityFeed from "@/components/ActivityFeed";
import { LineChart, Zap, Trophy } from "lucide-react";
import LandingActivityFeed from "@/components/LandingActivityFeed";

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

interface FAQItem {
  question: string;
  answer: string;
  isOpen: boolean;
}

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([
    {
      question: "What is MarketLoo?",
      answer:
        "MarketLoo is a virtual trading platform where you can predict outcomes of various events and trade positions using virtual currency. It's a risk-free way to learn about prediction markets and trading.",
      isOpen: false,
    },
    {
      question: "Is the money real?",
      answer:
        "No, MarketLoo uses virtual currency called POO (Prediction Option Outcomes). You start with 500 POO tokens to trade with. It's completely free and risk-free!",
      isOpen: false,
    },
    {
      question: "How are markets resolved?",
      answer:
        "Markets are resolved based on real-world outcomes. When an event concludes, the market is settled and profits/losses are distributed to traders based on their positions.",
      isOpen: false,
    },
    {
      question: "Can I create my own markets?",
      answer:
        "Currently, markets are created by our team to ensure quality and fairness. We're working on allowing users to create their own markets in the future!",
      isOpen: false,
    },
  ]);

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

  const toggleFAQ = (index: number) => {
    setFaqItems(
      faqItems.map((item, i) => ({
        ...item,
        isOpen: i === index ? !item.isOpen : false,
      }))
    );
  };

  return (
    <main className="min-h-screen bg-[#111318] text-white flex flex-col">
      {/* Hero Section - keeping same blue gradient but ending in darker base */}
      <div className="bg-gradient-to-b from-[#161d35] via-[#1a2033] to-[#111318] pt-20 pb-32 flex-none">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6 text-center">MarketLoo</h1>
          <p className="text-xl text-gray-300 text-center max-w-2xl mx-auto mb-12">
            Your Virtual Trading Playground - Predict, Trade, and Win
          </p>
          <div className="flex justify-center">
            <Link
              href="/sign-in"
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 
              font-semibold py-3 px-8 rounded-lg transition-all duration-200 
              border border-blue-500/50 hover:border-blue-400/50 
              text-base shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 
              backdrop-blur-sm hover:scale-105"
            >
              Start Trading
            </Link>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 -mt-20 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Markets Preview */}
          <div className="lg:col-span-2">
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
                    className="bg-texture hover-card rounded-lg overflow-hidden border border-gray-700/50 hover:border-gray-500 transition cursor-pointer h-[200px]"
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
                            <Link href="/sign-in">
                              <button className="w-full px-3 py-2 bg-green-600/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-600/30 transition">
                                Yes{" "}
                                {(
                                  market.options[0].yes_outcome.current_price *
                                  100
                                ).toFixed(0)}
                                %
                              </button>
                            </Link>
                            <Link href="/sign-in">
                              <button className="w-full px-3 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 transition">
                                No{" "}
                                {(
                                  market.options[0].no_outcome.current_price *
                                  100
                                ).toFixed(0)}
                                %
                              </button>
                            </Link>
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
                                <div className="grid grid-cols-2 gap-2 w-full max-w-[200px]">
                                  <Link href="/sign-in">
                                    <button className="w-full px-3 py-2 bg-green-600/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-600/30 transition">
                                      Yes{" "}
                                      {(
                                        option.yes_outcome.current_price * 100
                                      ).toFixed(0)}
                                      %
                                    </button>
                                  </Link>
                                  <Link href="/sign-in">
                                    <button className="w-full px-3 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 transition">
                                      No{" "}
                                      {(
                                        option.no_outcome.current_price * 100
                                      ).toFixed(0)}
                                      %
                                    </button>
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#1c1f28] via-[#1c1f28]/80 to-transparent pointer-events-none"></div>
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
            <LandingActivityFeed />
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            {
              title: "Virtual Trading",
              description:
                "Practice trading with virtual currency in a risk-free environment",
              icon: <LineChart className="w-6 h-6 text-blue-400" />,
            },
            {
              title: "Real-Time Updates",
              description: "See market movements and trades as they happen",
              icon: <Zap className="w-6 h-6 text-green-400" />,
            },
            {
              title: "Compete & Learn",
              description:
                "Track your performance and compete with other traders",
              icon: <Trophy className="w-6 h-6 text-purple-400" />,
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-texture hover-card rounded-lg overflow-hidden border border-gray-700/50 hover:border-gray-500 p-8"
            >
              <div className="w-12 h-12 bg-[#363B44] rounded-lg flex items-center justify-center mx-auto mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-32 mb-20">
          <h2 className="text-3xl font-semibold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="bg-texture hover-card rounded-lg border border-gray-700/50"
              >
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[#252931] transition-colors rounded-lg"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="text-lg font-medium">{item.question}</span>
                  <span
                    className={`transform transition-transform duration-200 ${item.isOpen ? "rotate-180" : ""}`}
                  >
                    ▼
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-200 ease-in-out ${
                    item.isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-4 text-gray-400">{item.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
