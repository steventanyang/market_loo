"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import React from "react";

// Simplified types
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

  // Convert to hours if more than 60 minutes
  if (seconds >= 3600) {
    const hours = Math.round(seconds / 3600);
    return `${hours}h ago`;
  }

  // Convert to minutes if more than 60 seconds
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  }

  // Otherwise show seconds
  return `${seconds}s ago`;
}

// const MARKET_MAKER_ID = process.env.NEXT_PUBLIC_MARKET_MAKER_ID;
const MARKET_MAKER_ID = process.env.NEXT_PUBLIC_MARKET_MAKER_ID;

export default React.memo(function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    let isSubscribed = true; // Add this flag to prevent updates after unmount
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

    // Initial fetch
    fetchActivities();

    // Set up subscription
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

    // Cleanup function
    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array

  return (
    <div className="max-w-2xl mx-auto mt-12 bg-[#2C3038] rounded-lg border border-gray-700">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
      </div>

      <div className="divide-y divide-gray-700">
        {activities.map((activity) => (
          <div key={activity.id} className="p-4">
            <div className="flex items-center gap-1 text-sm">
              <span className="text-gray-400">
                {activity.type === "buying" ? "Buy" : "Sell"}
              </span>
              <span className="font-medium">{activity.price}¢</span>
              <span className="text-gray-400">
                (${activity.amount.toFixed(2)})
              </span>
              <span className="text-xs text-gray-500 ml-2">
                {formatTimeAgo(activity.created_at)}
              </span>
              <span className="text-xs text-gray-400 ml-auto">
                by {activity.user_id.slice(0, 8)}...
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
