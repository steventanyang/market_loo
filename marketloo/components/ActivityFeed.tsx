"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

// Simplified types
interface ActivityItem {
  id: string;
  type: "buying" | "selling";
  amount: number;
  price: number;
  created_at: string;
}

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  return `${seconds}s ago`;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const supabase = createClient();

    // Simplified fetch query
    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, type, amount, price, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching activities:", error);
        return;
      }

      if (data) {
        setActivities(data);
      }
    };

    // Initial fetch
    fetchActivities();

    // Simple subscription
    const subscription = supabase
      .channel("orders-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const newOrder = payload.new as ActivityItem;
          setActivities((prev) => [newOrder, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
