export default function InsightsCard() {
    return (
      <div className="bg-white shadow rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-2">🧠 AI Insights</h2>
        <ul className="text-sm list-disc list-inside text-gray-700 space-y-1">
          <li>You’ve hit 90% of your budget this week — good time to cool spending.</li>
          <li>Stripe income has increased 12% from last month.</li>
          <li>You're on track for your quarterly tax payment on June 15.</li>
        </ul>
      </div>
    );
  }