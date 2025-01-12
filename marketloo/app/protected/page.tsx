import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import Link from "next/link";
import Image from "next/image";

interface Market {
  id: string;
  title: string;
  description: string;
  closes_at: string;
  options: {
    id: string;
    name: string;
    yes_outcome: {
      outcome_id: string;
      current_price: number;
    };
    no_outcome: {
      outcome_id: string;
      current_price: number;
    };
  }[];
}

export default async function ProtectedPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch markets with their options and outcomes
  const { data: markets, error } = await supabase
    .from("markets")
    .select(
      `
      *,
      options (
        id,
        name,
        yes_outcome:outcomes!options_yes_outcome_id_fkey (
          outcome_id,
          current_price
        ),
        no_outcome:outcomes!options_no_outcome_id_fkey (
          outcome_id,
          current_price
        )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching markets:", error);
    return <div>Error loading markets</div>;
  }

  return (
    <div className="min-h-screen bg-[#1C2127] text-white">
      <TopBar />

      {/* Markets Grid */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map((market: Market) => (
            <Link href={`/market/${market.id}`} key={market.id}>
              <div className="bg-[#2C3038] rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition cursor-pointer">
                {/* Market Header */}
                <div className="p-4 flex items-start gap-4">
                  <div className="w-12 h-12 flex-shrink-0">
                    <Image
                      src="/placeholder.png" // Replace with your placeholder image
                      alt="Market icon"
                      width={48}
                      height={48}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold mb-1 truncate">
                      {market.title}
                    </h3>
                    <div className="text-sm text-gray-400">
                      Ends {new Date(market.closes_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Scrollable Outcomes */}
                <div className="px-4 pb-4">
                  <div className="overflow-x-auto">
                    <div className="flex gap-2 min-w-min">
                      {market.options.map((option) => (
                        <div
                          key={option.id}
                          className="flex-shrink-0 bg-[#1C2127] rounded-lg p-3 min-w-[160px]"
                        >
                          <div className="text-sm font-medium mb-2">
                            {option.name}
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-green-400">
                              {(option.yes_outcome.current_price * 100).toFixed(
                                0
                              )}
                              %
                            </span>
                            <span className="text-red-400">
                              {(option.no_outcome.current_price * 100).toFixed(
                                0
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Show More Button */}
        <div className="flex justify-center mt-8">
          <button className="px-6 py-3 bg-[#2C3038] hover:bg-[#363B44] rounded-lg transition">
            Show More Markets
          </button>
        </div>
      </div>
    </div>
  );
}
