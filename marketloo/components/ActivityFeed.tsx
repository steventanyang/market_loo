import Image from "next/image";

interface ActivityItem {
  id: string;
  username: string;
  action: "bought" | "sold";
  outcome: "Yes" | "No";
  price: number;
  amount: number;
  marketQuestion: string;
  timestamp: Date;
  userAvatar?: string;
}

const sampleActivities: ActivityItem[] = [
  {
    id: "1",
    username: "carl24",
    action: "bought",
    outcome: "No",
    price: 56,
    amount: 2.36,
    marketQuestion: "Will BTC reach 100k by 2024?",
    timestamp: new Date(Date.now() - 1000 * 9), // 9 seconds ago
  },
  {
    id: "2",
    username: "trader789",
    action: "sold",
    outcome: "Yes",
    price: 39,
    amount: 4.62,
    marketQuestion: "Will ETH merge to PoS in Q1?",
    timestamp: new Date(Date.now() - 1000 * 17), // 17 seconds ago
  },
  // Add more sample activities as needed
];

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  return `${seconds}s ago`;
}

export default function ActivityFeed() {
  return (
    <div className="max-w-2xl mx-auto mt-12 bg-[#2C3038] rounded-lg border border-gray-700">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <button className="text-sm text-blue-400 hover:text-blue-300">
          See all
        </button>
      </div>

      <div className="divide-y divide-gray-700">
        {sampleActivities.map((activity) => (
          <div key={activity.id} className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
              {activity.userAvatar ? (
                <Image
                  src={activity.userAvatar}
                  alt={activity.username}
                  width={32}
                  height={32}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-sm">
                <span className="font-medium truncate">
                  {activity.username}
                </span>
                <span className="text-gray-400">{activity.action}</span>
                <span
                  className={
                    activity.outcome === "Yes"
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {activity.outcome}
                </span>
                <span className="text-gray-400">at</span>
                <span className="font-medium">{activity.price}¢</span>
                <span className="text-gray-400">
                  (${activity.amount.toFixed(2)})
                </span>
              </div>
              <p className="text-sm text-gray-400 truncate">
                {activity.marketQuestion}
              </p>
            </div>

            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatTimeAgo(activity.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
