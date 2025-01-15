"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import ProfileStats from "@/components/ProfileStats";

function formatJoinDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds >= 3600) {
    const hours = Math.round(seconds / 3600);
    return `${hours}h ago`;
  }

  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  }

  return `${seconds}s ago`;
}

interface UserData {
  username: string;
  created_at: string;
  balance_of_poo: number;
  profit: number;
  trade_volume: number;
}

interface Trade {
  id: string;
  type: "buying" | "selling";
  amount: number;
  price: number;
  created_at: string;
  market_title: string;
  outcome_name: string;
}

interface Position {
  id: string;
  amount: number;
  market_title: string;
  outcome_name: string;
  current_price: number;
}

function getGradientForUser(userId: string) {
  const colors = [
    "from-blue-600 to-blue-800",
    "from-purple-600 to-purple-800",
    "from-green-600 to-green-800",
    "from-red-600 to-red-800",
    "from-yellow-600 to-yellow-800",
    "from-pink-600 to-pink-800",
    "from-indigo-600 to-indigo-800",
  ];
  const index = parseInt(userId.slice(-1), 16) % colors.length;
  return colors[index];
}

export default function ProfileContent() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch user data
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (userData) {
          setUserData(userData);
        }

        // Fetch recent orders
        const { data: ordersData } = await supabase
          .from("orders")
          .select(`
            *,
            markets(title),
            outcomes(name)
          `)
          .eq('user_id', user.id)
          .neq('status', 'cancelled')
          .order('created_at', { ascending: false })
          .limit(8);

        if (ordersData) {
          const formattedTrades = ordersData.map(order => ({
            id: order.id,
            type: order.type,
            amount: order.amount,
            price: order.price,
            created_at: order.created_at,
            market_title: order.markets.title,
            outcome_name: order.outcomes.name
          }));
          setTrades(formattedTrades);
        }

        // Fetch positions
        const { data: positionsData } = await supabase
          .from("positions")
          .select(`
            *,
            markets(title),
            outcomes(name, current_price)
          `)
          .eq('user_id', user.id)
          .gt('amount', 0);

        if (positionsData) {
          const formattedPositions = positionsData.map(position => ({
            id: position.id,
            amount: position.amount,
            market_title: position.markets.title,
            outcome_name: position.outcomes.name,
            current_price: position.outcomes.current_price
          }));
          setPositions(formattedPositions);
        }
      }
    }

    fetchData();
  }, []);

  if (!userData) return <div>Loading...</div>;

  return (
    <>
      <div className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{userData.username || "User"}</h2>
          <p className="text-gray-400">
            Joined{" "}
            {userData.created_at
              ? formatJoinDate(userData.created_at)
              : "Unknown"}
          </p>
        </div>
      </div>

      <ProfileStats
        positionsValue={userData.balance_of_poo || 0}
        profitLoss={userData.profit || 0}
        volumeTraded={userData.trade_volume || 0}
      />

      <div className="grid grid-cols-2 gap-6 mt-8">
        {/* Recent Activity */}
        <div className="bg-[#2C3038] rounded-lg border border-gray-700">
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-700">
            {trades.map((trade) => (
              <div key={trade.id} className="p-6 flex items-start gap-3">
                <div className="flex-grow">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        <span className="font-medium">{userData.username}</span>{" "}
                        <span className={trade.type === "buying" ? "text-green-400" : "text-red-400"}>
                          {trade.type === "buying" ? "bought" : "sold"}
                        </span>{" "}
                        {trade.outcome_name} at {Math.round(trade.price * 100)}¢
                      </span>
                      <span className="text-gray-400">(${trade.amount.toFixed(2)})</span>
                    </div>
                    <div className="text-sm text-gray-400">{trade.market_title}</div>
                  </div>
                </div>
                <span className="text-sm text-gray-400 flex-shrink-0">
                  {formatTimeAgo(trade.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Positions */}
        <div className="bg-[#2C3038] rounded-lg border border-gray-700">
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold">Current Positions</h2>
          </div>
          <div className="divide-y divide-gray-700">
            {positions.map((position) => (
              <div key={position.id} className="p-6 flex items-start gap-3">
                <div className="flex-grow">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        <span className="font-medium">{position.amount}</span> shares of{" "}
                        <span className="font-medium">{position.outcome_name}</span>
                      </span>
                      <span className="text-gray-400">
                        (${(position.amount * position.current_price).toFixed(2)})
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">{position.market_title}</div>
                  </div>
                </div>
                <span className="text-sm text-gray-400 flex-shrink-0">
                  {Math.round(position.current_price * 100)}¢
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
