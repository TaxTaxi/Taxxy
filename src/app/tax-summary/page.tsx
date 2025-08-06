// src/app/tax-summary/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useIncomeStore } from "@/store/incomeStore";
import { useBillStore } from "@/store/billStore";
import Link from "next/link";

export default function TaxSummaryPage() {
  const { income, loadIncome } = useIncomeStore(); // Fixed: use 'income' instead of 'incomeItems'
  const { bills, loadBills } = useBillStore(); // Fixed: use 'loadBills' instead of 'loadBillsFromStorage'

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadIncome(); // Fixed: use the proper store methods
    loadBills();
  }, [loadIncome, loadBills]);

  if (!isClient) return null;

  // ✅ Totals calculations
  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const estimatedTaxOwed = totalIncome * 0.25;
  const remainingAfterTax = totalIncome - estimatedTaxOwed - totalBills;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">📊 Tax Summary</h1>

        {/* Quick Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-2 text-green-700">💰 Total Income</h2>
            <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-2 text-red-700">🧾 Total Bills</h2>
            <p className="text-2xl font-bold text-red-600">${totalBills.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-2 text-yellow-700">💸 Estimated Tax (25%)</h2>
            <p className="text-2xl font-bold text-yellow-600">${estimatedTaxOwed.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-2 text-blue-700">🧮 Remaining</h2>
            <p className={`text-2xl font-bold ${remainingAfterTax >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${remainingAfterTax.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Detailed Summary Card */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Tax Overview</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Income:</span>
              <span className="font-semibold text-green-600">${totalIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Bills:</span>
              <span className="font-semibold text-red-600">${totalBills.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Estimated Tax (25%):</span>
              <span className="font-semibold text-yellow-600">${estimatedTaxOwed.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-gray-50 px-4 rounded-lg">
              <span className="font-semibold text-gray-800">Remaining After Tax & Bills:</span>
              <span className={`font-bold text-lg ${remainingAfterTax >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${remainingAfterTax.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <Link href="/tax-report">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
              📄 View Detailed Tax Report
            </button>
          </Link>
          
          <Link href="/transactions">
            <button className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition flex items-center gap-2">
              📊 View Transactions
            </button>
          </Link>

          <Link href="/income">
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2">
              💰 Manage Income
            </button>
          </Link>
        </div>

        {/* Status Messages */}
        {income.length === 0 && bills.length === 0 && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              📝 <strong>Get Started:</strong> Add some income and bills to see your tax summary.
            </p>
          </div>
        )}

        {remainingAfterTax < 0 && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              ⚠️ <strong>Alert:</strong> Your expenses and estimated taxes exceed your income. Consider reviewing your budget or exploring additional deductions.
            </p>
          </div>
        )}

        {remainingAfterTax > 0 && totalIncome > 0 && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">
              ✅ <strong>Good news:</strong> You have ${remainingAfterTax.toFixed(2)} remaining after taxes and bills. Consider setting aside additional funds for tax savings or business investments.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}