import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import NavigationTabs from "@/components/NavigationTabs";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-[#1C2127] text-white">
      <TopBar />
      <NavigationTabs />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        {/* Add leaderboard content here */}
      </div>
    </div>
  );
}
