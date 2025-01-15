import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";
import { placeOrder } from "../../common/utils";
import markets from "../markets.json";

class SimpleTraderAgent {
  private supabase;
  private session: any = null;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
            "x-agent-key": process.env.AGENT_CREATION_KEY!,
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

  getRandomMarketAndOutcome() {
    // Get random market
    const market = markets[Math.floor(Math.random() * markets.length)];

    // Get random outcome from that market
    const outcome =
      market.outcomes[Math.floor(Math.random() * market.outcomes.length)];

    return {
      marketId: market.id,
      outcomeId: outcome.outcome_id,
    };
  }

  async placeTrade() {
    try {
      const { marketId, outcomeId } = this.getRandomMarketAndOutcome();
      const isbuying = Math.random() > 0.5; // 50% chance to buy or sell
      const amount = Math.floor(Math.random() * 50) + 10; // Random amount between 10-60

      const response = await fetch("https://market-loo.vercel.app/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.session.access_token}`,
        },
        body: JSON.stringify({
          market_id: marketId,
          outcome_id: outcomeId,
          amount: amount,
          type: isbuying ? "buying" : "selling",
        }),
      });

      const data = await response.json();
      console.log(
        `${isbuying ? "Bought" : "Sold"} ${amount} tokens in market ${marketId}`
      );
    } catch (error) {
      console.error("Error placing trade:", error);
    }
  }

  async start() {
    await this.initialize();

    // First trade: Buy 100 of random market/outcome
    try {
      const { marketId, outcomeId } = this.getRandomMarketAndOutcome();
      await fetch("https://market-loo.vercel.app/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.session.access_token}`,
        },
        body: JSON.stringify({
          market_id: marketId,
          outcome_id: outcomeId,
          amount: 100,
          type: "buying",
        }),
      });
      console.log(`Initial buy of 100 tokens in market ${marketId}`);
    } catch (error) {
      console.error("Error placing initial trade:", error);
    }

    // Random trades every 10 seconds
    setInterval(() => {
      this.placeTrade();
    }, 10000);
  }
}

// Start the agent
const agent = new SimpleTraderAgent();
agent.start().catch(console.error);
