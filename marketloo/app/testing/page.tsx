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

interface Option {
  id: string;
  market_id: string;
  name: string;
  yes_outcome_id: string;
  no_outcome_id: string;
}

interface FormData {
  market_id: string;
  option_id: string;
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

interface ResolutionFormData {
  market_id: string;
  outcome_id: string;
}

// Add logging utility
const log = (context: string, data: any) => {
  console.log(
    `[${new Date().toISOString()}] ${context}:`,
    JSON.stringify(data, null, 2)
  );
};

export default function TestingPage() {
  const [formData, setFormData] = useState<FormData>({
    market_id: "",
    option_id: "",
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
  const [mode, setMode] = useState<"trading" | "resolution">("trading");
  const [resolutionForm, setResolutionForm] = useState<ResolutionFormData>({
    market_id: "",
    outcome_id: "",
  });
  const [options, setOptions] = useState<Option[]>([]);

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

      // Fetch options
      const { data: optionsData, error: optionsError } = await supabase
        .from("options")
        .select("*");

      if (optionsError) throw optionsError;
      console.log("Fetched options:", optionsData);
      setOptions(optionsData || []);
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

    log("Form submission", { formData });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      log("User verification", { userId: user?.id });

      if (!user) {
        throw new Error("You must be logged in to place orders");
      }

      // Get the session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      log("Session verification", { sessionPresent: !!session });

      if (!session) {
        throw new Error("No active session");
      }

      // Validate the selected option and outcome
      const selectedOption = options.find(
        (opt) => opt.id === formData.option_id
      );
      log("Selected option", { selectedOption });

      if (!selectedOption) {
        throw new Error("Invalid option selected");
      }

      // Verify the outcome belongs to the selected option
      const isValidOutcome =
        selectedOption.yes_outcome_id === formData.outcome_id ||
        selectedOption.no_outcome_id === formData.outcome_id;

      log("Outcome validation", {
        outcomeId: formData.outcome_id,
        isValid: isValidOutcome,
      });

      if (!isValidOutcome) {
        throw new Error("Invalid outcome for selected option");
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
      log("API response", data);

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
        option_id: "",
        outcome_id: "",
        amount: "",
        type: "buying",
      });

      fetchData();
    } catch (err: any) {
      log("Error in handleSubmit", { error: err.message, stack: err.stack });
      setError(err.message);
    }
  };

