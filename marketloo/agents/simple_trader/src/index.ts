import { createClient } from "@supabase/supabase-js";
import { placeOrder } from "../../common/utils";

class SimpleTraderAgent {
  private supabase;
  private session: any = null;

  constructor() {
    this.supabase = createClient(
      "https://qrqxgmpbqnppfqbwjqky.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycXhnbXBicW5wcGZxYndqcWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk2NzE3ODUsImV4cCI6MjAyNTI0Nzc4NX0.qG5kLERX6jMVVEyeKOKu1mLvJGa1R1-YL6y4w6oXgpE"
    );
  }

  async initialize() {
    try {
      // Register agent and get session
      const response = await fetch(
        "https://market-loo.vercel.app/api/agents/auth",
        {
          method: "POST",
          headers: {
            "x-agent-key": "qXTkEprZJyyopIL3JzlZ19GNWlwGyKKz95+KVEPofro=",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to register agent: ${await response.text()}`);
      }

      const { access_token } = await response.json();
      this.session = { access_token };

      console.log("Agent initialized successfully");
    } catch (error) {
      console.error("Failed to initialize agent:", error);
      throw error;
    }
  }

  async getRandomMarket() {
    const { data: markets, error } = await this.supabase
      .from("markets")
      .select("id, options(yes_outcome_id)")
      .eq("status", "open")
      .limit(1)
      .single();

    if (error) throw error;
    return {
      marketId: markets.id,
      outcomeId: markets.options[0].yes_outcome_id,
    };
  }

  async placeTrade() {
    try {
      const response = await fetch("https://market-loo.vercel.app/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.session.access_token}`,
        },
        body: JSON.stringify({
          market_id: "f747fe6a-6e29-43f0-8d41-574e07f269bc",
          outcome_id: "baca3016-00d0-4e9a-b8c2-aa7a522499ae",
          amount: 100,
          type: "buying",
        }),
      });

      const data = await response.json();
      console.log(data);
      console.log("Order placed successfully");
    } catch (error) {
      console.error("Error placing trade:", error);
    }
  }

  async start() {
    await this.initialize();

    // Place trades every 20 seconds
    setInterval(() => {
      this.placeTrade();
    }, 20000);

    // Place first trade immediately
    this.placeTrade();
  }
}

// Start the agent
const agent = new SimpleTraderAgent();
agent.start().catch(console.error);
