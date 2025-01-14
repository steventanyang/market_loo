import { createClient } from "@/utils/supabase/server";
import TopBar from "@/components/TopBar";
import Image from "next/image";
import MarketChart from "@/components/MarketChart";
import { TradingInterface } from "@/components/MarketTrading";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

interface MarketPageProps {
  params: {
    id: string;
  };
}

export default async function MarketPage({ params }: MarketPageProps) {
  // Ensure params.id is resolved at the start of the component
  const resolvedParams = await params;
  const marketId = resolvedParams.id;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Use marketId instead of params.id throughout the component
  const { data: market, error: marketError } = await supabase
    .from("markets")
    .select(
      `
      *,
      outcomes (
        outcome_id,
        name,
        current_price
      )
    `
    )
    .eq("id", marketId)
    .single();

  if (marketError) {
    console.error("Error fetching market:", marketError);
    return <div>Error loading market</div>;
  }

  if (!market) {
    return <div>Market not found</div>;
  }

  // Get user's balance
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("balance_of_poo")
    .eq("id", user.id)
    .single();

  if (userError) {
    console.error("Error fetching user balance:", userError);
    return <div>Error loading user data</div>;
  }

  // Get user's positions for this market
  const { data: positions, error: positionsError } = await supabase
    .from("positions")
    .select("*")
    .eq("market_id", marketId)
    .eq("user_id", user.id);

  if (positionsError) {
    console.error("Error fetching positions:", positionsError);
    return <div>Error loading positions</div>;
  }

  return (
    <div className="min-h-screen bg-[#1C2127] text-white">
      <TopBar />

      <div className="max-w-7xl mx-auto p-6">
        {/* Market Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[#2C3038] rounded-lg flex items-center justify-center">
            <Image
              src="/nfl-logo.png"
              alt="Market icon"
              width={32}
              height={32}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{market.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>${market.volume || 0} Vol.</span>
              <span>•</span>
              <span>
                {market.status === "resolved"
                  ? "Resolved"
                  : `Ends ${new Date(market.closes_at).toLocaleDateString()}`}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <MarketChart marketId={marketId} />
          </div>

          <div>
            {market.status === "resolved" ? (
              <div className="bg-[#2C3038] rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  <h3 className="text-xl font-semibold">Market Resolved</h3>
                </div>
                <p className="text-gray-400 mb-4">
                  This market has been resolved with the following outcome:
                </p>
                <div className="bg-[#1C2127] rounded-lg p-4">
                  <span className="text-green-400 font-medium">
                    {market.outcome}
                  </span>
                </div>
              </div>
            ) : (
              <TradingInterface marketId={marketId} userId={user.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
