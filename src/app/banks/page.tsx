"use client";

const fakeIncome = [
  { id: 1, source: "Company A", amount: 2000, date: "April 25, 2025", emoji: "💼" },
  { id: 2, source: "Freelance Gig", amount: 600, date: "April 20, 2025", emoji: "🧑‍💻" },
  { id: 3, source: "Company A", amount: 2000, date: "April 10, 2025", emoji: "💼" },
  { id: 4, source: "Referral Bonus", amount: 150, date: "April 8, 2025", emoji: "🎁" },
];

export default function BanksPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Recent Income</h1>

      <div className="grid gap-6">
        {fakeIncome.map((income) => (
          <div
            key={income.id}
            className="bg-white rounded-xl shadow p-6 flex justify-between items-center"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{income.emoji}</span>
              <div>
                <div className="text-lg font-medium text-gray-800">{income.source}</div>
                <div className="text-sm text-gray-500">{income.date}</div>
              </div>
            </div>
            <div className="text-xl font-semibold text-green-600">+${income.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}