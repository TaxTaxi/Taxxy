// src/app/income/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useIncomeStore } from "@/store/incomeStore";

export default function IncomePage() {
  const { income, loadIncome, addIncome, removeIncome } = useIncomeStore();

  useEffect(() => {
    loadIncome();
  }, []);

  const [form, setForm] = useState({
    description: "",
    amount: "",
    date: "",
    type: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount || !form.date || !form.type) {
      alert("Please fill in all fields.");
      return;
    }

    await addIncome({
      description: form.description,
      amount: parseFloat(form.amount),
      date: form.date,
      type: form.type,
    });

    setForm({ description: "", amount: "", date: "", type: "" });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Income</h1>

      {/* 👇 Income entry form */}
      <form onSubmit={handleSubmit} className="mb-8 grid gap-4 max-w-xl">
        <input
          className="p-2 rounded border border-gray-300 text-black"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
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
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="">Select type</option>
          <option value="freelance">Freelance</option>
          <option value="w2">W-2</option>
          <option value="1099">1099</option>
          <option value="investment">Investment</option>
        </select>

        <button className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition">
          Add Income
        </button>
      </form>

      {/* 👇 Render list of income entries */}
      <div className="grid gap-6 max-w-xl">
        {income.length === 0 ? (
          <p className="text-gray-500">No income added yet.</p>
        ) : (
          income.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow p-6 flex justify-between items-center"
            >
              <div>
                <div className="text-lg font-medium text-gray-800">{item.description}</div>
                <div className="text-sm text-gray-500">Date: {item.date}</div>
                <div className="text-sm text-gray-400">Type: {item.type}</div>
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
