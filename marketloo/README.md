## Inspiration

We're fintech nerds who love competing and saw hackathons were missing something fun. Every hackathon has those moments where everyone's predicting winners and debating what teams will build - so we turned those discussions into a prediction market where hackers can bet and climb the leaderboard. Think "Polymarket meets MLH" but with fake internet points called POO.

## What it does

MarketLoo is a prediction market platform where users trade virtual shares on real-world outcomes. Users can create markets, take positions on binary outcomes (Yes/No), and compete for profits. The platform features real-time price updates, a dynamic order book, and automated market making to ensure constant liquidity. Each user starts with 10,000 POO (Prediction Outcome Options) tokens to trade with.

## How we built it
Built with Next.js 14 and Supabase, MarketLoo uses a serverless architecture for scalability. The frontend employs Tailwind CSS for styling and React for dynamic components. The backend features a custom order book system with automated market making, and a dual-resolution time series database for efficient price history tracking. Real-time updates are handled through Supabase's PostgreSQL subscriptions, while authentication and user management leverage Supabase Auth. The platform uses server-side rendering and API routes for optimal performance.

## Challenges we ran into

**Time-Series Data Management**
One of our main technical challenges was designing an efficient system for managing high-frequency market data while maintaining performance. We implemented a dual-table time series database system for tracking market prices that optimizes both storage and query performance. The system uses two tables with different temporal resolutions:
1. recent_price_history: Stores high-resolution 5-minute interval price snapshots for the most recent hour of trading. This gives us granular data for real-time price movements.
2. archived_price_history: Handles historical data with adaptive resolution:
- Last 24 hours: Hourly snapshots
- Older data: 6-hour interval snapshots

This design is managed by automated maintenance jobs that:
Capture price snapshots every 5 minutes
Run hourly jobs to clear old high-resolution data and archive it
Consolidate 24-hour-old hourly snapshots into 6-hour intervals

**Order Book and Market Making**
Another significant challenge was simulating a live, liquid market without real users at launch. We developed a sophisticated market-making system that:
Uses a dynamic pricing model with three key components:
Base spread (0.5%) for market maker profitability
Liquidity factor (±0.2%) for price randomization
Volume impact factor (0.5% per unit) that scales logarithmically with order size
Implements an automated order matching system that:
First attempts to match orders with existing user orders
Falls back to market maker liquidity when no matching orders exist
Ensures price updates maintain complementary probabilities (yes/no prices always sum to 100%)
The market maker uses the formula:

```typescript
priceImpact = baseSpread + (random * liquidityFactor) + (volumeImpact * log10(orderSize))
```

This creates a realistic trading environment where prices respond naturally to trading pressure while maintaining consistent liquidity. The system also handles edge cases like preventing price manipulation through large orders by implementing logarithmic price impact.
These technical solutions allowed us to create a responsive and realistic prediction market platform that can scale with user adoption while maintaining data efficiency and market stability.

## Accomplishments that we're proud of

⌘K to generate a command
for the sign in after they send email, can you add a text somewhere that syas "the emila may take a minute, please wait" ros oemthing similar

I'll help you add a message about email delivery time to the sign-up page. Looking at the code, I see there's already a SmtpMessage component being used at the bottom of the sign-up page. Let me check what it contains first.
Let me search specifically for the file containing the SmtpMessage component.
Let me check the contents of this file.
I see that there's already an SMTP message component, but it's focused on rate limiting rather than the wait time. Let me modify the sign-up page to add a message about email delivery time. I'll add it right before the existing SMTP message.
I see we need to fix the InfoIcon import. Let me check if we can import it from lucide-react instead, since I noticed it was used that way in the SmtpMessage component.
I've added a message about email delivery time right before the existing SMTP message and fixed the import issue. The message will now inform users that the confirmation email may take a minute to arrive, which should help set proper expectations for the sign-up process.
get rid of the other rate limited note

I'll remove the SmtpMessage component since we already have our own message about the email delivery time.
I've removed the SmtpMessage component and its import, leaving only our custom message about email delivery time. The page now has a cleaner look with just one notification about the email confirmation process.
## Challenges we ran into

I'm writing this section for our devpost. Talk about our design for how graphs data time series works and also of how we designed our order book to simulate a live market. Make it pretty techincal

