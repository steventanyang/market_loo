"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface Order {
  id: string;
  market_id: string;
  user_id: string;
  outcome_id: string;
  amount: number;
  price: number;
  status: "pending" | "filled" | "cancelled";
  created_at: string;
  type: "buying" | "selling";
}

interface Market {
  id: string;
  title: string;
  description?: string;
}

interface Outcome {
  outcome_id: string;
  market_id: string;
  name: string;
  current_price: number;
}

interface FormData {
  market_id: string;
  outcome_id: string;
  amount: string;
  type: "buying" | "selling";
}

interface Trade {
  id: string;
  market_id: string;
  buyer_order_id: string;
  seller_order_id: string;
  amount: number;
  price: number;
  outcome_id: string;
  created_at: string;
}

interface OrderResponse {
  order: Order;
  trades: {
    amount: number;
    price: number;
    market_maker?: boolean;
  }[];
  remainingAmount: number;
  error?: string;
}

interface User {
  id: string;
  balance: number;
  username: string;
  email: string;
}

export default function TestingPage() {
  const [formData, setFormData] = useState<FormData>({
    market_id: "",
    outcome_id: "",
    amount: "",
    type: "buying",
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [error, setError] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [lastOrderResponse, setLastOrderResponse] =
    useState<OrderResponse | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);

  const supabase = createClient();

  // Fetch data
  const fetchData = async () => {
    try {
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      console.log("Fetched orders:", ordersData);
      setOrders(ordersData || []);

      // Fetch markets
      const { data: marketsData, error: marketsError } = await supabase
        .from("markets")
        .select("*");

      if (marketsError) throw marketsError;
      console.log("Fetched markets:", marketsData);
      setMarkets(marketsData || []);

      // Fetch outcomes with explicit columns
      const { data: outcomesData, error: outcomesError } = await supabase
        .from("outcomes")
        .select("*")
        .returns<Outcome[]>();

      console.log("Outcomes query:", outcomesData, outcomesError);

      if (outcomesError) {
        console.error("Outcomes error:", outcomesError);
        throw outcomesError;
      }
      console.log("Fetched outcomes:", outcomesData);
      setOutcomes(outcomesData || []);

      // Fetch trades
      const { data: tradesData, error: tradesError } = await supabase
        .from("trades")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (tradesError) throw tradesError;
      console.log("Fetched trades:", tradesData);
      setTrades(tradesData || []);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    console.log("Market ID changed:", formData.market_id);
    fetchData();

    const ordersSubscription = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        fetchData
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
    };
  }, [formData.market_id]);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);

      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("balance")
          .eq("id", user.id)
          .single();

        if (userData) {
          setUserBalance(userData.balance);
        }
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFeedback("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to place orders");
      }

      // Get the session to access the token
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
          ...formData,
        }),
      });

      const data: OrderResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      setLastOrderResponse(data);

      const tradesSummary = data.trades
        .map(
          (trade) =>
            `${trade.amount} shares at ${trade.price}${trade.market_maker ? " (Market Maker)" : ""}`
        )
        .join(", ");

      setFeedback(
        `Order placed successfully! Trades executed: ${tradesSummary}`
      );

      setFormData({
        market_id: "",
        outcome_id: "",
        amount: "",
        type: "buying",
      });

      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMarketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      market_id: e.target.value,
      outcome_id: "", // Reset outcome when market changes
    });
  };

  return (
    <div className="min-h-screen bg-[#1C2127] text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Order Book Testing Interface</h1>

      {userEmail && (
        <div className="mb-6 text-gray-400">
          Logged in as: <span className="text-white">{userEmail}</span>
        </div>
      )}

      {userBalance !== null && (
        <div className="mb-6 text-gray-400">
          Balance: <span className="text-green-400">{userBalance} POO</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-[#2C3038] p-6 rounded-lg mb-8"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">Market</label>
            <select
              value={formData.market_id}
              onChange={handleMarketChange}
              className="w-full p-2 rounded bg-[#1C2127] border border-gray-700"
              required
            >
              <option value="">Select Market</option>
              {markets.map((market) => (
                <option key={market.id} value={market.id}>
                  {market.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2">Outcome</label>
            <div className="flex gap-2">
              <select
                value={formData.outcome_id}
                onChange={(e) =>
                  setFormData({ ...formData, outcome_id: e.target.value })
                }
                className="flex-1 p-2 rounded bg-[#1C2127] border border-gray-700"
                required
              >
                <option value="">Select Outcome</option>
                {outcomes
                  .filter((outcome) => outcome.market_id === formData.market_id)
                  .map((outcome) => (
                    <option key={outcome.outcome_id} value={outcome.outcome_id}>
                      {outcome.name}
                    </option>
                  ))}
              </select>
              {formData.outcome_id && (
                <div className="flex items-center bg-[#1C2127] border border-gray-700 rounded px-3">
                  <span className="text-gray-400 mr-2">Current Price:</span>
                  <span className="text-green-400">
                    {
                      outcomes.find((o) => o.outcome_id === formData.outcome_id)
                        ?.current_price
                    }
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block mb-2">Amount</label>
            <input
              type="number"
              step="1"
              min="1"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full p-2 rounded bg-[#1C2127] border border-gray-700"
              required
            />
          </div>

          <div>
            <label className="block mb-2">Order Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as "buying" | "selling",
                })
              }
              className="w-full p-2 rounded bg-[#1C2127] border border-gray-700"
              required
            >
              <option value="buying">Buy</option>
              <option value="selling">Sell</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 bg-green-500 hover:bg-green-600 px-6 py-2 rounded transition-colors"
        >
          Place Order
        </button>
      </form>

      {feedback && (
        <div className="bg-green-500/20 text-green-400 p-4 rounded mb-4">
          {feedback}
        </div>
      )}
      {error && (
        <div className="bg-red-500/20 text-red-400 p-4 rounded mb-4">
          {error}
        </div>
      )}

      {lastOrderResponse && (
        <div className="bg-[#2C3038] p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Last Order Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Order Info</h3>
              <p>Status: {lastOrderResponse.order.status}</p>
              <p>Original Amount: {Number(formData.amount)}</p>
              <p>Remaining Amount: {lastOrderResponse.remainingAmount}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Trades</h3>
              {lastOrderResponse.trades.map((trade, index) => (
                <div
                  key={index}
                  className={`p-2 mb-2 rounded ${trade.market_maker ? "bg-blue-500/20" : "bg-green-500/20"}`}
                >
                  <p>Amount: {trade.amount}</p>
                  <p>Price: {trade.price}</p>
                  {trade.market_maker && (
                    <p className="text-blue-400">Market Maker Trade</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Order Book</h2>
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="p-2">Market</th>
                <th className="p-2">Outcome</th>
                <th className="p-2">Type</th>
                <th className="p-2">Price</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-gray-700">
                  <td className="p-2">
                    {markets.find((m) => m.id === order.market_id)?.title}
                  </td>
                  <td className="p-2">
                    {
                      outcomes.find((o) => o.outcome_id === order.outcome_id)
                        ?.name
                    }
                  </td>
                  <td className="p-2">
                    <span
                      className={
                        order.type === "buying"
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {order.type}
                    </span>
                  </td>
                  <td className="p-2">{order.price}</td>
                  <td className="p-2">{order.amount}</td>
                  <td className="p-2">{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Trades</h2>
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="p-2">Market</th>
                <th className="p-2">Outcome</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Price</th>
                <th className="p-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id} className="border-t border-gray-700">
                  <td className="p-2">
                    {markets.find((m) => m.id === trade.market_id)?.title}
                  </td>
                  <td className="p-2">
                    {
                      outcomes.find((o) => o.outcome_id === trade.outcome_id)
                        ?.name
                    }
                  </td>
                  <td className="p-2">{trade.amount}</td>
                  <td className="p-2">{trade.price}</td>
                  <td className="p-2">
                    {new Date(trade.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
