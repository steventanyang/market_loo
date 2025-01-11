"use client";

import { useState } from "react";
import { Outcome } from "@/types/market"; // We'll need to create this type file

export function OutcomesList({ outcomes }: { outcomes: Outcome[] }) {
  return (
    <div className="space-y-4">
      {outcomes.map((outcome) => (
        <div
          key={outcome.name}
          className="bg-[#2C3038] rounded-lg p-4 border border-gray-700"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <span className="font-semibold">{outcome.name}</span>
              <span className="text-gray-400">{outcome.probability}%</span>
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
  );
}

export function TradingInterface() {
  const [selectedOutcome, setSelectedOutcome] = useState<"Yes" | "No">("Yes");
  const [tradeType, setTradeType] = useState<"Buy" | "Sell">("Buy");
  const [limitPrice, setLimitPrice] = useState("23.2");
  const [shares, setShares] = useState("0");

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
          <label className="text-sm text-gray-400 mb-2 block">Outcome</label>
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
              onClick={() => setLimitPrice((prev) => adjustValue(prev, false))}
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
              onClick={() => setLimitPrice((prev) => adjustValue(prev, true))}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block">Shares</label>
          <div className="flex items-center bg-[#1C2127] rounded-lg">
            <button
              onClick={() => setShares((prev) => adjustValue(prev, false, 1))}
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
              onClick={() => setShares((prev) => adjustValue(prev, true, 1))}
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
  );
}
