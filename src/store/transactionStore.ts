import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface Transaction {
  id: string; // UUID from Supabase
  description: string;
  amount: number;
  date: string;
  category: string;
  tag?: string;
  confidence?: number;
  purpose?: "business" | "personal";
  reviewed?: boolean;
  writeOff?: {
    isWriteOff: boolean;
    reason: string;
  };
}

type TransactionState = {
  transactions: Transaction[];
  setTransactions: (items: Transaction[]) => void;
  loadTransactions: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, "id">) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  updatePurpose: (id: string, purpose: "business" | "personal", reason?: string) => Promise<void>;
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],

  setTransactions: (items) => set({ transactions: items }),

  loadTransactions: async () => {
    const { data, error } = await supabase.from("transactions").select("*");
    if (error) {
      console.error("❌ Error loading transactions:", error);
      return;
    }

    const parsed = data.map((tx: any) => ({
      ...tx,
      writeOff: tx.writeOff || undefined,
    }));

    set({ transactions: parsed });
  },

  addTransaction: async (item) => {
    const newTx: Omit<Transaction, "id"> = {
      ...item,
      category: "unassigned",
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert([newTx])
      .select();

    if (error || !data || !data[0]) {
      console.error("❌ Supabase insert failed", error);
      return;
    }

    const inserted = data[0];

    // 🧠 AI tagging request
    try {
      const res = await fetch("/api/aitag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Classify this transaction and return a JSON object with "tag", "category", "confidence", "purpose", and "writeOff".\n\nDescription: "${inserted.description}"`,
        }),
      });

      const json = await res.json();
      console.log("🧠 AI Tagging Result:", json);

      const { tag, category, confidence, purpose, writeOff } = json;

      const updates = {
        tag,
        category: category || "unassigned",
        confidence:
          typeof confidence === "number"
            ? confidence
            : parseFloat(confidence) || 0,
        purpose: purpose === "business" ? "business" : "personal",
        writeOff: writeOff ?? { isWriteOff: false, reason: "" },
      };

      console.log("📦 Writing this to Supabase:", updates);

      const { error: updateError } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", inserted.id);

      if (updateError) {
        console.error("❌ Update failed:", updateError);
      }

      set((state) => ({
        transactions: [
          ...state.transactions,
          { ...inserted, ...updates },
        ],
      }));
    } catch (err) {
      console.error("❌ AI tagging failed:", err);
      set((state) => ({
        transactions: [...state.transactions, inserted],
      }));
    }
  },

  removeTransaction: async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      console.error("❌ Error deleting transaction:", error);
      return;
    }

    set((state) => ({
      transactions: state.transactions.filter((tx) => tx.id !== id),
    }));
  },

 updatePurpose: async (id, newPurpose, newReason) => {
  const { transactions } = get();
  const existingTx = transactions.find((tx) => tx.id === id);
  const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;

  if (!existingTx) {
    console.error("Transaction not found");
    return;
  }

  const update = {
    purpose: newPurpose,
    ...(newReason ? { writeOff: { isWriteOff: true, reason: newReason } } : {}),
  };

  const { error } = await supabase
    .from("transactions")
    .update(update)
    .eq("id", id);

  if (error) {
    console.error("❌ Failed to update purpose or write-off:", error);
    return;
  }

  // 🧠 Log correction if there's a change
  const changedPurpose = existingTx.purpose !== newPurpose;
  const changedReason = (existingTx.writeOff?.reason || "") !== (newReason || "");

  if ((changedPurpose || changedReason) && user) {
    const { error: correctionError } = await supabase.from("corrections").insert([
      {
        transaction_description: existingTx.description,
          original_tag: existingTx.tag ?? "unknown",
        original_purpose: existingTx.purpose,
        corrected_purpose: newPurpose,
        original_reason: existingTx.writeOff?.reason || null,
        corrected_reason: newReason || null,
        date: new Date().toISOString(),
        user_id: user.id,
      },
    ]);

    if (correctionError) {
      console.error("❌ Failed to log correction:", correctionError);
    }
  }

  // ✅ Update local state
  set((state) => ({
    transactions: state.transactions.map((tx) =>
      tx.id === id
        ? {
            ...tx,
            purpose: newPurpose,
            writeOff: newReason
              ? { isWriteOff: true, reason: newReason }
              : tx.writeOff,
          }
        : tx
    ),
  }));
},
}))