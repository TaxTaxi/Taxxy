// src/app/settings/page.tsx
"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";

export default function SettingsPage() {
  const { settings, loadSettings, updateSetting } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Settings</h1>

      {/* Tax Rate Setting */}
      <div className="mb-4">
        <label className="text-white block mb-1">Tax Rate (%)</label>
        <input
          type="number"
          value={settings.taxRate * 100}
          onChange={(e) =>
            updateSetting({ taxRate: parseFloat(e.target.value) / 100 })
          }
          className="w-full p-2 rounded border border-gray-300 text-grey-300"
        />
      </div>

      {/* Income Type */}
      <div className="mb-4">
        <label className="text-white block mb-1">Default Income Type</label>
        <select
          value={settings.incomeType}
          onChange={(e) => updateSetting({ incomeType: e.target.value })}
          className="w-full p-2 rounded border border-gray-300 text-grey-300"
        >
          <option value="freelance">Freelance</option>
          <option value="w2">W-2</option>
          <option value="contractor">Contractor</option>
        </select>
      </div>

      {/* AI Review Toggle */}
      <div className="mb-4">
        <label className="text-white block mb-1">Auto-Review AI Tags</label>
        <input
          type="checkbox"
          checked={settings.autoReview}
          onChange={(e) => updateSetting({ autoReview: e.target.checked })}
        />
      </div>

      {/* AI Write-Off Toggle */}
      <div className="mb-4">
        <label className="text-white block mb-1">Auto-Suggest Write-Offs</label>
        <input
          type="checkbox"
          checked={settings.autoWriteoff}
          onChange={(e) => updateSetting({ autoWriteoff: e.target.checked })}
        />
      </div>
    </div>
  );
}
