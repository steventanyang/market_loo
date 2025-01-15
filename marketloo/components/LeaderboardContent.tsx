"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface VolumeLeader {
  id: string;
  username: string;
  trade_volume: number;
}

interface ProfitLeader {
  id: string;
  username: string;
  balance_of_poo: number;
}

interface PositionLeader {
  id: string;
  username: string;
  positions: number;
}

export default function LeaderboardContent() {
  const [volumeLeaders, setVolumeLeaders] = useState<VolumeLeader[]>([]);
  const [profitLeaders, setProfitLeaders] = useState<ProfitLeader[]>([]);
  const [positionLeaders, setPositionLeaders] = useState<PositionLeader[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLeaderboards() {
      // Fetch top users for each category
      const { data: volumeData } = await supabase
        .from("users")
        .select("id, username, trade_volume")
        .order("trade_volume", { ascending: false })
        .limit(10);

      const { data: profitData } = await supabase
        .from("users")
        .select("id, username, balance_of_poo")
        .order("balance_of_poo", { ascending: false })
        .limit(10);

      const { data: positionData } = await supabase
        .from("users")
        .select("id, username, positions")
        .order("positions", { ascending: false })
        .limit(10);

      if (volumeData) setVolumeLeaders(volumeData);
      if (profitData) setProfitLeaders(profitData);
      if (positionData) setPositionLeaders(positionData);
    }

    fetchLeaderboards();
  }, []);

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Volume Leaders */}
      <div className="bg-[#262B33] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <svg
            className="w-5 h-5 text-blue-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          <h2 className="text-xl font-semibold">Volume</h2>
        </div>

        <div className="space-y-4">
          {volumeLeaders.map((leader, index) => (
            <div key={leader.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 text-gray-400">{index + 1}</span>
                <span>{leader.username}</span>
              </div>
              <span className="text-gray-400">
                ${leader.trade_volume.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Profit Leaders */}
      <div className="bg-[#262B33] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <svg
            className="w-5 h-5 text-green-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
          </svg>
          <h2 className="text-xl font-semibold">Profit</h2>
        </div>

        <div className="space-y-4">
          {profitLeaders.map((leader, index) => (
            <div key={leader.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 text-gray-400">{index + 1}</span>
                <span>{leader.username}</span>
              </div>
              <span className="text-gray-400">
                ${leader.balance_of_poo.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Position Leaders */}
      <div className="bg-[#262B33] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <svg
            className="w-5 h-5 text-purple-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
          <h2 className="text-xl font-semibold">Positions</h2>
        </div>

        <div className="space-y-4">
          {positionLeaders.map((leader, index) => (
            <div key={leader.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 text-gray-400">{index + 1}</span>
                <span>{leader.username}</span>
              </div>
              <span className="text-gray-400">{leader.positions}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
