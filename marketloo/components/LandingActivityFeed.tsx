"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import React from "react";

interface ActivityItem {
  id: string;
  type: "buying" | "selling";
  amount: number;
  price: number;
  created_at: string;
  user_id: string;
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

function formatUserId(userId: string): string {
  return userId.slice(0, 4);
}

const MARKET_MAKER_ID = process.env.NEXT_PUBLIC_MARKET_MAKER_ID;

export default React.memo(function LandingActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    let isSubscribed = true;
    const supabase = createClient();

    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id, type, amount, price, created_at, user_id")
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        if (data && isSubscribed) {
          const filtered = data.filter(
            (order) => order.user_id !== MARKET_MAKER_ID
          );
          setActivities(filtered.slice(0, 10));
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
        (payload) => {
          const newOrder = payload.new as ActivityItem;
          if (newOrder.user_id !== MARKET_MAKER_ID && isSubscribed) {
            setActivities((prev) => [newOrder, ...prev.slice(0, 9)]);
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
    <div className="bg-[#2C3038] rounded-lg border border-gray-700">
      <div className="divide-y divide-gray-700">
        {activities.map((activity) => (
          <div key={activity.id} className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${activity.type === "buying" ? "text-green-400" : "text-red-400"}`}>
                {activity.type === "buying" ? "Buy" : "Sell"}
              </span>
              <span className="text-sm font-medium">{activity.price}¢</span>
              <span className="text-xs text-gray-400">${activity.amount.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{formatTimeAgo(activity.created_at)}</span>
              <span className="text-gray-400">#{formatUserId(activity.user_id)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}); 