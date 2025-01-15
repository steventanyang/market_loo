"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import NavigationTabs from "@/components/NavigationTabs";
import LeaderboardContent from "@/components/LeaderboardContent";
import TradeContent from "@/components/TradeContent";
import ProfileContent from "@/components/ProfileContent";

export default function ProtectedPage() {
  const [activeTab, setActiveTab] = useState("trade");

  const renderContent = () => {
    switch (activeTab) {
      case "leaderboard":
        return <LeaderboardContent />;
      case "trade":
        return <TradeContent />;
      case "profile":
        return <ProfileContent />;
      default:
        return <TradeContent />;
    }
  };

  return (
    <div className="min-h-screen bg-[#161920] text-white">
      <TopBar />
      <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="max-w-7xl mx-auto p-6">{renderContent()}</div>
    </div>
  );
}