I'll help craft a technical description of the challenges, focusing on our time-series data management and order book simulation. Here's a draft:
Challenges We Ran Into
One of our main technical challenges was designing an efficient system for managing high-frequency market data while maintaining performance. We tackled this through two key architectural decisions:
Time-Series Data Management
We implemented a dual-table time series database system for tracking market prices that optimizes both storage and query performance. The system uses two tables with different temporal resolutions:
recent_price_history: Stores high-resolution 5-minute interval price snapshots for the most recent hour of trading. This gives us granular data for real-time price movements.
archived_price_history: Handles historical data with adaptive resolution:
Last 24 hours: Hourly snapshots
Older data: 6-hour interval snapshots
This design is managed by automated maintenance jobs that:
Capture price snapshots every 5 minutes
Run hourly jobs to clear old high-resolution data and archive it
Consolidate 24-hour-old hourly snapshots into 6-hour intervals
Order Book and Market Making
Another significant challenge was simulating a live, liquid market without real users at launch. We developed a sophisticated market-making system that:
Uses a dynamic pricing model with three key components:
Base spread (0.5%) for market maker profitability
Liquidity factor (±0.2%) for price randomization
Volume impact factor (0.5% per unit) that scales logarithmically with order size
Implements an automated order matching system that:
First attempts to match orders with existing user orders
Falls back to market maker liquidity when no matching orders exist
Ensures price updates maintain complementary probabilities (yes/no prices always sum to 100%)
The market maker uses the formula:
priceImpact = baseSpread + (random * liquidityFactor) + (volumeImpact * log10(orderSize))
This creates a realistic trading environment where prices respond naturally to trading pressure while maintaining consistent liquidity. The system also handles edge cases like preventing price manipulation through large orders by implementing logarithmic price impact.
These technical solutions allowed us to create a responsive and realistic prediction market platform that can scale with user adoption while maintaining data efficiency and market stability.

## What it does



## How we built it


now write these two and amke it conscse as possible

Here's a concise version of both sections:
What it does
MarketLoo is a prediction market platform where users trade virtual shares on real-world outcomes. Users can create markets, take positions on binary outcomes (Yes/No), and compete for profits. The platform features real-time price updates, a dynamic order book, and automated market making to ensure constant liquidity. Each user starts with 500 POO (Prediction Outcome Options) tokens to trade with.
How we built it
Built with Next.js 14 and Supabase, MarketLoo uses a serverless architecture for scalability. The frontend employs Tailwind CSS for styling and React for dynamic components. The backend features a custom order book system with automated market making, and a dual-resolution time series database for efficient price history tracking. Real-time updates are handled through Supabase's PostgreSQL subscriptions, while authentication and user management leverage Supabase Auth. The platform uses server-side rendering and API routes for optimal performance.

## Accomplishments that we're proud of

Our biggest accomplishment was turning careful planning into efficient execution. We spent significant time upfront architecting critical systems - particularly our dual-resolution time series database and market making algorithm - which paid off in implementation. This planning allowed us to build a complex trading system with remarkably few technical hiccups.

We're especially proud of our attention to UI/UX details. Rather than rushing to add features, we focused on making each interaction feel polished and professional - from smooth price animations to intuitive trading interfaces. The result is a platform that not only works well technically but feels like a legitimate trading platform.

Key architectural decisions, like our approach to market liquidity and price history management, were made early and executed cleanly. This upfront investment in design meant we could implement complex features like real-time order matching and price updates without major refactoring. It's a testament to how thoughtful planning can lead to more efficient development, even under hackathon time constraints.

## What we learned

The biggest lesson was that there's always a solution to complex technical challenges - it's just a matter of finding the right approach. When faced with issues like market liquidity or real-time price updates, we discovered that breaking down seemingly impossible problems into smaller, manageable pieces made them solvable. We also learned that we could accomplish far more than initially thought possible - what started as a simple prediction market evolved into a sophisticated trading platform with real-time order matching and AI-powered analysis.

## What's next for Marketloo - Prediction Platform for Hackathons 

We've already laid the groundwork for exciting AI-powered features. Our current implementation includes RAG (Retrieval-Augmented Generation) for market summaries, but this is just the beginning. We plan to introduce AI trading agents that can:
Analyze our existing database of DevPost projects and outcomes to provide informed trading suggestions

Guide users with market-specific insights by processing historical project data
Generate real-time market analysis based on project updates and similar historical patterns

The data pipelines for these features are already in place - we're ingesting and processing DevPost data systematically. This foundation will allow us to create an AI-enhanced trading experience that combines historical project insights with real-time market dynamics, helping users make more informed predictions about hackathon projects.