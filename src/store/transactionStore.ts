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
      reviewed: false,
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
      console.log("🧠 Starting AI classification for:", inserted.description);
      
      const res = await fetch("/api/aitag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: inserted.description,
        }),
      });

      if (!res.ok) {
        throw new Error(`AI API returned ${res.status}: ${res.statusText}`);
      }

      const aiResult = await res.json();
      console.log("🧠 AI Tagging Result:", aiResult);

      // Validate and clean the AI result
      const updates = {
        tag: aiResult.tag || "untagged",
        category: aiResult.category || "unassigned",
        confidence: typeof aiResult.confidence === "number" 
          ? Math.round(aiResult.confidence * 100) // Convert 0-1 to 0-100
          : typeof aiResult.confidence === "string" 
          ? Math.round(parseFloat(aiResult.confidence) * 100)
          : 0,
        purpose: aiResult.purpose === "business" ? "business" : "personal",
        writeOff: aiResult.writeOff && typeof aiResult.writeOff === "object" 
          ? {
              isWriteOff: Boolean(aiResult.writeOff.isWriteOff),
              reason: aiResult.writeOff.reason || ""
            }
          : { isWriteOff: false, reason: "" },
        reviewed: false, // Mark as unreviewed since it's AI-classified
      };

      console.log("📦 Writing these updates to Supabase:", updates);

      const { error: updateError } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", inserted.id);

      if (updateError) {
        console.error("❌ Update failed:", updateError);
        // Still add the transaction to local state even if AI update failed
        set((state) => ({
          transactions: [...state.transactions, inserted],
        }));
        return;
      }

      // ✅ Success - add the fully updated transaction to local state
      const updatedTransaction = { ...inserted, ...updates };
      set((state) => ({
        transactions: [...state.transactions, updatedTransaction],
      }));

      console.log("✅ Transaction successfully added and classified");

    } catch (err) {
      console.error("❌ AI tagging failed:", err);
      // Fall back to adding the unclassified transaction
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
      reviewed: true, // Mark as reviewed when user makes changes
      ...(newReason ? { 
        writeOff: { isWriteOff: true, reason: newReason } 
      } : {}),
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
      } else {
        console.log("✅ Correction logged for future AI learning");
      }
    }

    // ✅ Update local state
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.id === id
          ? {
              ...tx,
              purpose: newPurpose,
              reviewed: true,
              writeOff: newReason
                ? { isWriteOff: true, reason: newReason }
                : tx.writeOff,
            }
          : tx
      ),
    }));
  },
}));