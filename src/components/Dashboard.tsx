"use client";

import { useEffect } from "react";
import { useTransactionStore } from "@/store/transactionStore";

export default function Dashboard() {
  const { transactions, loadTransactions } = useTransactionStore();

  useEffect(() => {
    loadTransactions(); // ✅ Supabase version
  }, []);

  const totalIncome = transactions
    .filter((t) => t.category === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.category === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const lowConfidenceCount = transactions.filter(
    (t) => t.confidence !== undefined && t.confidence < 0.7
  ).length;

  const unreviewedCount = transactions.filter((t) => !t.reviewed).length;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-200">Dashboard</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-sm text-gray-500">Total Income</h2>
          <p className="text-xl font-bold text-green-700">${totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-sm text-gray-500">Total Expenses</h2>
          <p className="text-xl font-bold text-green-700">${totalExpense.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-sm text-gray-500">Unreviewed</h2>
          <p className="text-xl font-bold text-red-500">{unreviewedCount}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-sm text-gray-500">Low Confidence</h2>
          <p className="text-xl font-bold text-yellow-400">{lowConfidenceCount}</p>
        </div>
      </div>
    </div>
  );
}
