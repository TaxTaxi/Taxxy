"use client";

import { useIncomeStore } from "@/store/incomeStore";
import { useBillStore } from "@/store/billStore";

export default function TaxesPage() {
  const incomeItems = useIncomeStore((state) => state.incomeItems);
  const bills = useBillStore((state) => state.bills);

  // ✅ Calculate totals
  const totalIncome = incomeItems.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = bills.reduce((sum, b) => sum + b.amount, 0);
  const netProfit = totalIncome - totalExpenses;
  const estimatedTax = Math.max(0, netProfit * 0.2);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Tax Summary</h1>

      <div className="bg-white rounded-xl shadow p-6 max-w-xl space-y-4">
        <div className="text-lg text-gray-700">
          <strong>Total Income:</strong> ${totalIncome.toFixed(2)}
        </div>
        <div className="text-lg text-gray-700">
          <strong>Total Bills (Expenses):</strong> ${totalExpenses.toFixed(2)}
        </div>
        <div className="text-lg text-gray-700">
          <strong>Net Profit:</strong> ${netProfit.toFixed(2)}
        </div>
        <div className="text-lg text-red-600 font-semibold">
          <strong>Estimated Tax Owed:</strong> ${estimatedTax.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
