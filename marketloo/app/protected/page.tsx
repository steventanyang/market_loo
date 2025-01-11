import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import Link from "next/link";

interface Market {
  id: string;
  title: string;
  description: string;
  closes_at: string;
  outcomes: {
    name: string;
    current_price: number;
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

  // Fetch markets with their outcomes
  const { data: markets, error } = await supabase
    .from("markets")
    .select(
      `
      *,
      outcomes (
        name,
        current_price
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
              <div className="bg-[#2C3038] rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition cursor-pointer h-full">
                <h3 className="text-xl font-semibold mb-4">{market.title}</h3>

                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-3">
                    {market.outcomes.map((outcome) => (
                      <button
                        key={outcome.name}
                        className={`px-4 py-2 ${
                          outcome.name === "Yes"
                            ? "bg-green-600/20 text-green-400"
                            : "bg-red-600/20 text-red-400"
                        } rounded`}
                      >
                        {outcome.name}{" "}
                        {(outcome.current_price * 100).toFixed(0)}%
                      </button>
                    ))}
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
