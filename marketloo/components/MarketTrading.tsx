"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TradingInterfaceProps {
  marketId: string;
  userId: string;
}

export function TradingInterface({ marketId, userId }: TradingInterfaceProps) {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("20");
  const [selectedOutcome, setSelectedOutcome] = useState<{
    id: string;
    price: number;
    name: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [userBalance, setUserBalance] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [marketId]);

  const fetchData = async () => {
    try {
      // Fetch outcomes for this market
      const { data: outcomesData, error: outcomesError } = await supabase
        .from("outcomes")
        .select("*")
        .eq("market_id", marketId);

      if (outcomesError) throw outcomesError;
      setOutcomes(outcomesData || []);

      // Fetch user balance
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("balance_of_poo")
        .eq("id", userId)
        .single();

      if (userError) throw userError;
      setUserBalance(userData?.balance_of_poo || 0);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message);
    }
  };

  const handleTrade = async () => {
    if (!selectedOutcome) return;
    setLoading(true);
    setError("");

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
          market_id: marketId,
          outcome_id: selectedOutcome.id,
          amount: Number(amount),
          type: activeTab === "buy" ? "buying" : "selling",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      // Refresh data after successful trade
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateOrderDetails = () => {
    if (!selectedOutcome || !amount) return null;

    const numAmount = Number(amount);
    const price = selectedOutcome.price;

    if (activeTab === "buy") {
      const cost = numAmount * price;
      const totalReturn = numAmount;
      const percentageGain = ((totalReturn - cost) / cost) * 100;
      return {
        cost: cost.toFixed(2),
        totalReturn: totalReturn.toFixed(2),
        percentageGain: percentageGain.toFixed(1),
      };
    } else {
      const proceeds = numAmount * price;
      const maxLoss = numAmount;
      const percentageLoss = ((maxLoss - proceeds) / proceeds) * 100;
      return {
        proceeds: proceeds.toFixed(2),
        maxLoss: maxLoss.toFixed(2),
        percentageLoss: percentageLoss.toFixed(1),
      };
    }
  };

  return (
    <div className="bg-[#2C3038] rounded-lg overflow-hidden">
      {/* Trading Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab("buy")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition",
            activeTab === "buy"
              ? "text-green-400 border-b-2 border-green-400"
              : "text-gray-400 hover:text-white"
          )}
        >
          Buy
        </button>
        <button
          onClick={() => setActiveTab("sell")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition",
            activeTab === "sell"
              ? "text-red-400 border-b-2 border-red-400"
              : "text-gray-400 hover:text-white"
          )}
        >
          Sell
        </button>
      </div>

      {/* Trading Form */}
      <div className="p-4">
        {/* Outcome Selection */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Outcome</span>
            {selectedOutcome && (
              <span className="text-sm text-gray-400">
                Price: {selectedOutcome.price}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {outcomes.map((outcome) => (
              <button
                key={outcome.outcome_id}
                onClick={() =>
                  setSelectedOutcome({
                    id: outcome.outcome_id,
                    price: outcome.current_price,
                    name: outcome.name,
                  })
                }
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-lg transition",
                  selectedOutcome?.id === outcome.outcome_id
                    ? activeTab === "buy"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                    : "bg-[#1C2127] text-gray-400 hover:text-white"
                )}
              >
                {outcome.name}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Amount</span>
            {userBalance !== null && (
              <span className="text-sm text-gray-400">
                Balance: {userBalance} POO
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAmount(String(Math.max(0, Number(amount) - 1)))}
              className="p-2 bg-[#1C2127] rounded-lg hover:bg-[#363B44] transition"
            >
              -
            </button>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-[#1C2127] border border-gray-700 rounded-lg px-3 py-2 text-center"
              min="1"
            />
            <button
              onClick={() => setAmount(String(Number(amount) + 1))}
              className="p-2 bg-[#1C2127] rounded-lg hover:bg-[#363B44] transition"
            >
              +
            </button>
          </div>
        </div>

        {/* Order Details */}
        {selectedOutcome && amount && (
          <div className="mb-4 p-3 bg-[#1C2127] rounded-lg">
            {activeTab === "buy" ? (
              <>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Cost</span>
                  <span className="text-red-400">
                    {calculateOrderDetails()?.cost} POO
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Potential return</span>
                  <span className="text-green-400">
                    {calculateOrderDetails()?.totalReturn} POO (
                    {calculateOrderDetails()?.percentageGain}%)
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Proceeds</span>
                  <span className="text-green-400">
                    {calculateOrderDetails()?.proceeds} POO
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Maximum loss</span>
                  <span className="text-red-400">
                    {calculateOrderDetails()?.maxLoss} POO (
                    {calculateOrderDetails()?.percentageLoss}%)
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleTrade}
          disabled={!selectedOutcome || loading}
          className={cn(
            "w-full py-3 px-4 rounded-lg font-medium transition",
            activeTab === "buy"
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-red-500 hover:bg-red-600 text-white",
            (!selectedOutcome || loading) && "opacity-50 cursor-not-allowed"
          )}
        >
          {loading ? "Processing..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}
