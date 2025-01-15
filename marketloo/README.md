## Inspiration

We're fintech nerds who love competing and saw hackathons were missing something fun 🤪! Every hackathon has those moments where everyone's predicting winners and debating what teams will build - so we turned those discussions into a prediction market where hackers can bet and climb the leaderboard 📈. Think "Polymarket meets MLH" but with fake internet points called POO 💩 (yes, we really called them that!).

## What it does

MarketLoo is like if Wall Street had a baby with your favorite hackathon 👶! Users can trade virtual shares on real-world outcomes, create markets, and compete for those sweet sweet profits 🤑. The platform's got all the fancy stuff - real-time price updates ⚡, a dynamic order book 📚, and automated market making to keep things liquid (unlike your weekend coding sessions 😅). Each user starts with 10,000 POO tokens to trade with (we're still not sorry about the name 💩).

## How we built it

We went full nerd mode with this one 🤓:
- Next.js 14 because we're living in the FUTURE 🛸
- Supabase for all that database goodness 🗄️
- Tailwind CSS to make things pretty (and save us from writing CSS 😮💨)
- React for those smooth moves ✨
- Custom order book system that's probably way more complex than it needed to be, but hey, we're overachievers! 🎯
- Real-time updates through Supabase's PostgreSQL subscriptions (fancy! 💅)
- Server-side rendering because we care about performance (and Google rankings 🔍)

## Challenges we ran into

### Time-Series Data Management
Ever tried to track a bazillion price updates without making your database cry? 😭 Here's our galaxy brain solution:

1. recent_price_history: Stores the juicy 5-minute snapshots for the latest hour of trading (for when you need that ultra-HD price action 🎥)
2. archived_price_history: Handles the oldies-but-goodies with different resolutions:
   - Last 24 hours: Hourly snapshots (because who needs every 5 minutes from yesterday? 🤷)
   - Ancient history (aka older than 24h): 6-hour snapshots (keeping it vintage 📸)

We've got some sneaky maintenance ninjas 🥷 working behind the scenes that:
- Snag price snapshots every 5 minutes (quick like a bunny! 🐰)
- Run hourly clean-up jobs (like a roomba, but for data 🤖)
- Squish 24-hour-old hourly data into neat 6-hour packages (data origami! 📦)

### Order Book and Market Making
Our super-smart market-making system includes:
- A dynamic pricing model with three secret ingredients 🧪:
  - Base spread (0.5%) for market maker profits (gotta eat! 🍕)
  - Liquidity factor (±0.2%) for that spicy randomization 🎲
  - Volume impact factor (0.5% per unit) that scales logarithmically with order size (big orders = big impact! 💥)

The secret sauce formula looks like this (we're not afraid of math! 🤓):
```typescript
priceImpact = baseSpread + (random * liquidityFactor) + (volumeImpact * log10(orderSize))
```

Our matching system is like a trading matchmaker 💘:
1. First tries to hook up orders with existing user orders (perfect match! 🤝)
2. If no match, our market maker steps in as the backup dancer 💃
3. Makes sure yes/no prices always add up to 100% (we passed math class! 🎓)

Plus, we've got safeguards against those whales 🐋 trying to manipulate prices with huge orders!

## Accomplishments that we're proud of

We actually planned stuff before building it (Mom would be so proud! 👩)! We spent quality time architecting our systems (like responsible adults 😇) which meant fewer "everything is on fire" moments 🔥. We're especially proud of our UI/UX details - no potato design here 🥔! From smooth price animations to intuitive trading interfaces, we made this thing feel legit 💪.

## What we learned

The biggest lesson? No problem is too big when you break it down into tiny baby problems 👶! What seemed impossible at first became totally doable once we put on our thinking caps 🎩. We discovered we could build way cooler stuff than we thought possible - our simple prediction market turned into a trading platform with bells and whistles and maybe a kitchen sink too 🚰!

## What's next for Marketloo - Prediction Platform for Hackathons

We're cooking up some AI magic 🧙♂️! Our current setup already includes RAG for market summaries (fancy!), but we're just getting started. Coming soon:
- AI trading agents that'll analyze DevPost projects like a pro 🤖
- Smart market insights based on historical project data (we're basically time travelers 🕰️)
- Real-time analysis that makes you feel like a genius trader 🧠

Our data pipelines are ready to go (we've been hoarding DevPost data like dragons hoard gold 🐉). Get ready for an AI-powered trading experience that'll make you feel like you're in the future! 🚀

In POO we trust! 💩✨