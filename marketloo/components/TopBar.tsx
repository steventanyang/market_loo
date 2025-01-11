"use client";

import { Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TopBar() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
      {/* Left side */}
      <div className="flex items-center gap-6">
        <Link href="/" className="text-white font-medium">
          Marketloo
        </Link>
        <div className="relative w-[280px]">
          <input
            type="text"
            placeholder="Search markets"
            className="w-full bg-[#2C3038] border-none rounded-md py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-gray-700"
          />
          <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 text-sm">
        <a
          href="https://vercel.com/new"
          className="flex items-center gap-2 text-white hover:text-gray-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="flex items-center gap-1.5">
            <svg
              aria-label="Triangle"
              role="img"
              viewBox="0 0 74 64"
              className="h-4 w-4"
            >
              <path
                d="M37.5896 0.25L74.5396 64.25H0.639648L37.5896 0.25Z"
                fill="currentColor"
              ></path>
            </svg>
            Deploy to Vercel
          </span>
        </a>
        <div className="text-gray-400">Hey, {userEmail}!</div>
        <button
          onClick={handleSignOut}
          className="bg-[#0066FF] hover:bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
