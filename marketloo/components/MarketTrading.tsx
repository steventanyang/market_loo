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

// Add OrderNotification component
interface NotificationProps {
  message: string;
  onClose: () => void;
}

function OrderNotification({ message, onClose }: NotificationProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-4">
      <span>{message}</span>
      <button onClick={onClose} className="hover:opacity-80">
        ✕
      </button>
    </div>
  );
}

export function TradingInterface({
  market,
  userBalance,
  positions,
}: TradingInterfaceProps) {
  const [shares, setShares] = useState(60);
  const [selectedOutcome, setSelectedOutcome] = useState<"Yes" | "No">("Yes");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderType, setOrderType] = useState<"buying" | "selling">("buying");
  const [notification, setNotification] = useState<string | null>(null);

  const handleIncrement = () => {
    setShares((prev) => prev + 10);
  };

  const handleDecrement = () => {
    setShares((prev) => Math.max(0, prev - 10));
  };

  const getPosition = (outcome_id: string) => {
    return positions.find((p) => p.outcome_id === outcome_id)?.amount || 0;
  };

  const formatPrice = (price: number) => {
    return (price * 100).toFixed(1);
  };

  // Calculate trading metrics based on selected outcome and shares
  const selectedPrice =
    selectedOutcome === "Yes"
      ? market.outcomes[0]?.current_price
      : market.outcomes[1]?.current_price;

  const avgPrice = selectedPrice * 100; // Convert to cents
  const totalShares = shares;
  const potentialReturn = shares * (1 - selectedPrice);
  const potentialReturnPercentage = (
    (potentialReturn / (shares * selectedPrice)) *
    100
  ).toFixed(0);

  const handlePlaceOrder = async () => {
    try {
      setIsPlacingOrder(true);
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const orderData = {
        market_id: market.id,
        outcome_id:
          selectedOutcome === "Yes"
            ? market.outcomes[0].outcome_id
            : market.outcomes[1].outcome_id,
        amount: shares,
        type: orderType,
      };
      console.log("ORDER DATA:");
      console.log(market.outcomes); // Log the order data

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to place order");
      }

      const result = await response.json();
      console.log("Order placed successfully:", result);

      // Reset shares to default
      setShares(60);

      // Show notification
      setNotification(
        `Successfully ${orderType === "buying" ? "bought" : "sold"} ${shares} shares of ${selectedOutcome}`
      );

      // Auto-hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    } catch (error: any) {
      console.error("Error placing order:", error);
      setNotification(error.message || "Failed to place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="bg-[#1C2127] p-6 rounded-lg">
      <div className="mb-8 text-center">
        <h2 className="text-gray-400 font-bold mb-2">Available Balance</h2>
        <div className="text-3xl font-bold text-white">
          ${userBalance.toFixed(2)}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-white font-bold mb-4">Outcome</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <button
              className={`p-4 rounded font-bold relative overflow-hidden transition-all duration-200 ${
                selectedOutcome === "Yes"
                  ? "bg-green-600/80 text-white"
                  : "bg-[#2C3038] text-gray-300"
              }`}
              onClick={() => setSelectedOutcome("Yes")}
            >
              <div className="relative z-10 transition-opacity duration-200">
                Yes {formatPrice(market.outcomes[0]?.current_price)}¢
              </div>
              <div
                className={`absolute inset-0 bg-green-600/80 transition-transform duration-300 ${
                  selectedOutcome === "Yes"
                    ? "translate-x-0"
                    : "-translate-x-full"
                }`}
              />
            </button>
            <div className="text-sm text-gray-400 font-bold text-center">
              Position: {getPosition(market.outcomes[0].outcome_id)}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              className={`p-4 rounded font-bold relative overflow-hidden transition-all duration-200 ${
                selectedOutcome === "No"
                  ? "bg-red-600/80 text-white"
                  : "bg-[#2C3038] text-gray-300"
              }`}
              onClick={() => setSelectedOutcome("No")}
            >
              <div className="relative z-10 transition-opacity duration-200">
                No {formatPrice(market.outcomes[1]?.current_price)}¢
              </div>
              <div
                className={`absolute inset-0 bg-red-600/80 transition-transform duration-300 ${
                  selectedOutcome === "No"
                    ? "translate-x-0"
                    : "translate-x-full"
                }`}
              />
            </button>
            <div className="text-sm text-gray-400 font-bold text-center">
              Position: {getPosition(market.outcomes[1].outcome_id)}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-[#2C3038] p-1 rounded relative">
          <div className="grid grid-cols-2 relative z-10">
            <button
              className={`py-2 rounded font-bold transition-colors duration-200 relative z-10 ${
                orderType === "buying" ? "text-white" : "text-gray-400"
              }`}
              onClick={() => setOrderType("buying")}
            >
              Buy
            </button>
            <button
              className={`py-2 rounded font-bold transition-colors duration-200 relative z-10 ${
                orderType === "selling" ? "text-white" : "text-gray-400"
              }`}
              onClick={() => setOrderType("selling")}
            >
              Sell
            </button>
          </div>
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded bg-blue-500 transition-transform duration-300 ease-in-out ${
              orderType === "selling"
                ? "translate-x-[calc(100%+8px)]"
                : "translate-x-0"
            }`}
          />
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-white font-bold mb-2">Shares</h2>
        <div className="flex items-center bg-[#2C3038] rounded p-2">
          <button
            onClick={handleDecrement}
            className="px-4 py-2 text-gray-400 hover:text-white font-bold text-lg"
          >
            −
          </button>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(Number(e.target.value))}
            className="flex-1 bg-transparent text-center text-white font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={handleIncrement}
            className="px-4 py-2 text-gray-400 hover:text-white font-bold text-lg"
          >
            +
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-sm font-bold">
          <span className="text-gray-400">Avg price</span>
          <span className="text-blue-400">{avgPrice.toFixed(1)}¢</span>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span className="text-gray-400">Shares</span>
          <span className="text-white">{totalShares}</span>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span className="text-gray-400">Potential return</span>
          <span className="text-green-500">
            ${potentialReturn.toFixed(2)} ({potentialReturnPercentage}%)
          </span>
        </div>
      </div>

      <button
        onClick={handlePlaceOrder}
        disabled={isPlacingOrder}
        className={`w-full bg-blue-500 text-white rounded py-3 hover:bg-blue-600 font-bold
          ${isPlacingOrder ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isPlacingOrder
          ? "Placing Order..."
          : `Place ${orderType === "buying" ? "Buy" : "Sell"} Order`}
      </button>

      {notification && (
        <OrderNotification
          message={notification}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

// You can keep or modify the OutcomesList component as needed
export function OutcomesList({ outcomes }: { outcomes: any[] }) {
  return (
    <div className="bg-[#1C2127] p-6 rounded-lg">
      {/* Outcome list content */}
    </div>
  );
}
