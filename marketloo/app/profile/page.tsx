import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import NavigationTabs from "@/components/NavigationTabs";
import ProfileStats from "@/components/ProfileStats";

// Helper function to format the date
function formatJoinDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short',
    year: 'numeric'
  });
}

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user data including stats and created_at
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#1C2127] text-white">
      <TopBar />
      <NavigationTabs />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden">
            {/* Placeholder avatar */}
            <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{userData?.username || 'User'}</h2>
            <p className="text-gray-400">
              Joined {userData?.created_at ? formatJoinDate(userData.created_at) : 'Unknown'}
            </p>
          </div>
        </div>
        
        <ProfileStats 
          positionsValue={userData?.balance_of_poo || 0}
          profitLoss={userData?.profit || 0}
          volumeTraded={userData?.trade_volume || 0}
        />
      </div>
    </div>
  );
}
