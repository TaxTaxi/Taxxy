"use client";

import { useEffect } from "react";
import { useIncomeStore } from "@/store/incomeStore";
import { useTransactionStore } from "@/store/transactionStore";

export default function TaxReportPage() {
  const { income, loadIncome } = useIncomeStore();
  const { transactions, loadTransactions } = useTransactionStore();

  useEffect(() => {
    loadIncome();
    loadTransactions();
  }, []);

  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const businessExpenses = transactions
    .filter((tx) => tx.purpose === "business")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const personalExpenses = transactions
    .filter((tx) => tx.purpose === "personal")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const writeOffTotal = transactions
    .filter((tx) => tx.writeOff?.isWriteOff)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen p-8 bg-white text-black">
      <h1 className="text-3xl font-bold mb-6">📄 Tax Report</h1>

      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Total Income</h2>
          <p>${totalIncome.toFixed(2)}</p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Total Expenses</h2>
          <p>${totalExpenses.toFixed(2)}</p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Business Expenses</h2>
          <p>${businessExpenses.toFixed(2)}</p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Personal Expenses</h2>
          <p>${personalExpenses.toFixed(2)}</p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Write-Offs Total</h2>
          <p>${writeOffTotal.toFixed(2)}</p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Net Balance</h2>
          <p>${netBalance.toFixed(2)}</p>
        </div>
      </div>

      <button
        onClick={() => window.print()}
        className="mt-8 px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
      >
        📥 Print or Save as PDF
      </button>
    </div>
  );
}