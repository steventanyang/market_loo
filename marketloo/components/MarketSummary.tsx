"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";

interface MarketSummaryProps {
  marketId: string;
}

interface MarketData {
  title: string;
  description: string;
  status: string;
  created_at: string;
  closes_at: string;
  volume: number;
  total_trades: number;
  unique_traders: number;
  average_trade_size: number;
  options: {
    name: string;
    yes_price: number;
    no_price: number;
  }[];
}

interface SummaryResponse {
  market: MarketData;
  summary: string;
}

export default function MarketSummary({ marketId }: MarketSummaryProps) {
  const [summary, setSummary] = useState<string>("");
  const [displayedSummary, setDisplayedSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState(0);

  // Tokenize effect - now much faster
  useEffect(() => {
    if (summary && displayedSummary.length < summary.length) {
      const chunkSize = Math.max(1, Math.floor(summary.length / 25)); // Show in ~25 chunks
      const timer = setTimeout(() => {
        setDisplayedSummary(
          summary.slice(0, displayedSummary.length + chunkSize)
        );
      }, 10); // Faster interval
      return () => clearTimeout(timer);
    }
  }, [summary, displayedSummary]);

  // Progress bar effect
  useEffect(() => {
    if (loading && progress < 100) {
      const timer = setTimeout(() => {
        setProgress((prev) => Math.min(prev + 2, 100));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [loading, progress]);

  async function generateSummary() {
    try {
      setLoading(true);
      setError("");
      setProgress(0);
      setDisplayedSummary("");

      const response = await fetch(`/api/market-summary?market_id=${marketId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch market summary");
      }

      const data: SummaryResponse = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setProgress(100);
    }
  }

  return (
    <div className="bg-texture hover-card rounded-lg overflow-hidden border border-gray-700/50">
      {/* Loading Bar */}
      {loading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#1c1f28]">
          <div
            className="h-full bg-purple-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold">Market Analysis</h3>
          </div>
          <button
            onClick={generateSummary}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors disabled:opacity-50 border border-purple-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Analysis</span>
              </>
            )}
          </button>
        </div>

        {error ? (
          <div className="mt-4 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            Failed to load market summary: {error}
          </div>
        ) : displayedSummary ? (
          <div className="mt-4 text-gray-300 text-sm leading-relaxed">
            {displayedSummary}
            {displayedSummary.length < summary.length && (
              <span className="animate-pulse">|</span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
