"use client";

import { useEffect } from "react";
import { useBillStore } from "@/store/billStore";
import { useIncomeStore } from "@/store/incomeStore";

export default function TaxesPage() {
  const { bills, loadBillsFromFirestore } = useBillStore();
  const { incomeItems, loadIncomeFromFirestore } = useIncomeStore();

  // ✅ Load data on mount
  useEffect(() => {
    loadBillsFromFirestore();
    loadIncomeFromFirestore();
  }, []);

  const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const taxableIncome = totalIncome - totalBills;
  const estimatedTax = taxableIncome * 0.25;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-100">Tax Overview</h1>
      <div className="bg-white shadow rounded-xl p-6 space-y-4 text-gray-700">
        <div>
          <strong>Total Income:</strong> ${totalIncome.toFixed(2)}
        </div>
        <div>
          <strong>Total Bills:</strong> ${totalBills.toFixed(2)}
        </div>
        <div>
          <strong>Taxable Income:</strong> ${taxableIncome.toFixed(2)}
        </div>
        <div>
          <strong>Estimated Tax (25%):</strong> ${estimatedTax.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
