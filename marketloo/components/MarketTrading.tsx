"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface Outcome {
  outcome_id: string;
  name: string;
  current_price: number;
}

interface Market {
  id: string;
  title: string;
  outcomes: Outcome[];
}

interface Position {
  outcome_id: string;
  amount: number;
}

interface TradingInterfaceProps {
  market: Market;
  userBalance: number;
  positions: Position[];
}

export function TradingInterface({
  market,
  userBalance,
  positions,
}: TradingInterfaceProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome | null>(null);
  const [amount, setAmount] = useState("");
  const [orderType, setOrderType] = useState<"buying" | "selling">("buying");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFeedback("");

    if (!selectedOutcome || !amount) {
      setError("Please select an outcome and enter an amount");
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No active session");
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          market_id: market.id,
          outcome_id: selectedOutcome.outcome_id,
          amount: Number(amount),
          type: orderType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      setFeedback("Order placed successfully!");
      setAmount("");

      // Refresh the page to show updated positions
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getCurrentPosition = (outcomeId: string) => {
    const position = positions.find((p) => p.outcome_id === outcomeId);
    return position?.amount || 0;
  };

  return (
    <div className="bg-[#2C3038] p-6 rounded-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Trading</h2>
        <p className="text-gray-400">Balance: {userBalance} POO</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Select Outcome</label>
            <div className="grid grid-cols-2 gap-2">
              {market.outcomes.map((outcome) => (
                <button
                  key={outcome.outcome_id}
                  type="button"
                  onClick={() => setSelectedOutcome(outcome)}
                  className={`p-3 rounded text-left ${
                    selectedOutcome?.outcome_id === outcome.outcome_id
                      ? "bg-blue-500"
                      : "bg-[#1C2127]"
                  }`}
                >
                  <div className="font-semibold">{outcome.name}</div>
                  <div className="text-sm text-gray-400">
                    Price: {(outcome.current_price * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">
                    Position: {getCurrentPosition(outcome.outcome_id)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2">Amount</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 rounded bg-[#1C2127] border border-gray-700"
            />
          </div>

          <div>
            <label className="block mb-2">Order Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType("buying")}
                className={`p-2 rounded ${
                  orderType === "buying" ? "bg-green-500" : "bg-[#1C2127]"
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setOrderType("selling")}
                className={`p-2 rounded ${
                  orderType === "selling" ? "bg-red-500" : "bg-[#1C2127]"
                }`}
              >
                Sell
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded bg-red-500/20 text-red-400">
              {error}
            </div>
          )}

          {feedback && (
            <div className="p-3 rounded bg-green-500/20 text-green-400">
              {feedback}
            </div>
          )}

          <button
            type="submit"
            className="w-full p-3 rounded bg-blue-500 hover:bg-blue-600 transition"
          >
            Place Order
          </button>
        </div>
      </form>
    </div>
  );
}

// We'll update this component later for multi-option markets
export function OutcomesList({ outcomes }: { outcomes: any[] }) {
  return null;
}
