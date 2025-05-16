"use client";

import { useEffect, useState } from "react";
import { useTransactionStore } from "@/store/transactionStore";

export default function TransactionsPage() {
  const {
    transactions,
    addTransaction,
    updateCategory,
    tagAllTransactionsWithAI,
    updateTag,
  } = useTransactionStore();

  const [form, setForm] = useState({
    description: "",
    amount: "",
    date: "",
    category: "unassigned",
  });

  // ✅ Load transactions and run AI tagging
  useEffect(() => {
    const loadAndTag = async () => {
      await useTransactionStore.getState().loadTransactionsFromFirestore();
      await useTransactionStore.getState().tagAllTransactionsWithAI();
    };
    loadAndTag();
  }, []);

  function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    const newTransaction = {
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

      {/* Optional: form UI if needed in demo */}
      {/* <form onSubmit={handleAddTransaction}>...</form> */}
<form onSubmit={handleAddTransaction} className="mb-6 grid gap-3 max-w-lg">
  <input
    className="p-2 border border-gray-300 rounded text-black"
    placeholder="Description"
    value={form.description}
    onChange={(e) => setForm({ ...form, description: e.target.value })}
  />
  <input
    className="p-2 border border-gray-300 rounded text-black"
    placeholder="Amount"
    type="number"
    value={form.amount}
    onChange={(e) => setForm({ ...form, amount: e.target.value })}
  />
  <input
    className="p-2 border border-gray-300 rounded text-black"
    type="date"
    value={form.date}
    onChange={(e) => setForm({ ...form, date: e.target.value })}
  />
  <button className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition">
    Add Transaction
  </button>
</form>

      <div className="space-y-4">
        {transactions.map((t) => (
          <div key={t.id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-800">{t.description}</div>
                <div className="text-sm text-gray-500">{t.date}</div>
                <div className="text-sm text-gray-400">Category: {t.category}</div>
                {t.tag && (
                  <div className="mt-1 space-y-1">
                    <div className="text-xs text-blue-500">Tag: {t.tag}</div>
                    {t.confidence !== undefined && (
                      <div className="text-xs text-gray-400">
                        Confidence: {(t.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                )}
                <input
                  type="text"
                  className="border border-gray-300 p-2 rounded text-sm text-black mt-2"
                  placeholder="Add a tag"
                  defaultValue={t.tag || ""}
                  onBlur={(e) => {
                    const tag = e.target.value.trim();
                    updateTag(t.id, tag);
                  }}
                />
              </div>
              <div className="text-lg font-semibold text-green-700">${t.amount}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
