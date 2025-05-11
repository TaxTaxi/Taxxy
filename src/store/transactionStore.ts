import { create } from "zustand";

// ✅ Define what a transaction looks like
export interface Transaction {
  id: number;
  name: string;
  amount: number;
  date: string;
  category?: "income" | "bill" | "writeoff" | "other";
  flagged?: boolean;
}

// ✅ Define the Zustand store
type TransactionState = {
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  setTransactions: (txs: Transaction[]) => void;
  updateCategory: (id: number, category: Transaction["category"]) => void;
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],

  addTransaction: (tx) => {
    const updated = [...get().transactions, tx];
    set({ transactions: updated });
    localStorage.setItem("taxxy_transactions", JSON.stringify(updated));
  },

  setTransactions: (txs) => {
    set({ transactions: txs });
    localStorage.setItem("taxxy_transactions", JSON.stringify(txs));
  },

  updateCategory: (id, category) => {
    const updated = get().transactions.map((tx) =>
      tx.id === id ? { ...tx, category } : tx
    );
    set({ transactions: updated });
    localStorage.setItem("taxxy_transactions", JSON.stringify(updated));
  },
}));
