// src/store/incomeStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface Income {
  id: string;
  description: string;
  amount: number;
  date: string;
  type?: string;
  user_id?: string;
}

type IncomeState = {
  income: Income[];
  setIncome: (items: Income[]) => void;
  loadIncome: () => Promise<void>;
  addIncome: (item: Omit<Income, "id" | "user_id">) => Promise<void>;
  removeIncome: (id: string) => Promise<void>;
};

export const useIncomeStore = create<IncomeState>((set, get) => ({
  income: [],

  setIncome: (items) => set({ income: items }),

  loadIncome: async () => {
    const { data, error } = await supabase.from("income").select("*");
    if (error) {
      console.error("❌ Error loading income:", error);
      return;
    }
    set({ income: data });
  },

  addIncome: async (item) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      console.error("❌ Auth error when adding income:", authError);
      return;
    }

    const itemWithUser = {
      ...item,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("income")
      .insert([itemWithUser])
      .select();

    if (error || !data || !data[0]) {
      console.error("❌ Supabase insert failed", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
      });
      return;
    }

    const newIncome = data[0];
    set((state) => ({
      income: [...state.income, newIncome],
    }));
  },

  removeIncome: async (id: string) => {
    const { error } = await supabase.from("income").delete().eq("id", id);
    if (error) {
      console.error("❌ Error deleting income:", error);
      return;
    }

    set((state) => ({
      income: state.income.filter((inc) => inc.id !== id),
    }));
  },
}));
