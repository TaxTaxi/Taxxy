// src/store/settingsStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabase";

type Settings = {
  taxRate: number;
  incomeType: string;
  autoReview: boolean;
  autoWriteoff: boolean;
};

type SettingsState = {
  settings: Settings;
  loadSettings: () => Promise<void>;
  updateSetting: (updates: Partial<Settings>) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {
    taxRate: 0.25,
    incomeType: "freelance",
    autoReview: false,
    autoWriteoff: false,
  },

  loadSettings: async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      console.error("⚠️ No user found:", authError);
      return;
    }

    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("❌ Error loading settings:", error);
      return;
    }

    if (data) {
      set({ settings: data });
    } else {
      // If no settings yet, create default
      const defaults = {
        user_id: user.id,
        taxRate: 0.25,
        incomeType: "freelance",
        autoReview: false,
        autoWriteoff: false,
      };

      const { data: created, error: insertError } = await supabase
        .from("settings")
        .insert(defaults)
        .select()
        .single();

      if (insertError) {
        console.error("❌ Failed to insert default settings:", insertError);
        return;
      }

      set({ settings: created });
    }
  },

  updateSetting: async (updates) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("settings")
      .update(updates)
      .eq("user_id", user.id);

    if (error) {
      console.error("❌ Failed to update settings:", error);
      return;
    }

    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));
  },
}));
