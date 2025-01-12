import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import Link from "next/link";
import Image from "next/image";

// Add this component for the percentage bar
const PercentageBar = ({ percentage }: { percentage: number }) => (
  <div className="flex flex-col items-center">
    <span className="text-white font-bold mb-1">{percentage.toFixed(0)}%</span>
    <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-green-500 rounded-full"
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);

// Add this component for Yes/No buttons
const YesNoButtons = ({
  yesPrice,
  noPrice,
}: {
  yesPrice: number;
  noPrice: number;
}) => (
  <div className="grid grid-cols-2 gap-2 w-full mt-auto">
    <button className="w-full px-3 py-2 bg-green-600/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-600/30 transition">
      Yes {(yesPrice * 100).toFixed(0)}%
    </button>
    <button className="w-full px-3 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 transition">
      No {(noPrice * 100).toFixed(0)}%
    </button>
  </div>
);

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

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map((market: Market) => {
            const isBinary = market.options.length === 1;
            const yesPrice = isBinary
              ? market.options[0].yes_outcome.current_price
              : 0;

            return (
              <Link href={`/market/${market.id}`} key={market.id}>
                <div className="bg-[#2C3038] rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition cursor-pointer h-[200px]">
                  {/* Market Header */}
                  <div className="p-4 flex items-start gap-4">
                    <div className="w-12 h-12 flex-shrink-0">
                      <Image
                        src="/placeholder.png"
                        alt="Market icon"
                        width={48}
                        height={48}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="text-lg font-semibold mb-1 truncate">
                          {market.title}
                        </h3>
                        {isBinary && (
                          <PercentageBar percentage={yesPrice * 100} />
                        )}
                      </div>
                      <div className="text-sm text-gray-400 mb-3">
                        Ends {new Date(market.closes_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Market Options */}
                  <div className="px-4 pb-4 h-[calc(100%-100px)] flex flex-col">
                    {isBinary ? (
                      // Binary market display - pushed to bottom
                      <div className="flex flex-col justify-end h-full">
                        <YesNoButtons
                          yesPrice={market.options[0].yes_outcome.current_price}
                          noPrice={market.options[0].no_outcome.current_price}
                        />
                      </div>
                    ) : (
                      // Multi-option market display - hidden scrollbar
                      <div className="flex flex-col gap-2 overflow-y-auto hide-scrollbar">
                        {market.options.map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center justify-between py-2 px-3 bg-[#1C2127] rounded-lg"
                          >
                            <span className="text-sm font-medium min-w-[100px] mr-4">
                              {option.name}
                            </span>
                            <YesNoButtons
                              yesPrice={option.yes_outcome.current_price}
                              noPrice={option.no_outcome.current_price}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="flex justify-center mt-8">
          <button className="px-6 py-3 bg-[#2C3038] hover:bg-[#363B44] rounded-lg transition">
            Show More Markets
          </button>
        </div>
      </div>
    </div>
  );
}
