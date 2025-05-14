"use client";

import { useEffect, useState } from "react";
import { useBillStore } from "@/store/billStore";
import { useIncomeStore } from "@/store/incomeStore";

export default function Dashboard() {
  const { bills, loadBillsFromFirestore } = useBillStore();
  const { incomeItems, loadIncomeFromFirestore } = useIncomeStore();

  const [isClient, setIsClient] = useState(false);

  // ✅ Load data from Firestore on mount
  useEffect(() => {
    setIsClient(true);
    useBillStore.getState().loadBillsFromFirestore();
    useIncomeStore.getState().loadIncomeFromFirestore();
  }, []);

  if (!isClient) return null;

  const totalIncome = incomeItems.reduce((sum, income) => sum + income.amount, 0);
  const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const netBalance = totalIncome - totalBills;

  return (
    <div className="min-h-screen p-8 bg-gray-50 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-6 max-w-2xl">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold">Total Income</h2>
          <p className="text-green-600 text-2xl mt-2">${totalIncome.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold">Total Bills</h2>
          <p className="text-red-600 text-2xl mt-2">${totalBills.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold">Net Balance</h2>
          <p className={`text-2xl mt-2 ${netBalance >= 0 ? "text-green-700" : "text-red-700"}`}>
            ${netBalance.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
