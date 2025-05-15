import { create } from "zustand";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
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
  tag?: string;
  firestoreId?: string; // Needed for updates in Firestore
}

// ✅ Zustand state type
type TransactionState = {
  transactions: Transaction[];
  setTransactions: (items: Transaction[]) => void;
  addTransaction: (item: Omit<Transaction, "id" | "category">) => void;
  updateCategory: (id: number, category: Transaction["category"]) => void;
  updateTag: (id: number, tag: string) => void;
  loadTransactionsFromFirestore: () => void;
  tagAllTransactionsWithAI: () => void;
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],

  setTransactions: (items) => set({ transactions: items }),

  addTransaction: async (item) => {
    const newItem: Transaction = {
      ...item,
      id: Date.now(),
      category: "unassigned",
    };

    const docRef = await addDoc(collection(db, "transactions"), newItem);
    newItem.firestoreId = docRef.id;

    set((state) => ({
      transactions: [...state.transactions, newItem],
    }));
  },

  updateCategory: (id, category) => {
    const updated = get().transactions.map((tx) =>
      tx.id === id ? { ...tx, category } : tx
    );
    set({ transactions: updated });
  },

  updateTag: async (id, tag) => {
    const tx = get().transactions.find((t) => t.id === id);
    if (!tx || !tx.firestoreId) return;

    const updated = get().transactions.map((t) =>
      t.id === id ? { ...t, tag } : t
    );
    set({ transactions: updated });

    await updateDoc(doc(db, "transactions", tx.firestoreId), { tag });
  },

  loadTransactionsFromFirestore: async () => {
    const q = query(collection(db, "transactions"));
    const snapshot = await getDocs(q);

    const data: Transaction[] = [];
    snapshot.forEach((docSnap) => {
      const t = docSnap.data();
      data.push({
        id: Date.now() + Math.random(),
        description: t.description,
        amount: t.amount,
        date: t.date,
        category: t.category || "unassigned",
        tag: t.tag,
        firestoreId: docSnap.id,
      });
    });

    set({ transactions: data });
  },

  tagAllTransactionsWithAI: async () => {
    const transactions = get().transactions;
    const openaiKey = process.env.NEXT_PUBLIC_OPENAI_KEY;

    if (!openaiKey) {
      console.warn("Missing OpenAI key");
      return;
    }

    for (const tx of transactions) {
      if (tx.tag) continue;

      const prompt = `Given the following transaction description, suggest a short tag: "${tx.description}"`;
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const json = await response.json();
      const suggestion = json.choices?.[0]?.message?.content?.trim();

      if (suggestion) {
        await get().updateTag(tx.id, suggestion);
      }
    }
  },
}));
