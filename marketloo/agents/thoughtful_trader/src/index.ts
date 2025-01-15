// import dotenv from "dotenv";
// dotenv.config();
import { createClient } from "@supabase/supabase-js";
import markets from "../markets.json";
import OpenAI from "openai";

interface MarketOutcome {
  marketId: string;
  outcomeId: string;
  marketTitle: string;
}

class ThoughtfulTraderAgent {
  private supabase;
  private session: any = null;
  private positions: { [key: string]: number } = {}; // Track positions by outcome_id
  private currentMarketIndex = 0; // Track current market position
  private openai: OpenAI;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
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

  async evaluateMarket(market: any, outcome: any): Promise<boolean> {
    try {
      const prompt = `Given this prediction market:
Title: "${market.title}"
Outcome: "${outcome.name}" (current price: ${outcome.current_price})

Should I buy this outcome? Consider:
1. The likelihood of this outcome
2. The current price vs potential value
3. Market sentiment and logic

Reply with ONLY "yes" or "no".`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const decision = response.choices[0].message?.content
        ?.toLowerCase()
        .trim();
      return decision === "yes";
    } catch (error) {
      console.error("Error evaluating market:", error);
      return false;
    }
  }

  async placeTrade() {
    try {
      const { marketId, outcomeId, marketTitle } =
        this.getNextMarketAndOutcome();
      const market = markets.find((m) => m.id === marketId);
      const outcome = market?.outcomes.find((o) => o.outcome_id === outcomeId);

      if (!market || !outcome) return;

      const shouldBuy = await this.evaluateMarket(market, outcome);
      if (!shouldBuy) {
        console.log(
          `Skipping market: "${marketTitle}" - AI suggests not to buy\n`
        );
        return;
      }

      const amount = Math.floor(Math.random() * 50) + 10;

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
          type: "buying",
        }),
      });

      if (response.ok) {
        this.positions[outcomeId] = (this.positions[outcomeId] || 0) + amount;
        console.log(`Market: "${marketTitle}"`);
        console.log(`Bought ${amount} tokens`);
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
const agent = new ThoughtfulTraderAgent();
agent.start().catch(console.error);
