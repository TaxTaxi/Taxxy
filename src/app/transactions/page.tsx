"use client";

import { useEffect, useState } from "react";
import { useTransactionStore } from "@/store/transactionStore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TransactionsPage() {
  const {
    transactions,
    addTransaction,
    updateTag,
    updatePurpose,
    tagAllTransactionsWithAI,
    removeTransaction,
    markAsReviewed,
  } = useTransactionStore();

  const [form, setForm] = useState({ description: "", amount: "", date: "" });
  const [tagFilter, setTagFilter] = useState<string>("");
  const [reviewFilter, setReviewFilter] = useState<"all" | "reviewed" | "unreviewed">("all");

  useEffect(() => {
    useTransactionStore.getState().loadTransactionsFromFirestore();
  }, []);

  function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    const newTransaction = {
      description: form.description,
      amount: parseFloat(form.amount),
      date: form.date,
    };
    addTransaction(newTransaction);
    setForm({ description: "", amount: "", date: "" });
  }

  async function handleTestAITagging() {
    await tagAllTransactionsWithAI();
  }

  const tags = Array.from(new Set(transactions.map((t) => t.tag).filter(Boolean)));

  const filteredTransactions = transactions
    .filter((t) => (tagFilter ? t.tag === tagFilter : true))
    .filter((t) => {
      if (reviewFilter === "reviewed") return t.reviewed === true;
      if (reviewFilter === "unreviewed") return t.reviewed !== true;
      return true;
    });

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Transactions</h1>

      <form onSubmit={handleAddTransaction} className="grid gap-4 max-w-md mb-6">
        <input
          type="text"
          placeholder="Description"
          className="p-2 border border-gray-300 rounded text-black"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          type="number"
          placeholder="Amount"
          className="p-2 border border-gray-300 rounded text-black"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <input
          type="date"
          className="p-2 border border-gray-300 rounded text-black"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <button
          type="submit"
          className="bg-black text-white rounded px-4 py-2 hover:bg-gray-800"
        >
          Add Transaction
        </button>
      </form>

      <div className="mb-4 flex gap-6">
        <div>
          <label className="mr-2 text-gray-700 font-medium">Filter by Review Status:</label>
          <select
            value={reviewFilter}
            onChange={(e) => setReviewFilter(e.target.value as any)}
            className="p-2 border border-gray-300 rounded text-black"
          >
            <option value="all">All</option>
            <option value="reviewed">Reviewed</option>
            <option value="unreviewed">Unreviewed</option>
          </select>
        </div>

        <div>
          <label className="mr-2 text-gray-700 font-medium">Filter by Tag:</label>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded text-black"
          >
            <option value="">All</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleTestAITagging}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-6 hover:bg-blue-700"
      >
        Test AI Tagging
      </button>

      <div className="space-y-4">
        {filteredTransactions.map((t) => (
          <div
            key={t.id}
            className="bg-white p-4 rounded shadow border-l-4"
            style={{
              borderColor: t.confidence !== undefined && t.confidence < 0.7 ? "orange" : "transparent",
            }}
          >
            <div className="mb-2">
              <div className="font-medium text-gray-800">{t.description}</div>
              <div className="text-sm text-gray-500">Date: {t.date}</div>
              <div className="text-sm text-gray-500">Amount: ${t.amount}</div>

              <div className="text-sm text-gray-500 mt-2">
                Tag:
                <input
                  type="text"
                  defaultValue={t.tag || ""}
                  placeholder="Edit tag"
                  className="border border-gray-300 p-1 rounded text-sm text-black ml-1"
                  onBlur={(e) => {
                    const newTag = e.target.value.trim();
                    updateTag(t.id, newTag);
                  }}
                />
              </div>

              <div className="text-sm text-gray-500 mt-2">
                Purpose:
                <select
                  className="ml-2 border border-gray-300 p-1 rounded text-sm text-black"
                  value={t.purpose || ""}
                  onChange={(e) => {
                    const newPurpose = e.target.value as "business" | "personal";
                    updatePurpose(t.id, newPurpose);
                  }}
                >
                  <option value="">(unknown)</option>
                  <option value="business">Business</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              {t.confidence !== undefined && (
                <div className="text-sm text-gray-400">
                  Confidence: {Math.round(t.confidence * 100)}%
                </div>
              )}

              {t.confidence !== undefined && t.confidence < 0.7 && (
                <div className="text-xs text-orange-600 mt-1">
                  ⚠️ Low confidence — please review this tag.
                </div>
              )}

              {t.writeOff?.reason && (
                <div className="text-xs mt-1 text-green-700 italic">
                  🧾 Write-off reason: {t.writeOff.reason}
                </div>
              )}

              {!t.reviewed ? (
                <button
                  onClick={() => markAsReviewed(t.id)}
                  className="text-xs text-blue-600 hover:underline mt-1"
                >
                  ✅ Mark as Reviewed
                </button>
              ) : (
                <div className="text-xs text-green-600 mt-1">✅ Reviewed</div>
              )}
            </div>

            <div className="flex justify-between items-end">
              <button
                onClick={async () => {
                  if (!t.description || !t.purpose) {
                    console.warn("❌ Missing description or purpose for write-off AI");
                    return;
                  }

                  const response = await fetch("/api/writeoff", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      description: t.description,
                      purpose: t.purpose,
                    }),
                  });

                  const result = await response.json();
                  console.log("🧠 Write-Off Suggestion for", t.description, ":", result);

                  if (t.firestoreId && result.writeOff) {
                   await updateDoc(doc(db, "transactions", t.firestoreId), {
  writeOff: {
    ...result.writeOff,
    isWriteOff: true,
  },
});

                    console.log("✅ Updated write-off in Firestore for", t.description);
                  }
                }}
                className="bg-purple-600 text-white px-2 py-2 rounded hover:bg-purple-700"
              >
                Test Write-Off Suggestion
              </button>

              <button
                onClick={() => removeTransaction(t.id)}
                className="text-red-500 hover:underline text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
