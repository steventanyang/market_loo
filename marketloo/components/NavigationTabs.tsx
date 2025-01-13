"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavigationTabs() {
  const pathname = usePathname();

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="relative flex rounded-lg bg-[#2C3038] p-1">
        {/* Sliding background */}
        <div
          className="absolute h-[calc(100%-8px)] top-1 transition-transform duration-200 ease-out bg-[#1C2127] rounded-md"
          style={{
            width: "calc(100% / 3 - 8px)",
            transform: `translateX(${
              pathname === "/leaderboard"
                ? "4px"
                : pathname === "/profile"
                  ? "calc(200% + 8px)"
                  : "calc(100% + 6px)"
            })`,
          }}
        />

        {/* Navigation buttons */}
        <Link
          href="/leaderboard"
          className={`flex-1 px-4 py-2 text-center text-sm font-medium z-10 transition-colors duration-200 ${
            pathname === "/leaderboard" ? "text-white" : "text-gray-400"
          }`}
        >
          Leaderboard
        </Link>

        <Link
          href="/protected"
          className={`flex-1 px-4 py-2 text-center text-sm font-medium z-10 transition-colors duration-200 ${
            pathname === "/protected" ? "text-white" : "text-gray-400"
          }`}
        >
          Trade
        </Link>

        <Link
          href="/profile"
          className={`flex-1 px-4 py-2 text-center text-sm font-medium z-10 transition-colors duration-200 ${
            pathname === "/profile" ? "text-white" : "text-gray-400"
          }`}
        >
          Profile
        </Link>
      </div>
    </div>
  );
}
