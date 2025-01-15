import { createClient } from "@supabase/supabase-js";
import markets from "../markets.json";

interface MarketOutcome {
  marketId: string;
  outcomeId: string;
  marketTitle: string;
}

class SimpleTraderAgent {
  private supabase;
  private session: any = null;
  private positions: { [key: string]: number } = {}; // Track positions by outcome_id
  private currentMarketIndex = 0; // Track current market position

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
          body: JSON.stringify({
            username: "simple_trader_" + Math.floor(Math.random() * 1000),
            balance_of_poo: 1000000,
          }),
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

  getNextMarketAndOutcome(): MarketOutcome {
    // Get current market
    const market = markets[this.currentMarketIndex];

    // Get random outcome from current market
    const outcome =
      market.outcomes[Math.floor(Math.random() * market.outcomes.length)];

    // Move to next market, loop back to start if at end
    this.currentMarketIndex = (this.currentMarketIndex + 1) % markets.length;

    // Add some randomness - 20% chance to skip this market
    if (Math.random() < 0.2) {
      return this.getNextMarketAndOutcome();
    }

    return {
      marketId: market.id,
      outcomeId: outcome.outcome_id,
      marketTitle: market.title, // For logging
    };
  }

  async placeTrade() {
    try {
      const { marketId, outcomeId, marketTitle } =
        this.getNextMarketAndOutcome();
      const isbuying = Math.random() > 0.5;
      const amount = Math.floor(Math.random() * 50) + 10;

      // If selling, check position
      if (!isbuying) {
        const currentPosition = this.positions[outcomeId] || 0;
        if (currentPosition < amount) {
          console.log(
            `Skipping sell: Insufficient position (have ${currentPosition}, want to sell ${amount})`
          );
          return;
        }
      }

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

      if (response.ok) {
        if (isbuying) {
          this.positions[outcomeId] = (this.positions[outcomeId] || 0) + amount;
        } else {
          this.positions[outcomeId] = (this.positions[outcomeId] || 0) - amount;
        }
        console.log(`Market: "${marketTitle}"`);
        console.log(`${isbuying ? "Bought" : "Sold"} ${amount} tokens`);
        console.log(`New position for outcome: ${this.positions[outcomeId]}\n`);
      }
    } catch (error) {
      console.error("Error placing trade:", error);
    }
  }

  async start() {
    await this.initialize();

    // First trade: Buy 100 in first market
    try {
      const { marketId, outcomeId, marketTitle } =
        this.getNextMarketAndOutcome();
      const response = await fetch("https://market-loo.vercel.app/api/orders", {
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

      if (response.ok) {
        this.positions[outcomeId] = 100;
        console.log(`Initial Market: "${marketTitle}"`);
        console.log(`Bought 100 tokens\n`);
      }
    } catch (error) {
      console.error("Error placing initial trade:", error);
    }

    setInterval(() => {
      this.placeTrade();
    }, 10000);
  }
}

// Start the agent
const agent = new SimpleTraderAgent();
agent.start().catch(console.error);
