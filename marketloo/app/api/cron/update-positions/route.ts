import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

interface PositionWithOutcome {
  amount: number;
  outcome_id: string;
  outcomes: {
    current_price: number;
  };
}

export async function GET(request: Request) {
  try {
    const supabase = createClient();

    // Get all users with positions
    const { data: users, error: usersError } = await supabase
      .from("positions")
      .select("user_id")
      .gt("amount", 0)
      .distinct();

    if (usersError) throw usersError;

    // Update each user's position value
    for (const user of users) {
      const { data: positions, error: positionsError } = await supabase
        .from("positions")
        .select(
          `
          amount,
          outcome_id,
          outcomes!inner (
            current_price
          )
        `
        )
        .eq("user_id", user.user_id)
        .gt("amount", 0);

      if (positionsError) throw positionsError;

      const totalValue = positions.reduce(
        (sum: number, position: PositionWithOutcome) => {
          return sum + position.amount * position.outcomes.current_price;
        },
        0
      );

      await supabase
        .from("users")
        .update({ positions: totalValue })
        .eq("id", user.user_id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