  const handleMarketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      market_id: e.target.value,
      option_id: "",
      outcome_id: "",
    });
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = options.find((opt) => opt.id === e.target.value);
    setFormData({
      ...formData,
      option_id: e.target.value,
      outcome_id: "",
    });
  };

  const handleResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFeedback("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      const response = await fetch("/api/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(resolutionForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resolve market");
      }

      setFeedback(
        `Market resolved successfully! Winning outcome: ${
          outcomes.find((o) => o.outcome_id === resolutionForm.outcome_id)?.name
        }`
      );

      setResolutionForm({
        market_id: "",
        outcome_id: "",
      });

      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Add this function to calculate order details
  const calculateOrderDetails = () => {
    if (!formData.amount || !formData.outcome_id) return null;

    const outcome = outcomes.find((o) => o.outcome_id === formData.outcome_id);
    if (!outcome) return null;

    const amount = Number(formData.amount);
    const price = outcome.current_price;

    if (formData.type === "buying") {
      const cost = amount * price;
      const totalReturn = amount; // If you win, you get the full amount (1.0)
      const percentageGain = (((totalReturn - cost) / cost) * 100).toFixed(1);
      return {
        cost: cost.toFixed(2),
        totalReturn: totalReturn.toFixed(2),
        percentageGain,
      };
    } else {
      const proceeds = amount * price;
      const maxLoss = amount;
      const percentageLoss = (((maxLoss - proceeds) / proceeds) * 100).toFixed(
        1
      );
      return {
        proceeds: proceeds.toFixed(2),
        totalLoss: maxLoss.toFixed(2),
        percentageLoss,
      };
    }
  };

  return (
    <div className="min-h-screen bg-[#1C2127] text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Testing Interface</h1>

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

      <div className="mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMode("trading")}
            className={`px-4 py-2 rounded ${
              mode === "trading"
                ? "bg-green-500 text-white"
                : "bg-[#2C3038] text-gray-400"
            }`}
          >
            Trading
          </button>
          <button
            onClick={() => setMode("resolution")}
            className={`px-4 py-2 rounded ${
              mode === "resolution"
                ? "bg-blue-500 text-white"
                : "bg-[#2C3038] text-gray-400"
            }`}
          >
            Market Resolution
          </button>
        </div>
      </div>

      {mode === "trading" ? (
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
              <label className="block mb-2">Option</label>
              <select
                value={formData.option_id}
                onChange={handleOptionChange}
                className="w-full p-2 rounded bg-[#1C2127] border border-gray-700"
                required
              >
                <option value="">Select Option</option>
                {options
                  .filter((option) => option.market_id === formData.market_id)
                  .map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
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
                  {formData.option_id &&
                    options
                      .filter((option) => option.id === formData.option_id)
                      .map((option) => [
                        <option
                          key={option.yes_outcome_id}
                          value={option.yes_outcome_id}
                        >
                          Yes
                        </option>,
                        <option
                          key={option.no_outcome_id}
                          value={option.no_outcome_id}
                        >
                          No
                        </option>,
                      ])}
                </select>
                {formData.outcome_id && (
                  <div className="flex items-center bg-[#1C2127] border border-gray-700 rounded px-3">
                    <span className="text-gray-400 mr-2">Current Price:</span>
                    <span className="text-green-400">
                      {
                        outcomes.find(
                          (o) => o.outcome_id === formData.outcome_id
                        )?.current_price
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

          {calculateOrderDetails() && (
            <div className="mt-4 p-4 bg-[#1C2127] rounded">
              {formData.type === "buying" ? (
                <>
                  <p className="text-gray-400">
                    Cost:{" "}
                    <span className="text-red-400">
                      {calculateOrderDetails()?.cost} POO
                    </span>
                  </p>
                  <p className="text-gray-400">
                    Total Return if Win:{" "}
                    <span className="text-green-400">
                      {calculateOrderDetails()?.totalReturn} POO
                    </span>
                    <span className="text-green-400 ml-2">
                      (+{calculateOrderDetails()?.percentageGain}%)
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-400">
                    Immediate Proceeds:{" "}
                    <span className="text-green-400">
                      {calculateOrderDetails()?.proceeds} POO
                    </span>
                  </p>
                  <p className="text-gray-400">
                    Maximum Loss:{" "}
                    <span className="text-red-400">
                      {calculateOrderDetails()?.totalLoss} POO
                    </span>
                    <span className="text-red-400 ml-2">
                      (-{calculateOrderDetails()?.percentageLoss}%)
                    </span>
                  </p>
                </>
              )}
            </div>
          )}

          <button
            type="submit"
            className="mt-6 bg-green-500 hover:bg-green-600 px-6 py-2 rounded transition-colors"
          >
            Place Order
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleResolution}
          className="bg-[#2C3038] p-6 rounded-lg mb-8"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Market to Resolve</label>
              <select
                value={resolutionForm.market_id}
                onChange={(e) =>
                  setResolutionForm({
                    ...resolutionForm,
                    market_id: e.target.value,
                    outcome_id: "", // Reset outcome when market changes
                  })
                }
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
              <label className="block mb-2">Winning Outcome</label>
              <select
                value={resolutionForm.outcome_id}
                onChange={(e) =>
                  setResolutionForm({
                    ...resolutionForm,
                    outcome_id: e.target.value,
                  })
                }
                className="w-full p-2 rounded bg-[#1C2127] border border-gray-700"
                required
              >
                <option value="">Select Winning Outcome</option>
                {outcomes
                  .filter(
                    (outcome) => outcome.market_id === resolutionForm.market_id
                  )
                  .map((outcome) => (
                    <option key={outcome.outcome_id} value={outcome.outcome_id}>
                      {outcome.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded transition-colors"
          >
            Resolve Market
          </button>
        </form>
      )}

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
