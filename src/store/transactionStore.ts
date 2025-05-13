import { create } from "zustand";
import {
  collection,
  addDoc,
  getDocs,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ✅ Define what a transaction looks like
export interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: "income" | "expense" | "unassigned";
}

// ✅ Define Zustand store shape
type TransactionState = {
  transactions: Transaction[];
  setTransactions: (items: Transaction[]) => void;
  addTransaction: (item: Transaction) => void;
  updateCategory: (id: number, category: Transaction["category"]) => void;
  loadTransactionsFromFirestore: () => void;
};

// ✅ Create Zustand store with Firestore integration
export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],

  // Replace all transactions
  setTransactions: (items) => set({ transactions: items }),

  // Add new transaction (and save to Firestore)
  addTransaction: async (item) => {
    console.log("🟡 Attempting to save transaction:", item);

    try {
      await addDoc(collection(db, "transactions"), {
        ...item,
      });

      const newItem = { ...item, id: Date.now() }; // Local fallback ID
      set((state) => ({
        transactions: [...state.transactions, newItem],
      }));

      console.log("✅ Saved to Firestore!");
    } catch (err) {
      console.error("❌ Firestore save failed:", err);
    }
  },

  // Update the category of a transaction
  updateCategory: async (id, category) => {
    const updated = get().transactions.map((tx) =>
      tx.id === id ? { ...tx, category } : tx
    );
    set({ transactions: updated });

    // (Optional) If using Firestore doc IDs later, add update logic here
  },

  // Load all transactions from Firestore into Zustand
  loadTransactionsFromFirestore: async () => {
    const q = query(collection(db, "transactions"));
    const snapshot = await getDocs(q);

    const data: Transaction[] = [];
    snapshot.forEach((doc) => {
      const t = doc.data();
      data.push({
        id: Date.now() + Math.random(), // Local fallback ID
        description: t.description,
        amount: t.amount,
        date: t.date,
        category: t.category,
      });
    });

    console.log("📥 Loaded transactions from Firestore:", data);
    set({ transactions: data });
  },
}));
