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
    <div className="p-8 max-w-2xl mx-auto bg-white text-black rounded shadow">
      <h1 className="text-3xl font-bold mb-6">Transactions</h1>

      <form onSubmit={handleAddTransaction} className="grid gap-4 mb-8">
        <input
          className="p-2 rounded border text-black"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          className="p-2 rounded border text-black"
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <input
          className="p-2 rounded border text-black"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <select
          className="p-2 rounded border text-black"
          value={form.category}
          onChange={(e) =>
            setForm({
              ...form,
              category: e.target.value as "income" | "expense" | "unassigned",
            })
          }
        >
          <option value="unassigned">Unassigned</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <button className="bg-black text-white py-2 rounded hover:bg-gray-800">
          Add Transaction
        </button>
      </form>

      <div className="space-y-4">
        {transactions.map((t) => (
          <div key={t.id} className="bg-white p-4 rounded shadow flex justify-between">
            <div>
              <div className="font-medium">{t.description}</div>
              <div className="text-sm text-gray-500">{t.date}</div>
              <div className="text-sm text-gray-400">Category: {t.category}</div>
            </div>
            <div className="text-lg font-semibold text-green-700">${t.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
