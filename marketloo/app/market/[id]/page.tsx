import { createClient } from "@/utils/supabase/server";
import TopBar from "@/components/TopBar";
import Image from "next/image";
import MarketChart from "@/components/MarketChart";
import { OutcomesList, TradingInterface } from "@/components/MarketTrading";
import { redirect } from "next/navigation";

interface MarketPageProps {
  params: {
    id: string;
  };
}

export default async function MarketPage({ params }: MarketPageProps) {
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
    .eq("id", params.id)
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
    .eq("market_id", params.id)
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
              src="/nfl-logo.png" // We can update this later with dynamic icons
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
                Ends {new Date(market.closes_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <MarketChart data={{ "1H": [] }} lines={[]} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* We'll update this for multi-option markets later */}
          <div className="hidden lg:block">
            <OutcomesList outcomes={[]} />
          </div>

          <TradingInterface
            market={market}
            userBalance={userData.balance_of_poo}
            positions={positions || []}
          />
        </div>
      </div>
    </div>
  );
}
