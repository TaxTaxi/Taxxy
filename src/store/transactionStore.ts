// src/store/transactionStore.ts - Updated with AI learning metadata
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
  
  // 🧠 NEW: AI Learning metadata
  learnedFrom?: number; // Number of corrections AI learned from
  correctionInfluence?: number; // Confidence boost from learning (0-1)
  learningVersion?: string; // Track which AI version classified this
  manualOverride?: boolean; // User manually corrected this
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
      // Handle learning metadata
      learnedFrom: tx.learnedFrom || 0,
      correctionInfluence: tx.correctionInfluence || 0,
      learningVersion: tx.learningVersion || null,
      manualOverride: tx.manualOverride || false,
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

    // 🧠 AI tagging request with enhanced learning
    try {
      console.log("🧠 Starting enhanced AI classification for:", inserted.description);
      
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
      console.log("🧠 Enhanced AI Tagging Result:", aiResult);

      // 🎯 Enhanced updates with learning metadata
      const updates = {
        tag: aiResult.tag || "untagged",
        category: aiResult.category || "unassigned",
        confidence: typeof aiResult.confidence === "number" 
          ? Math.round(aiResult.confidence * 100) // Convert 0-1 to 0-100
          : typeof aiResult.confidence === "string" 
          ? Math.round(parseFloat(aiResult.confidence) * 100)
          : 20, // Default low confidence
        purpose: aiResult.purpose === "business" ? "business" : "personal",
        writeOff: aiResult.writeOff && typeof aiResult.writeOff === "object" 
          ? {
              isWriteOff: Boolean(aiResult.writeOff.isWriteOff),
              reason: aiResult.writeOff.reason || ""
            }
          : { isWriteOff: false, reason: "" },
        reviewed: false,
        
        // 🧠 NEW: Learning metadata from enhanced AI
        learnedFrom: aiResult.learnedFrom || 0,
        correctionInfluence: aiResult.correctionInfluence || 0,
        learningVersion: "enhanced-v1", // Track learning system version
        manualOverride: false
      };

      console.log("📦 Writing enhanced updates to Supabase:", updates);

      const { error: updateError } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", inserted.id);

      if (updateError) {
        console.error("❌ Enhanced update failed:", updateError);
        // Still add the transaction to local state even if AI update failed
        set((state) => ({
          transactions: [...state.transactions, inserted],
        }));
        return;
      }

      // ✅ Success - add the fully updated transaction with learning metadata
      const updatedTransaction = { ...inserted, ...updates };
      set((state) => ({
        transactions: [...state.transactions, updatedTransaction],
      }));

      console.log(`✅ Transaction classified with learning: ${updates.learnedFrom} examples, confidence: ${updates.confidence}%`);

    } catch (err) {
      console.error("❌ Enhanced AI tagging failed:", err);
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

    // 🧠 Enhanced update with learning metadata
    const update = {
      purpose: newPurpose,
      reviewed: true, // Mark as reviewed when user makes changes
      manualOverride: true, // 🧠 NEW: Mark as manually corrected for learning
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

    // 🧠 Enhanced correction logging for better learning
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
          
          // 🧠 NEW: Additional learning metadata
          confidence_before: existingTx.confidence || 0,
          learned_from_count: existingTx.learnedFrom || 0,
        },
      ]);

      if (correctionError) {
        console.error("❌ Failed to log enhanced correction:", correctionError);
      } else {
        console.log("✅ Enhanced correction logged - AI will learn from this feedback");
      }
    }

    // ✅ Update local state with enhanced metadata
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.id === id
          ? {
              ...tx,
              purpose: newPurpose,
              reviewed: true,
              manualOverride: true, // 🧠 NEW: Track manual corrections
              writeOff: newReason
                ? { isWriteOff: true, reason: newReason }
                : tx.writeOff,
            }
          : tx
      ),
    }));
  },
}));