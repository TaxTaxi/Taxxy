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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-100 mb-4">Transactions</h1>
        <div className="text-sm text-gray-400">
          {transactions.length} total transactions
        </div>
      </div>

      <button
        onClick={() =>
          addTransaction({
            description: "Zoom Pro Subscription",
            amount: 20,
            date: "2025-05-28",
            category: "software",
            purpose: "business",
          })
        }
        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors"
      >
        Add Test Transaction
      </button>

      <div className="mt-6 space-y-1">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">No transactions yet</p>
            <p className="text-sm">Add your first transaction to get started</p>
          </div>
        ) : (
          transactions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((tx, index) => (
            <div key={tx.id}>
              <div className="bg-white rounded-lg shadow-sm p-5 text-gray-800 hover:shadow-md transition-shadow">
                {/* Main transaction info */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{tx.description}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="font-medium">{new Date(tx.date).toLocaleDateString()}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                        {tx.category || "Unassigned"}
                      </span>
                      {tx.purpose && (
                        <span className="px-2 py-1 rounded text-xs font-medium" style={{
                          backgroundColor: tx.purpose === "business" ? "#dbeafe" : "#f3f4f6",
                          color: tx.purpose === "business" ? "#1d4ed8" : "#374151"
                        }}>
                          {tx.purpose}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`text-xl font-bold ${
                      tx.amount >= 0 ? "text-green-600" : "text-red-600"
                    }`} style={{
                      color: tx.amount >= 0 ? "#16a34a" : "#dc2626"
                    }}>
                      {tx.amount >= 0 ? "+" : ""}${tx.amount.toFixed(2)}
                    </div>
                    {tx.confidence && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                        backgroundColor: tx.confidence >= 90 ? "#f0f9f0" : tx.confidence >= 70 ? "#fffbeb" : "#fef2f2",
                        color: tx.confidence >= 90 ? "#16a34a" : tx.confidence >= 70 ? "#d97706" : "#dc2626"
                      }}>
                        {tx.confidence >= 90 ? "High" : tx.confidence >= 70 ? "Medium" : "Low"} ({tx.confidence}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Additional details */}
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  {tx.tag && (
                    <span className="flex items-center gap-1">
                      <span className="text-blue-500">#</span>
                      {tx.tag}
                    </span>
                  )}
                  
                  {tx.writeOff?.isWriteOff && (
                    <span className="flex items-center gap-1" style={{ color: "#16a34a" }}>
                      <span>✓</span>
                      Write-off: {tx.writeOff.reason}
                    </span>
                  )}
                  
                  {!tx.reviewed && tx.confidence && tx.confidence < 70 && (
                    <span className="flex items-center gap-1" style={{ color: "#ea580c" }}>
                      <span>⚠</span>
                      Needs Review
                    </span>
                  )}
                  
                  {tx.reviewed && (
                    <span className="flex items-center gap-1" style={{ color: "#16a34a" }}>
                      <span>✓</span>
                      Reviewed
                    </span>
                  )}

                  {!tx.reviewed && tx.confidence && tx.confidence >= 70 && (
                    <span className="flex items-center gap-1" style={{ color: "#6b7280" }}>
                      <span>🤖</span>
                      AI Classified
                    </span>
                  )}
                </div>
              </div>
              
              {/* Separator line between transactions */}
              {index < transactions.length - 1 && (
                <div className="border-b border-gray-200 my-3"></div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary stats at bottom */}
      {transactions.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-600">Total Income</h3>
            <p className="text-2xl font-bold" style={{ color: "#16a34a" }}>
              ${transactions.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-600">Total Expenses</h3>
            <p className="text-2xl font-bold" style={{ color: "#dc2626" }}>
              ${Math.abs(transactions.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0)).toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-600">Net Balance</h3>
            <p className="text-2xl font-bold text-gray-900">
              ${transactions.reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}