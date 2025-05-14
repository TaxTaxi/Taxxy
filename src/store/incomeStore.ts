import { create } from "zustand";
import {
  collection,
  addDoc,
  getDocs,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ✅ Define the shape of income entries
export interface Income {
  id: number;
  name: string;
  amount: number;
  date: string;
  frequency?: "once" | "weekly" | "monthly" | "yearly";
}

type IncomeState = {
  incomeItems: Income[];
  addIncome: (item: Income) => void;
  removeIncome: (id: number) => void;
  setIncome: (items: Income[]) => void;
  loadIncomeFromFirestore: () => void; // ✅ new
};

export const useIncomeStore = create<IncomeState>((set, get) => ({
  incomeItems: [],

  addIncome: async (item) => {
    await addDoc(collection(db, "income"), item);
    const updated = [...get().incomeItems, item];
    set({ incomeItems: updated });
  },

  removeIncome: (id) => {
    const updated = get().incomeItems.filter((i) => i.id !== id);
    set({ incomeItems: updated });
  },

  setIncome: (items) => {
    set({ incomeItems: items });
  },

  loadIncomeFromFirestore: async () => {
    const q = query(collection(db, "income"));
    const snapshot = await getDocs(q);

    const loaded: Income[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      loaded.push({
        id: Date.now() + Math.random(), // temporary local ID
        name: data.name,
        amount: data.amount,
        date: data.date,
        frequency: data.frequency,
      });
    });

    set({ incomeItems: loaded });
  },
}));
