// src/store/correctionStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface Correction {
  id: string;
  original_tag: string;
  corrected_tag: string;
  original_purpose?: "business" | "personal";
  corrected_purpose?: "business" | "personal";
  reason?: string;
  transaction_description: string;
  date: string;
  user_id?: string;
}

type CorrectionState = {
  corrections: Correction[];
  setCorrections: (items: Correction[]) => void;
  loadCorrections: () => Promise<void>;
  addCorrection: (item: Omit<Correction, "id">) => Promise<void>;
};

export const useCorrectionStore = create<CorrectionState>((set) => ({
  corrections: [],

  setCorrections: (items) => set({ corrections: items }),

  loadCorrections: async () => {
    const { data, error } = await supabase.from("corrections").select("*");
    if (error) {
      console.error("❌ Error loading corrections:", error);
      return;
    }
    set({ corrections: data });
  },

  addCorrection: async (item) => {
    const { data, error } = await supabase
      .from("corrections")
      .insert([item])
      .select();

    if (error || !data || !data[0]) {
      console.error("❌ Supabase insert failed", error);
      return;
    }

    const newCorrection = data[0];
    set((state) => ({
      corrections: [...state.corrections, newCorrection],
    }));
  },
}));
