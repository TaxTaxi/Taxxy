"use client";

import { useEffect } from "react";
import { useTransactionStore } from "@/store/transactionStore";


export default function TransactionsPage() {
  const {
    transactions,
    loadTransactions,
    addTransaction,
  } = useTransactionStore();

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-100 mb-4">Transactions</h1>

      <button
        onClick={() =>
          addTransaction({
            description: "Zoom Pro Subscription",
            amount: 20,
            date: "2025-05-28",
            category: "software",      // ✅ satisfies required type
            purpose: "business",       // ✅ avoids fallback
          })
        }
        className="bg-blue-600 text-white px-4 py-2 rounded shadow"
      >
        Add Test Transaction
      </button>

      <ul className="mt-6 space-y-4">
        {transactions.map((tx) => (
          <li
            key={tx.id}
            className="bg-white rounded-lg shadow p-4 text-gray-800"
          >
            <div className="flex justify-between">
              <span>{tx.description}</span>
              <span>${tx.amount.toFixed(2)}</span>
            </div>
            <div className="text-sm text-gray-500">
              {tx.date} — {tx.tag || "No tag"} — {tx.category} — {tx.purpose}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
