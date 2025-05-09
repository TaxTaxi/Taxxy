"use client";

import { useEffect, useRef, useState } from "react";
import { useIncomeStore, Income } from "@/store/incomeStore";

// ✅ This page lets you add, view, and delete income items
export default function IncomePage() {
  const { incomeItems, addIncome, removeIncome } = useIncomeStore();
  
  useEffect(() => {
    useIncomeStore.getState().loadIncomeFromStorage();
  }, []);
  
  // ✅ Form state for adding a new income entry
  const [form, setForm] = useState<{
    name: string;
    amount: string;
    date: string;
    frequency: "once" | "weekly" | "monthly" | "yearly" | "";
  }>({
    name: "",
    amount: "",
    date: "",
    frequency: "",
  });

  // ✅ Handle submitting the income form
  function handleAddIncome(e: React.FormEvent) {
    e.preventDefault();

    const newIncome: Income = {
      id: Date.now(),
      name: form.name || "Income",
      amount: parseFloat(form.amount) || 0,
      date: form.date || new Date().toISOString(),
      frequency: form.frequency || "once",
    };

    addIncome(newIncome);
    setForm({ name: "", amount: "", date: "", frequency: "" });
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Income</h1>

      {/* 👇 Income entry form */}
      <form onSubmit={handleAddIncome} className="mb-8 grid gap-4 max-w-xl">
        <input
          className="p-2 rounded border border-gray-300 text-black"
          placeholder="Income source"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="p-2 rounded border border-gray-300 text-black"
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <input
          className="p-2 rounded border border-gray-300 text-black"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <select
          className="p-2 rounded border border-gray-300 text-black"
          value={form.frequency}
          onChange={(e) =>
            setForm({
              ...form,
              frequency: e.target.value as "once" | "weekly" | "monthly" | "yearly" | "",
            })
          }
        >
          <option value="">Select frequency</option>
          <option value="once">One-time</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>

        <button className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition">
          Add Income
        </button>
      </form>

      {/* 👇 Render list of income entries */}
      <div className="grid gap-6 max-w-xl">
        {incomeItems.length === 0 ? (
          <p className="text-gray-500">No income added yet.</p>
        ) : (
          incomeItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow p-6 flex justify-between items-center"
            >
              <div>
                <div className="text-lg font-medium text-gray-800">{item.name}</div>
                <div className="text-sm text-gray-500">Date: {item.date}</div>
                {item.frequency && (
                  <div className="text-sm text-gray-400">Repeats: {item.frequency}</div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xl font-semibold text-green-600">${item.amount}</div>
                <button
                  onClick={() => removeIncome(item.id)}
                  className="text-sm text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
