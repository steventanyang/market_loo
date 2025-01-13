"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

// Create supabase client outside component to persist between renders
const supabase = createClient();

export default function TopBar() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(
    // Initialize from session if available
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("userEmail") || "null")
      : null
  );

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
        localStorage.setItem("userEmail", JSON.stringify(user.email));
      }
    };

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email || null;
      setUserEmail(email);
      if (email) {
        localStorage.setItem("userEmail", JSON.stringify(email));
      } else {
        localStorage.removeItem("userEmail");
      }
    });

    getUser();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("userEmail");
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
        <div className="text-gray-400 text-sm min-w-[100px]">
          {userEmail ? `Hey, ${userEmail}!` : ""}
        </div>
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
