"use client";

interface NavigationTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function NavigationTabs({
  activeTab,
  setActiveTab,
}: NavigationTabsProps) {
  return (
    <div className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#161920]/80">
      <div className="w-full flex justify-center px-4 py-4">
        <nav className="flex relative rounded-lg bg-[#252931] p-1 w-full max-w-[400px]">
          {/* Sliding background */}
          <div
            className="absolute transition-all duration-200 ease-in-out bg-[#161920]/90 rounded-md"
            style={{
              width: "33.333333%",
              height: "85%",
              top: "7.5%",
              left:
                activeTab === "leaderboard"
                  ? "1%"
                  : activeTab === "trade"
                    ? "33.333333%"
                    : "65.666666%",
            }}
          />

          {/* Navigation buttons */}
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`relative py-2 text-sm font-medium rounded-md flex-1 transition-colors duration-200 text-center ${
              activeTab === "leaderboard"
                ? "text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <span className="px-3">Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab("trade")}
            className={`relative py-2 text-sm font-medium rounded-md flex-1 transition-colors duration-200 text-center ${
              activeTab === "trade"
                ? "text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <span className="px-3">Trade</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`relative py-2 text-sm font-medium rounded-md flex-1 transition-colors duration-200 text-center ${
              activeTab === "profile"
                ? "text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <span className="px-3">Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
