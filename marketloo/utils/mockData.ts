import { sub } from "date-fns";

interface PricePoint {
  timestamp: Date;
  price: number;
}

function randomWalk(
  basePrice: number,
  steps: number,
  volatility: number
): number[] {
  const prices = [basePrice];
  for (let i = 1; i < steps; i++) {
    const change = (Math.random() - 0.5) * volatility;
    const newPrice = Math.max(0.01, Math.min(0.99, prices[i - 1] + change));
    prices.push(newPrice);
  }
  return prices;
}

export function generateMockPriceData(currentPrice: number) {
  const now = new Date();

  // 1H: 5-minute intervals for the last hour (12 points)
  const recentData = randomWalk(currentPrice, 12, 0.02).map((price, i) => ({
    timestamp: sub(now, { minutes: (11 - i) * 5 }),
    price: price * 100,
  }));

  // 6H: 15-minute intervals for 6 hours (24 points)
  const sixHourData = randomWalk(currentPrice, 24, 0.025).map((price, i) => ({
    timestamp: sub(now, { minutes: (23 - i) * 15 }),
    price: price * 100,
  }));

  // 12H: 30-minute intervals for 12 hours (24 points)
  const twelveHourData = randomWalk(currentPrice, 24, 0.03).map((price, i) => ({
    timestamp: sub(now, { minutes: (23 - i) * 30 }),
    price: price * 100,
  }));

  // 1D: Hourly intervals for 24 hours (24 points)
  const dailyData = randomWalk(currentPrice, 24, 0.035).map((price, i) => ({
    timestamp: sub(now, { hours: 23 - i }),
    price: price * 100,
  }));

  // 1W: 6-hour intervals for 7 days (28 points)
  const weeklyData = randomWalk(currentPrice, 28, 0.04).map((price, i) => ({
    timestamp: sub(now, { hours: (27 - i) * 6 }),
    price: price * 100,
  }));

  // ALL: Daily intervals for 30 days (30 points)
  const allData = randomWalk(currentPrice, 30, 0.05).map((price, i) => ({
    timestamp: sub(now, { days: 29 - i }),
    price: price * 100,
  }));

  return {
    recent: recentData,
    sixHour: sixHourData,
    twelveHour: twelveHourData,
    daily: dailyData,
    weekly: weeklyData,
    all: allData,
  };
}
