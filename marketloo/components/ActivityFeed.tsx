"use client";

import { useEffect, useState, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";
import React from "react";
import Image from "next/image";

interface ActivityItem {
  id: string;
  type: "buying" | "selling";
  amount: number;
  price: number;
  created_at: string;
  user_id: string;
  market_id: string;
  outcome_id: string;
}

interface UserData {
  id: string;
  username: string;
}

interface MarketData {
  id: string;
  title: string;
}

interface OutcomeData {
  outcome_id: string;
  name: string;
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
  // Use the last character of the userId as a consistent index
  const index = parseInt(userId.slice(-1), 16) % colors.length;
  return colors[index];
}

const MARKET_MAKER_ID = process.env.NEXT_PUBLIC_MARKET_MAKER_ID;

const AnimatedActivity = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => <div className={`animate-slideIn ${className}`}>{children}</div>;

export default React.memo(function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [users, setUsers] = useState<Record<string, UserData>>({});
  const [markets, setMarkets] = useState<Record<string, MarketData>>({});
  const [outcomes, setOutcomes] = useState<Record<string, OutcomeData>>({});

  const fetchUserData = async (userIds: string[]) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, username")
      .in("id", userIds);

    if (error) {
      console.error("Error fetching users:", error);
      return;
    }

    const userMap = data.reduce(
      (acc, user) => {
        acc[user.id] = user;
        return acc;
      },
      {} as Record<string, UserData>
    );

    setUsers((prev) => ({ ...prev, ...userMap }));
  };

  const fetchMarketData = async (marketIds: string[]) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("markets")
      .select("id, title")
      .in("id", marketIds);

    if (error) {
      console.error("Error fetching markets:", error);
      return;
    }

    const marketMap = data.reduce(
      (acc, market) => {
        acc[market.id] = market;
        return acc;
      },
      {} as Record<string, MarketData>
    );

    setMarkets((prev) => ({ ...prev, ...marketMap }));
  };

  const fetchOutcomeData = async (outcomeIds: string[]) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("outcomes")
      .select("outcome_id, name")
      .in("outcome_id", outcomeIds);

    if (error) {
      console.error("Error fetching outcomes:", error);
      return;
    }

    const outcomeMap = data.reduce(
      (acc, outcome) => {
        acc[outcome.outcome_id] = outcome;
        return acc;
      },
      {} as Record<string, OutcomeData>
    );

    setOutcomes((prev) => ({ ...prev, ...outcomeMap }));
  };

  useEffect(() => {
    let isSubscribed = true;
    const supabase = createClient();

    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(
            "id, type, amount, price, created_at, user_id, market_id, outcome_id"
          )
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        if (data && isSubscribed) {
          const filtered = data.filter(
            (order) => order.user_id !== MARKET_MAKER_ID
          );
          setActivities(filtered.slice(0, 10));

          // Fetch user, market, and outcome data
          const userIds = Array.from(
            new Set(filtered.map((item) => item.user_id))
          );
          const marketIds = Array.from(
            new Set(filtered.map((item) => item.market_id))
          );
          const outcomeIds = Array.from(
            new Set(filtered.map((item) => item.outcome_id))
          );

          await Promise.all([
            fetchUserData(userIds),
            fetchMarketData(marketIds),
            fetchOutcomeData(outcomeIds),
          ]);
        }
      } catch (e) {
        console.error("Error fetching activities:", e);
      }
    };

    fetchActivities();

    const subscription = supabase
      .channel("orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        async (payload) => {
          const newOrder = payload.new as ActivityItem;
          if (newOrder.user_id !== MARKET_MAKER_ID && isSubscribed) {
            setActivities((prev) => [newOrder, ...prev.slice(0, 9)]);

            // Fetch new user, market, and outcome data if needed
            if (!users[newOrder.user_id]) {
              await fetchUserData([newOrder.user_id]);
            }
            if (!markets[newOrder.market_id]) {
              await fetchMarketData([newOrder.market_id]);
            }
            if (!outcomes[newOrder.outcome_id]) {
              await fetchOutcomeData([newOrder.outcome_id]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-12 bg-texture hover-card rounded-lg border border-gray-700">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
      </div>

      <div className="divide-y divide-gray-700">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="p-6 flex items-start gap-3 animate-slideIn"
          >
            <div className="flex-grow">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    <span className="font-medium">
                      {users[activity.user_id]?.username || "User"}
                    </span>{" "}
                    <span
                      className={
                        activity.type === "buying"
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {activity.type === "buying" ? "bought" : "sold"}
                    </span>{" "}
                    {outcomes[activity.outcome_id]?.name || "Loading..."} at{" "}
                    {Math.round(activity.price * 100)}¢
                  </span>
                  <span className="text-gray-400">
                    (💩 {activity.amount.toFixed(2)})
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  {markets[activity.market_id]?.title || "Loading..."}
                </div>
              </div>
            </div>
            <span className="text-sm text-gray-400 flex-shrink-0">
              {formatTimeAgo(activity.created_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
