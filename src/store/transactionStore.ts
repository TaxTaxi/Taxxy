import { create } from "zustand";
import {
  collection,
  addDoc,
  getDocs,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ✅ Define a transaction type
export interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: "income" | "expense" | "unassigned";
  tag?: string; // ✅ NEW: user-defined tag like "W-2", "Rent", etc.
}

// ✅ Define input structure for new transactions (without id/category)
type NewTransactionInput = {
  description: string;
  amount: number;
  date: string;
};

// ✅ Zustand state type
type TransactionState = {
  transactions: Transaction[];
  setTransactions: (items: Transaction[]) => void;
  addTransaction: (item: Transaction) => void;
  updateCategory: (id: number, category: Transaction["category"]) => void;
  loadTransactionsFromFirestore: () => void;
  updateTag: (id: number, tag: string) => void; // ✅ NEW
};

// ✅ Zustand store implementation
export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],

  setTransactions: (items) => set({ transactions: items }),

  addTransaction: async (item: NewTransactionInput) => {
    // Create a full transaction object (id + default category)
    const newItem: Transaction = {
      id: Date.now(),
      category: "unassigned",
      ...item,
    };

    // Save to Firestore
    await addDoc(collection(db, "transactions"), newItem);

    // Update Zustand
    set((state) => ({
      transactions: [...state.transactions, newItem],
    }));
  },

  updateCategory: async (id, category) => {
    const updated = get().transactions.map((tx) =>
      tx.id === id ? { ...tx, category } : tx
    );
    set({ transactions: updated });

    // Optional Firestore sync
  },

  updateTag: (id, tag) => {
  const updated = get().transactions.map((tx) =>
    tx.id === id ? { ...tx, tag } : tx
  );
  set({ transactions: updated });

  // Optional: update Firestore if you're storing full tags there
},

  loadTransactionsFromFirestore: async () => {
    const q = query(collection(db, "transactions"));
    const snapshot = await getDocs(q);

    const data: Transaction[] = [];
    snapshot.forEach((doc) => {
      const t = doc.data();
      data.push({
        id: Date.now() + Math.random(), // placeholder id
        description: t.description,
        amount: t.amount,
        date: t.date,
        category: t.category,
      });
    });

    set({ transactions: data });
  },
}));
