// src/app/tax-report/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useIncomeStore } from "@/store/incomeStore";
import { useTransactionStore } from "@/store/transactionStore";

interface AITaxSummaryResponse {
  success: boolean;
  summary: string;
  data: {
    totalIncome: number;
    totalExpenses: number;
    businessExpenses: number;
    personalExpenses: number;
    writeOffs: number;
    transactionCount: number;
    topCategories: Array<{ category: string; amount: number; count: number }>;
    dateRange: { start: string; end: string };
  };
}

export default function TaxReportPage() {
  const { income, loadIncome } = useIncomeStore();
  const { transactions, loadTransactions } = useTransactionStore();
  
  // AI Summary State
  const [aiSummary, setAiSummary] = useState<string>("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    loadIncome();
    loadTransactions();
  }, []);

  // Auto-generate AI summary when data loads
  useEffect(() => {
    if (transactions.length > 0 || income.length > 0) {
      generateAISummary();
    }
  }, [transactions, income]);

  const generateAISummary = async () => {
    setLoadingAI(true);
    setAiError("");
    
    try {
      const response = await fetch('/api/ai-tax-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI summary');
      }

      const result: AITaxSummaryResponse = await response.json();
      
      if (result.success) {
        setAiSummary(result.summary);
      } else {
        setAiError('Failed to generate tax summary');
      }
    } catch (err) {
      console.error('AI summary error:', err);
      setAiError('Unable to generate AI summary. Please try again.');
    } finally {
      setLoadingAI(false);
    }
  };

  // Your existing calculations
  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount < 0 ? tx.amount : 0), 0);
  const businessExpenses = transactions
    .filter((tx) => tx.purpose === "business" && tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const personalExpenses = transactions
    .filter((tx) => tx.purpose === "personal" && tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const writeOffTotal = transactions
    .filter((tx) => tx.writeOff?.isWriteOff)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const netBalance = totalIncome - totalExpenses;
  const estimatedTaxOwed = Math.max(0, (totalIncome - businessExpenses) * 0.25);

  return (
    <div className="min-h-screen p-8 bg-white text-black">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">📄 Tax Report</h1>

        {/* 🧠 NEW: AI Tax Summary Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-blue-900">🧠 AI Tax Summary</h2>
            <button
              onClick={generateAISummary}
              disabled={loadingAI}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-sm"
            >
              {loadingAI ? 'Generating...' : 'Regenerate Summary'}
            </button>
          </div>
          
          {loadingAI && (
            <div className="flex items-center text-blue-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
              Analyzing your financial data...
            </div>
          )}
          
          {aiError && (
            <div className="text-red-600 bg-red-50 border border-red-200 rounded p-3 text-sm">
              {aiError}
            </div>
          )}
          
          {aiSummary && !loadingAI && (
            <div className="text-gray-800 leading-relaxed">
              {aiSummary}
            </div>
          )}
          
          {!aiSummary && !loadingAI && !aiError && (
            <div className="text-gray-500 italic text-sm">
              AI summary will generate automatically when your transaction data loads.
            </div>
          )}
        </div>

        {/* Your existing content with enhanced styling */}
        <div className="space-y-6">
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2 text-green-800">💰 Total Income</h2>
              <p className="text-3xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2 text-red-800">💸 Total Expenses</h2>
              <p className="text-3xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2 text-blue-800">📊 Net Balance</h2>
              <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${netBalance.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Enhanced Expense Breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">📋 Expense Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Business Expenses</h3>
                <p className="text-2xl font-bold text-blue-600">${businessExpenses.toFixed(2)}</p>
                <p className="text-sm text-blue-600 mt-1">✅ Tax deductible</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Personal Expenses</h3>
                <p className="text-2xl font-bold text-gray-600">${personalExpenses.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-1">❌ Not deductible</p>
              </div>
            </div>
          </div>

          {/* Enhanced Write-offs Section */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-800 mb-4">🏷️ Write-offs Summary</h2>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-3xl font-bold text-green-600">${writeOffTotal.toFixed(2)}</p>
                <p className="text-sm text-green-700">
                  From {transactions.filter(tx => tx.writeOff?.isWriteOff).length} transactions
                </p>
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm text-green-600">
                  💰 Potential tax savings: <strong>${(writeOffTotal * 0.25).toFixed(2)}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Tax Estimation */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">💼 Tax Estimation</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Gross Income:</span>
                <span className="font-semibold">${totalIncome.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Business Deductions:</span>
                <span className="font-semibold text-green-600">-${businessExpenses.toFixed(2)}</span>
              </div>
              <div className="border-t border-yellow-300 pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Taxable Income:</span>
                  <span className="font-semibold">${(totalIncome - businessExpenses).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-yellow-100 p-2 rounded">
                <span className="font-semibold">Estimated Tax Owed (25%):</span>
                <span className="font-bold text-yellow-700 text-lg">${estimatedTaxOwed.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-yellow-700 mt-3">
              * This is a rough estimate. Consult a tax professional for accurate calculations.
            </p>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition flex items-center gap-2"
          >
            📄 Print or Save as PDF
          </button>
          
          <button
            onClick={generateAISummary}
            disabled={loadingAI}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 disabled:bg-gray-400 transition flex items-center gap-2"
          >
            🔄 Refresh AI Summary
          </button>

          <button
            onClick={() => window.location.href = '/transactions'}
            className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition flex items-center gap-2"
          >
            📊 View Transactions
          </button>
        </div>
      </div>
    </div>
  );
}