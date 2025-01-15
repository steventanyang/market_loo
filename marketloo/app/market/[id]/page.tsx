import { createClient } from "@/utils/supabase/server";
import TopBar from "@/components/TopBar";
import MarketIcon from "@/components/MarketIcon";
import MarketChart from "@/components/MarketChart";
import { TradingInterface } from "@/components/MarketTrading";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

type MarketParams = Promise<{
  id: string;
}>;

interface MarketPageProps {
  params: MarketParams;
}

export default async function MarketPage(props: MarketPageProps) {
  const { id } = await props.params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch market data
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
    .eq("id", id)
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
    .eq("market_id", id)
    .eq("user_id", user.id);

  if (positionsError) {
    console.error("Error fetching positions:", positionsError);
    return <div>Error loading positions</div>;
  }

  return (
    <div className="min-h-screen bg-[#161920] text-white">
      <TopBar />

      <div className="max-w-7xl mx-auto p-6">
        {/* Market Header */}
        <div className="flex items-center gap-4 mb-8">
          <MarketIcon />
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
            <MarketChart marketId={id} outcomes={market.outcomes} />
          </div>

          <div>
            {market.status === "resolved" ? (
              <div className="bg-[#252931] rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  <h3 className="text-xl font-semibold">Market Resolved</h3>
                </div>
                <p className="text-gray-400 mb-4">
                  This market has been resolved with the following outcome:
                </p>
                <div className="bg-[#161920] rounded-lg p-4">
                  <span className="text-green-400 font-medium">
                    {market.outcome}
                  </span>
                </div>
              </div>
            ) : (
              <TradingInterface marketId={id} userId={user.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
