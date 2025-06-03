"use client";

import { useEffect } from "react";
import { useIncomeStore } from "@/store/incomeStore";
import { useTransactionStore } from "@/store/transactionStore";

export default function DashboardPage() {
  const { income, loadIncome } = useIncomeStore();
  const { transactions, loadTransactions } = useTransactionStore();

  useEffect(() => {
    loadIncome();
    loadTransactions();
  }, []);

  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const balance = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-8">
      <h1 className="text-3xl font-bold mb-6">📊 Dashboard</h1>

      <div className="grid gap-6 max-w-xl">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-2">💰 Total Income</h2>
          <p className="text-2xl text-green-600">${totalIncome.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-2">💸 Total Expenses</h2>
          <p className="text-2xl text-red-600">${totalExpenses.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-2">📉 Balance</h2>
          <p className={`text-2xl ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
            ${balance.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
