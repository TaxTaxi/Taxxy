"use client";

import { useEffect, useState } from "react";
import { useTransactionStore } from "@/store/transactionStore";

export default function TransactionsPage() {
  const { transactions, addTransaction, updateCategory } = useTransactionStore();

  const [form, setForm] = useState({
    description: "",
    amount: "",
    date: "",
    category: "unassigned",
  });

  // ✅ Load data from Firestore on first load
  useEffect(() => {
    useTransactionStore.getState().loadTransactionsFromFirestore();
  }, []);

  // ✅ Handle form submission
  function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();

    const newTransaction = {
      id: Date.now(),
      description: form.description,
      amount: parseFloat(form.amount),
      date: form.date,
      category: form.category as "income" | "expense" | "unassigned",
    };

    addTransaction(newTransaction);
    setForm({ description: "", amount: "", date: "", category: "unassigned" });
  }

  return (
  <div className="min-h-screen bg-gray-100 p-8">
    <h1 className="text-3xl font-bold mb-6 text-gray-800">Transactions</h1>

    {/* Optional: Form to add transactions can go here later */}

    <div className="space-y-4">
      {transactions.map((t) => (
        <div key={t.id} className="bg-white p-4 rounded shadow">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium text-gray-800">{t.description}</div>
              <div className="text-sm text-gray-500">{t.date}</div>
              <div className="text-sm text-gray-400">Category: {t.category}</div>
              {t.tag && (
                <div className="text-xs text-blue-500 mt-1">Tag: {t.tag}</div>
              )}
              <input
                type="text"
                className="border border-gray-300 p-2 rounded text-sm text-black mt-2"
                placeholder="Add a tag (e.g., Rent, W-2, Bonus)"
                defaultValue={t.tag || ""}
                onBlur={(e) => {
                  const tag = e.target.value.trim();
                  useTransactionStore.getState().updateTag(t.id, tag);
                }}
              />
            </div>
            <div className="text-lg font-semibold text-green-700">
              ${t.amount}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
}