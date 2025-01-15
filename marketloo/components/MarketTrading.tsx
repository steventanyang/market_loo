"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TradingInterfaceProps {
  marketId: string;
  userId: string;
}

interface Option {
  id: string;
  name: string;
  yes_outcome_id: string;
  no_outcome_id: string;
}

interface Outcome {
  outcome_id: string;
  name: string;
  current_price: number;
}

interface Position {
  id: string;
  amount: number;
  outcome_id: string;
}

export function TradingInterface({ marketId, userId }: TradingInterfaceProps) {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("20");
  const [selectedOutcome, setSelectedOutcome] = useState<{
    id: string;
    price: number;
    name: string;
    optionName?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const supabase = createClient();
  const isBinaryMarket = options.length === 1;

  useEffect(() => {
    fetchData();
  }, [marketId]);

  const fetchData = async () => {
    try {
      // Fetch options and their outcomes for this market
      const { data: optionsData, error: optionsError } = await supabase
        .from("options")
        .select(
          `
          *,
          yes_outcome:outcomes!options_yes_outcome_id_fkey (
            outcome_id,
            name,
            current_price
          ),
          no_outcome:outcomes!options_no_outcome_id_fkey (
            outcome_id,
            name,
            current_price
          )
        `
        )
        .eq("market_id", marketId);

      if (optionsError) throw optionsError;
      setOptions(optionsData || []);

      // Fetch user balance
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("balance_of_poo")
        .eq("id", userId)
        .single();

      if (userError) throw userError;
      setUserBalance(userData?.balance_of_poo || 0);

      // Fetch user's positions for this market
      const { data: positionsData, error: positionsError } = await supabase
        .from("positions")
        .select("*")
        .eq("market_id", marketId)
        .eq("user_id", userId);

      if (positionsError) throw positionsError;
      setPositions(positionsData || []);
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

      // Show confirmation in button
      setOrderConfirmed(true);
      setTimeout(() => {
        setOrderConfirmed(false);
      }, 2000);

      // After successful trade, fetch fresh data
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateOrderDetails = () => {
    if (!selectedOutcome || !amount) return null;

    const numAmount = Number(amount);
    const price = Number(selectedOutcome.price);

    if (activeTab === "buy") {
      const cost = numAmount * price;
      const totalReturn = numAmount;
      const percentageGain = ((totalReturn - cost) / cost) * 100;
      return {
        cost: cost.toFixed(2),
        totalReturn: totalReturn.toFixed(2),
        percentageGain: percentageGain.toFixed(2),
      };
    } else {
      const proceeds = numAmount * price;
      const maxLoss = numAmount;
      const percentageLoss = ((maxLoss - proceeds) / proceeds) * 100;
      return {
        proceeds: proceeds.toFixed(2),
        maxLoss: maxLoss.toFixed(2),
        percentageLoss: percentageLoss.toFixed(2),
      };
    }
  };

  const getPositionAmount = (outcomeId: string) => {
    const position = positions.find((p) => p.outcome_id === outcomeId);
    return position ? position.amount : 0;
  };

  const renderBinaryInterface = () => (
    <div>
      <div className="flex justify-between mb-6">
        {/* Larger Yes/No buttons */}
        <div className="grid grid-cols-2 gap-4 w-[300px]">
          {options[0] && (
            <>
              <button
                onClick={() =>
                  setSelectedOutcome({
                    id: options[0].yes_outcome_id,
                    price: Number(
                      (options[0] as any).yes_outcome.current_price
                    ),
                    name: "Yes",
                  })
                }
                className={cn(
                  "aspect-square px-3 py-2 text-lg font-semibold rounded-lg transition",
                  selectedOutcome?.id === options[0].yes_outcome_id
                    ? activeTab === "buy"
                      ? "bg-green-500/40 text-green-300 border-2 border-green-500/70"
                      : "bg-red-500/40 text-red-300 border-2 border-red-500/70"
                    : "bg-[#1a1e2a] text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500"
                )}
              >
                Yes
              </button>
              <button
                onClick={() =>
                  setSelectedOutcome({
                    id: options[0].no_outcome_id,
                    price: Number((options[0] as any).no_outcome.current_price),
                    name: "No",
                  })
                }
                className={cn(
                  "aspect-square px-3 py-2 text-lg font-semibold rounded-lg transition",
                  selectedOutcome?.id === options[0].no_outcome_id
                    ? activeTab === "buy"
                      ? "bg-red-500/40 text-red-300 border-2 border-red-500/70"
                      : "bg-red-500/40 text-red-300 border-2 border-red-500/70"
                    : "bg-[#1a1e2a] text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500"
                )}
              >
                No
              </button>
            </>
          )}
        </div>

        {/* Enhanced balance and price display */}
        <div className="text-right">
          <div className="mb-2">
            <div className="text-gray-400 text-sm">Balance</div>
            <div className="text-3xl font-bold text-white">
              💩 {userBalance?.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Selection and Position info in smaller boxes below */}
      {selectedOutcome ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-2.5 bg-[#1a1e2a] rounded-lg border border-gray-600">
            <div className="text-sm text-gray-400">Selected</div>
            <div className="text-base font-semibold text-white">
              {selectedOutcome.name}
            </div>
            <div className="text-sm text-gray-400">
              Price: {Number(selectedOutcome.price).toFixed(10)}
            </div>
          </div>

          <div className="p-2.5 bg-[#1a1e2a] rounded-lg border border-gray-600">
            <div className="text-sm text-gray-400">Your Position</div>
            <div className="text-base font-semibold text-white">
              {getPositionAmount(selectedOutcome.id)} Shares
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2.5 bg-[#1a1e2a] rounded-lg border border-gray-600 text-center">
          <div className="text-gray-400">Select an option to start trading</div>
        </div>
      )}
    </div>
  );

  const renderMultiOptionInterface = () => (
    <div className="grid grid-cols-[1fr,1fr] gap-4">
      {/* Left column - scrollable options list */}
      <div className="max-h-[300px] overflow-y-auto pr-4 scrollbar-hide">
        {options.map((option) => (
          <div key={option.id} className="mb-2">
            <div className="text-sm text-gray-400 mb-1">{option.name}</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  setSelectedOutcome({
                    id: option.yes_outcome_id,
                    price: Number((option as any).yes_outcome.current_price),
                    name: "Yes",
                    optionName: option.name,
                  })
                }
                className={cn(
                  "px-3 py-2 text-base font-semibold rounded-lg transition",
                  selectedOutcome?.id === option.yes_outcome_id
                    ? activeTab === "buy"
                      ? "bg-green-500/40 text-green-300 border-2 border-green-500/70"
                      : "bg-red-500/40 text-red-300 border-2 border-red-500/70"
                    : "bg-[#1a1e2a] text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500"
                )}
              >
                Yes
              </button>
              <button
                onClick={() =>
                  setSelectedOutcome({
                    id: option.no_outcome_id,
                    price: Number((option as any).no_outcome.current_price),
                    name: "No",
                    optionName: option.name,
                  })
                }
                className={cn(
                  "px-3 py-2 text-base font-semibold rounded-lg transition",
                  selectedOutcome?.id === option.no_outcome_id
                    ? activeTab === "buy"
                      ? "bg-green-500/40 text-green-300 border-2 border-green-500/70"
                      : "bg-red-500/40 text-red-300 border-2 border-red-500/70"
                    : "bg-[#1a1e2a] text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500"
                )}
              >
                No
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Right column - balance and positions */}
      <div>
        <div className="mb-6">
          <div className="text-gray-400 text-sm mb-1">Balance</div>
          <div className="text-2xl font-bold text-white">
            💩 {userBalance?.toFixed(2)}
          </div>
        </div>

        {selectedOutcome ? (
          <div>
            <div className="mb-4 p-3 bg-[#1a1e2a] rounded-lg border border-gray-600">
              <div className="text-base font-semibold text-white mb-2">
                {selectedOutcome.optionName} - {selectedOutcome.name}
              </div>
              <div className="text-base font-medium text-gray-400">
                Price: {Number(selectedOutcome.price).toFixed(2)}
              </div>
            </div>

            {/* Current Position Section */}
            <div className="p-3 bg-[#1a1e2a] rounded-lg border border-gray-600">
              <div className="text-sm text-gray-400 mb-2">Your Position</div>
              <div className="text-lg font-semibold text-white">
                {selectedOutcome ? getPositionAmount(selectedOutcome.id) : 0}{" "}
                Shares
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-8">
            <div className="text-lg font-medium">
              Select an option to start trading
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Add real-time subscription for position updates
  useEffect(() => {
    const subscription = supabase
      .channel("positions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "positions",
          filter: `market_id=eq.${marketId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [marketId]);

  return (
    <div className="bg-texture hover-card rounded-lg overflow-hidden relative">
      {/* Trading Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab("buy")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition",
            activeTab === "buy"
              ? "text-green-400 border-b-2 border-green-400 bg-green-400/5"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          Buy
        </button>
        <button
          onClick={() => setActiveTab("sell")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition",
            activeTab === "sell"
              ? "text-red-400 border-b-2 border-red-400 bg-red-400/5"
              : "text-gray-400 hover:text-white hover:bg-white/5"
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
          {isBinaryMarket
            ? renderBinaryInterface()
            : renderMultiOptionInterface()}
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Amount</span>
            {userBalance !== null && (
              <span className="text-sm text-gray-400">
                Balance: 💩 {userBalance}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAmount(String(Math.max(0, Number(amount) - 1)))}
              className="p-2 bg-[#1a1e2a] rounded-lg hover:bg-[#232838] border border-gray-600 hover:border-gray-500 transition"
            >
              -
            </button>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-[#1a1e2a] border border-gray-600 hover:border-gray-500 rounded-lg px-3 py-2 text-center"
              min="1"
            />
            <button
              onClick={() => setAmount(String(Number(amount) + 1))}
              className="p-2 bg-[#1a1e2a] rounded-lg hover:bg-[#232838] border border-gray-600 hover:border-gray-500 transition"
            >
              +
            </button>
          </div>
        </div>

        {/* Order Details */}
        {selectedOutcome && amount && (
          <div className="mb-4 p-3 bg-[#1a1e2a] rounded-lg border border-gray-600">
            {activeTab === "buy" ? (
              <>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Cost</span>
                  <span className="text-cyan-200 font-medium">
                    💩 {calculateOrderDetails()?.cost}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Potential return</span>
                  <span className="text-cyan-200 font-medium">
                    💩 {calculateOrderDetails()?.totalReturn} (
                    {calculateOrderDetails()?.percentageGain}%)
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Proceeds</span>
                  <span className="text-cyan-200 font-medium">
                    💩 {calculateOrderDetails()?.proceeds}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Maximum loss</span>
                  <span className="text-cyan-200 font-medium">
                    💩 {calculateOrderDetails()?.maxLoss} (
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
            "w-full py-3 px-4 rounded-lg font-medium transition-all duration-200",
            orderConfirmed
              ? "bg-blue-500/30 text-blue-300 border-2 border-blue-500/70"
              : "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50",
            (!selectedOutcome || loading) && "opacity-50 cursor-not-allowed"
          )}
        >
          {loading ? (
            "Processing..."
          ) : orderConfirmed ? (
            <div className="flex items-center justify-center gap-2 animate-fade-in">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Order Confirmed
            </div>
          ) : (
            "Place Order"
          )}
        </button>
      </div>
    </div>
  );
}
