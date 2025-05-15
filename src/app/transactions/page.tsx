"use client";

import { useEffect, useState } from "react";
import { useTransactionStore } from "@/store/transactionStore";
import { aiTagTransactions } from "@/utils/aiAutoTag";

// 🔮 Very basic AI-like logic — to be replaced later with real AI
function mockAIAssistantTag(description: string): string {
  const desc = description.toLowerCase();
  if (desc.includes("rent")) return "Rent";
  if (desc.includes("uber") || desc.includes("lyft")) return "Transport";
  if (desc.includes("stripe") || desc.includes("payroll")) return "W-2";
  if (desc.includes("freelance") || desc.includes("consulting")) return "1099";
  if (desc.includes("grocery") || desc.includes("whole foods")) return "Food";
  return "Other";
}

export default function TransactionsPage() {
  const { transactions, addTransaction, updateCategory, updateTag } = useTransactionStore();

  const [form, setForm] = useState({
    description: "",
    amount: "",
    date: "",
    category: "unassigned",
  });

  const [selectedTag, setSelectedTag] = useState("all");

  // ✅ Load transactions from Firestore once on mount
  useEffect(() => {
    useTransactionStore.getState().loadTransactionsFromFirestore();
  }, []);

  // ✅ Handle new transaction
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

  // ✅ Extract unique tags for dropdown
  const tags = Array.from(new Set(transactions.map((t) => t.tag).filter(Boolean)));

  // ✅ Apply filtering
  const filteredTransactions = selectedTag === "all"
    ? transactions
    : transactions.filter((t) => t.tag === selectedTag);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Transactions</h1>

<button
  onClick={() => useTransactionStore.getState().aiTagTransactions()}
  className="bg-blue-600 text-white px-4 py-2 rounded"
>
  🧠 Auto-tag all
</button>

<button
  onClick={() => {
    transactions.forEach((tx) => {
      const suggestedTag = mockAIAssistantTag(tx.description);
      useTransactionStore.getState().updateTag(tx.id, suggestedTag);
    });
  }}
  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6"
>
  🤖 Tag All with AI
</button>
      {/* 🔽 Tag Filter */}
      <div className="mb-6 max-w-sm">
        <label className="block text-sm text-gray-600 mb-1">Filter by tag</label>
        <select
          className="p-2 rounded border border-gray-300 text-black w-full"
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
        >
          <option value="all">All</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      {/* 🧾 List of filtered transactions */}
      <div className="space-y-4">
        {filteredTransactions.map((t) => (
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
