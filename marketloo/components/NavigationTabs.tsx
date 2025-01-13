"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavigationTabs() {
  const pathname = usePathname();

  return (
    <div className="w-full flex justify-center px-4 mb-8">
      <nav className="flex relative rounded-lg bg-[#2C3038] p-1 w-full max-w-[400px]">
        {/* Sliding background */}
        <div
          className="absolute transition-all duration-200 ease-in-out bg-[#1C2127] rounded-md"
          style={{
            width: "33.333333%",
            height: "85%",
            top: "7.5%",
            left:
              pathname === "/leaderboard"
                ? "1%"
                : pathname === "/protected"
                  ? "33.333333%"
                  : "65.666666%",
          }}
        />

        {/* Navigation buttons */}
        <Link
          href="/leaderboard"
          className={`relative py-2 text-sm font-medium rounded-md flex-1 transition-colors duration-200 text-center ${
            pathname === "/leaderboard"
              ? "text-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <span className="px-3">Leaderboard</span>
        </Link>

        <Link
          href="/protected"
          className={`relative py-2 text-sm font-medium rounded-md flex-1 transition-colors duration-200 text-center ${
            pathname === "/protected"
              ? "text-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <span className="px-3">Trade</span>
        </Link>

        <Link
          href="/profile"
          className={`relative py-2 text-sm font-medium rounded-md flex-1 transition-colors duration-200 text-center ${
            pathname === "/profile"
              ? "text-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <span className="px-3">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
