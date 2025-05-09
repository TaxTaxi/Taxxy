import { create } from "zustand";

// ✅ Define what an Income entry looks like
export interface Income {
  id: number;
  name: string;
  amount: number;
  date: string;
  frequency?: "once" | "weekly" | "monthly" | "yearly";
}

// ✅ Define the Zustand state and actions
type IncomeState = {
  incomeItems: Income[];
  addIncome: (item: Income) => void;
  removeIncome: (id: number) => void;
  setIncome: (items: Income[]) => void;
  loadIncomeFromStorage: () => void; // ✅ new method
};

// ✅ Zustand store with built-in localStorage sync and manual loader
export const useIncomeStore = create<IncomeState>((set, get) => ({
  incomeItems: [],

  // ✅ Add income and save
  addIncome: (item) => {
    const updated = [...get().incomeItems, item];
    set({ incomeItems: updated });
    localStorage.setItem("taxxy_income", JSON.stringify(updated));
  },

  // ✅ Remove income and save
  removeIncome: (id) => {
    const updated = get().incomeItems.filter((i) => i.id !== id);
    set({ incomeItems: updated });
    localStorage.setItem("taxxy_income", JSON.stringify(updated));
  },

  // ✅ Replace all income items and save
  setIncome: (items) => {
    set({ incomeItems: items });
    localStorage.setItem("taxxy_income", JSON.stringify(items));
  },

  // ✅ Load income once on client mount (call this from useEffect)
  loadIncomeFromStorage: () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("taxxy_income");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            set({ incomeItems: parsed });
          }
        } catch {
          // ignore bad localStorage
        }
      }
    }
  },
}));
