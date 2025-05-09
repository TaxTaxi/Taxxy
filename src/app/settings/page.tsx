"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  // ✅ Real values
  const [taxRate, setTaxRate] = useState("25");
  const [defaultIncomeType, setDefaultIncomeType] = useState("1099");

  // 🧪 Placeholder toggles for future AI features
  const [aiAutocomplete, setAiAutocomplete] = useState(true);
  const [aiInsights, setAiInsights] = useState(true);
  const [autoSaveBills, setAutoSaveBills] = useState(false);
  const [showTaxPrompts, setShowTaxPrompts] = useState(true);

  // ✅ Load saved values
  useEffect(() => {
    const storedTax = localStorage.getItem("taxxy_tax_rate");
    const storedIncomeType = localStorage.getItem("taxxy_income_type");
    if (storedTax) setTaxRate(storedTax);
    if (storedIncomeType) setDefaultIncomeType(storedIncomeType);
  }, []);

  // ✅ Save changes
  useEffect(() => {
    localStorage.setItem("taxxy_tax_rate", taxRate);
    localStorage.setItem("taxxy_income_type", defaultIncomeType);
  }, [taxRate, defaultIncomeType]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Settings</h1>

      <div className="bg-white shadow rounded-xl p-6 max-w-xl space-y-6 text-gray-800">
        {/* ✅ Real: Tax Rate */}
        <div>
          <label className="block font-medium mb-1">Estimated Tax Rate (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            className="p-2 border rounded w-full text-black"
          />
        </div>

        {/* ✅ Real: Income Type */}
        <div>
          <label className="block font-medium mb-1">Default Income Type</label>
          <select
            value={defaultIncomeType}
            onChange={(e) => setDefaultIncomeType(e.target.value)}
            className="p-2 border rounded w-full text-black"
          >
            <option value="1099">1099 (Self-Employed)</option>
            <option value="w2">W-2 (Employee)</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        {/* 🔘 Future Toggles */}
        <div className="border-t pt-4 space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">AI Autocomplete</span>
            <input
              type="checkbox"
              checked={aiAutocomplete}
              onChange={() => setAiAutocomplete(!aiAutocomplete)}
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">AI Insights & Nudges</span>
            <input
              type="checkbox"
              checked={aiInsights}
              onChange={() => setAiInsights(!aiInsights)}
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">Auto-Save Bills from Bank</span>
            <input
              type="checkbox"
              checked={autoSaveBills}
              onChange={() => setAutoSaveBills(!autoSaveBills)}
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">Show Tax Prompts ("Is this taxed?")</span>
            <input
              type="checkbox"
              checked={showTaxPrompts}
              onChange={() => setShowTaxPrompts(!showTaxPrompts)}
              className="w-5 h-5"
            />
          </label>
        </div>

        <p className="text-sm text-gray-500">
          These features are coming in Stage 2+ and will help your assistant get smarter over time.
        </p>
      </div>
    </div>
  );
}
