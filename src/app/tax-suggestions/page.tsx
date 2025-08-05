"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // ✅ Use your existing client

export default function TaxSuggestionsPage() {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Check login status on page load
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("🪪 Current User in Frontend:", user);
    };
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/ai-tax-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, amount }),
      });

      const json = await res.json();
      setResult(json);
    } catch (err) {
      console.error("❌ Error fetching AI suggestion:", err);
      alert("Failed to fetch suggestion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">💡 Tax Suggestion Tester</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Loading..." : "Get AI Suggestion"}
        </button>
      </form>

      {result && result.success && (
        <div className="mt-8 p-4 border rounded bg-gray-100">
          <h2 className="text-xl font-semibold mb-2">✅ Suggestion Result:</h2>
          <p><strong>Category:</strong> {result.data.category}</p>
          <p><strong>Write-off?</strong> {result.data.writeOff ? "Yes" : "No"}</p>
          <p><strong>Notes:</strong> {result.data.notes}</p>
        </div>
      )}

      {result && !result.success && (
        <div className="mt-8 p-4 border rounded bg-red-100">
          <h2 className="text-xl font-semibold mb-2">❌ Error:</h2>
          <p>{result.error}</p>
          {result.details && <p className="text-sm mt-2">Details: {result.details}</p>}
        </div>
      )}

      <div className="p-4 bg-yellow-100 border rounded text-sm">
        ✅ Login check running. Check browser console for user info.
      </div>
    </div>
  );
}