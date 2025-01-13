"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TopBar() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>("");

  // Fetch user email once when component mounts
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
  }, []); // Only run once on mount

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
      {/* Left side - Larger Marketloo text */}
      <Link href="/" className="text-white text-xl font-semibold">
        Marketloo
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {userEmail && (
          <div className="text-gray-400 text-sm">Hey, {userEmail}!</div>
        )}
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
