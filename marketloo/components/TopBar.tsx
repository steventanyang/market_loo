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
    <div className="flex items-center justify-between px-6 py-4">
      {/* Left side - Larger Marketloo text */}
      <Link href="/" className="text-white text-3xl font-bold tracking-tight">
        Marketloo
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSignOut}
          className="bg-zinc-600 hover:bg-zinc-500 text-white px-4 py-1.5 rounded-md text-sm transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
