// src/components/Summary.tsx
"use client";

import { useTransactionStore } from "@/store/transactionStore";

export default function Summary() {
  const { transactions } = useTransactionStore();

  const total = transactions.length;
  const unreviewed = transactions.filter((t) => !t.reviewed).length;
  const lowConfidence = transactions.filter((t) => (t.confidence ?? 1) < 0.7).length;
  const business = transactions.filter((t) => t.purpose === "business").length;
  const personal = transactions.filter((t) => t.purpose === "personal").length;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-6">
      <div className="bg-white p-4 rounded shadow">
        <div className="text-sm text-gray-500">Total Transactions</div>
        <div className="text-2xl font-bold text-gray-800">{total}</div>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <div className="text-sm text-gray-500">Unreviewed</div>
        <div className="text-2xl font-bold text-gray-800">{unreviewed}</div>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <div className="text-sm text-gray-500">Low Confidence</div>
        <div className="text-2xl font-bold text-gray-800">{lowConfidence}</div>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <div className="text-sm text-gray-500">Business / Personal</div>
        <div className="text-2xl font-bold text-gray-800">
          {business} / {personal}
        </div>
      </div>
    </div>
  );
}
