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
  confidence?: number; // ✅ NEW: confidence score (0–1)
  firestoreId?: string;
}

// ✅ Zustand state type
type TransactionState = {
  transactions: Transaction[];
  setTransactions: (items: Transaction[]) => void;
  addTransaction: (item: Omit<Transaction, "id" | "category">) => void;
  updateCategory: (id: number, category: Transaction["category"]) => void;
  updateTag: (id: number, tag: string, confidence?: number) => void;
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

  updateTag: async (id, tag, confidence = 0) => {
    const tx = get().transactions.find((t) => t.id === id);
    if (!tx || !tx.firestoreId) return;

    const updated = get().transactions.map((t) =>
      t.id === id ? { ...t, tag, confidence } : t
    );
    set({ transactions: updated });

    await updateDoc(doc(db, "transactions", tx.firestoreId), {
      tag,
      confidence,
    });
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
        confidence: t.confidence ?? undefined,
        firestoreId: docSnap.id,
      });
    });

    set({ transactions: data });
  },

  tagAllTransactionsWithAI: async () => {
    const transactions = get().transactions;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      console.warn("Missing OpenAI API key");
      return;
    }

    for (const tx of transactions) {
      if (tx.tag) continue;

      const prompt = `You are a financial assistant. For the transaction: "${tx.description}", return a short tag (e.g., 'Rent', 'W-2', 'Uber Eats') and a confidence score from 0 to 1.\nRespond ONLY in JSON like: {"tag": "TagName", "confidence": 0.85}`;

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
      const content = json.choices?.[0]?.message?.content;

      try {
        const parsed = JSON.parse(content);
        if (parsed.tag) {
          await get().updateTag(tx.id, parsed.tag, parsed.confidence || 0);
        }
      } catch (err) {
        console.error("Failed to parse AI response:", content);
      }
    }
  },
}));
