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

interface UserData {
  username: string;
  created_at: string;
  balance_of_poo: number;
  profit: number;
  trade_volume: number;
}

export default function ProfileContent() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) {
          setUserData(data);
        }
      }
    }

    fetchUserData();
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
    </>
  );
}
