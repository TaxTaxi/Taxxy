"use client";

import { useEffect, useState } from "react";
import { useTransactionStore, Transaction } from "@/store/transactionStore";

// 🧪 Default fake data (this will be replaced later by bank integration)
const sampleTransactions: Transaction[] = [
  {
    id: 1,
    name: "Freelance Payment",
    amount: 1500,
    date: "2025-05-01",
    category: "income",
  },
  {
    id: 2,
    name: "Spotify Subscription",
    amount: -10,
    date: "2025-05-02",
    category: "bill",
  },
  {
    id: 3,
    name: "Coffee with client",
    amount: -6,
    date: "2025-05-03",
    category: "writeoff",
    flagged: true,
  },
];

export default function TransactionsPage() {
  const { transactions, setTransactions, updateCategory } = useTransactionStore();

  // 🧠 Load sample transactions only once if store is empty
  useEffect(() => {
    if (transactions.length === 0) {
      setTransactions(sampleTransactions);
    }
  }, [transactions.length, setTransactions]);

  // 🎨 Color per category
  const categoryColor = {
    income: "text-green-600",
    bill: "text-red-600",
    writeoff: "text-yellow-600",
    other: "text-gray-600",
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Transactions</h1>

      <div className="grid gap-4 max-w-2xl">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="bg-white rounded-xl shadow p-5 flex justify-between items-center"
          >
            <div>
              <div className="text-lg font-medium text-gray-800">{tx.name}</div>
              <div className="text-sm text-gray-500">{tx.date}</div>
              {tx.flagged && (
                <div className="text-xs text-orange-600 mt-1">⚠️ Flagged for review</div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-lg font-semibold ${categoryColor[tx.category ?? "other"]}`}>
                ${Math.abs(tx.amount)}
              </div>
              <select
                value={tx.category ?? "other"}
                onChange={(e) =>
                  updateCategory(tx.id, e.target.value as Transaction["category"])
                }
                className="p-1 border border-gray-300 rounded text-sm"
              >
                <option value="income">Income</option>
                <option value="bill">Bill</option>
                <option value="writeoff">Write-Off</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
