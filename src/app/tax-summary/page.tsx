"use client";

import { useEffect, useState } from "react";
import { useIncomeStore } from "@/store/incomeStore";
import { useBillStore } from "@/store/billStore";

export default function TaxSummaryPage() {
  const { incomeItems } = useIncomeStore();
  const { bills } = useBillStore();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
    useIncomeStore.getState().loadIncomeFromStorage();
    useBillStore.getState().loadBillsFromStorage();
  }, []);

  if (!isClient) return null;

  // ✅ Totals
  const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const estimatedTaxOwed = totalIncome * 0.25;
  const remainingAfterTax = totalIncome - estimatedTaxOwed - totalBills;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Tax Summary</h1>

      <div className="bg-white rounded-xl shadow p-6 max-w-xl mx-auto space-y-4 text-gray-800">
        <div className="text-lg">💰 Total Income: <strong>${totalIncome.toFixed(2)}</strong></div>
        <div className="text-lg">🧾 Total Bills: <strong>${totalBills.toFixed(2)}</strong></div>
        <div className="text-lg">💸 Estimated Tax (25%): <strong>${estimatedTaxOwed.toFixed(2)}</strong></div>
        <div className={`text-lg font-semibold ${remainingAfterTax >= 0 ? "text-green-600" : "text-red-600"}`}>
          🧮 Remaining After Tax & Bills: ${remainingAfterTax.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
