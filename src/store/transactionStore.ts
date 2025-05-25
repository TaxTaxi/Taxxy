// src/store/transactionStore.ts
import { create } from "zustand";
import { getRelevantCorrections } from "@/utils/getRelevantCorrections"; // add this at the top
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";


export interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: "income" | "expense" | "unassigned";
  tag?: string;
  confidence?: number;
  purpose?: "business" | "personal";
  reviewed?: boolean;
  firestoreId?: string;
  writeOff?: {
    isWriteOff: boolean;
    reason: string;
  };
}

type TransactionState = {
  transactions: Transaction[];
  setTransactions: (items: Transaction[]) => void;
  addTransaction: (item: Omit<Transaction, "id" | "category">) => void;
  removeTransaction: (id: number) => void;
  updateCategory: (id: number, category: Transaction["category"]) => void;
  updateTag: (id: number, tag: string) => Promise<void>;
updatePurpose: (id: number, purpose: "business" | "personal") => Promise<void>;
  markAsReviewed: (id: number) => void;
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

  // ⬇️ Immediately run AI tagging on this new item
  try {
    const examples = await getRelevantCorrections(newItem.description);

let correctionExamples = "";
if (examples.length > 0) {
  correctionExamples = examples
    .map(
      (c, i) => `Example ${i + 1}:
Original: "${c.original.reason}" (${c.original.purpose})
Corrected: "${c.corrected.reason}" (${c.corrected.purpose})`
    )
    .join("\n\n");
}

const prompt = `
You are a financial assistant classifying transactions.

Classify this transaction and return a JSON object with:
- "tag"
- "category"
- "confidence"
- "purpose"
- "writeOff" (object with isWriteOff: boolean, reason: string)

Transaction Description: "${newItem.description}"

Use these user corrections as hints:
${correctionExamples || "(no prior examples)"}
`;

const response = await fetch("/api/aitag", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt }),
});

    const json = await response.json();
    const { tag, category, confidence, purpose, writeOff } = json;

// Apply to newItem locally
newItem.tag = tag;
newItem.category = category || "unassigned";
newItem.confidence = typeof confidence === "number" ? confidence : parseFloat(confidence) || 0;
newItem.purpose = purpose === "business" ? "business" : "personal";
newItem.writeOff = writeOff || undefined; // Include if present

// Save all to Firestore
await updateDoc(doc(db, "transactions", newItem.firestoreId), {
  tag: newItem.tag,
  category: newItem.category,
  confidence: newItem.confidence,
  purpose: newItem.purpose,
  writeOff: newItem.writeOff, // ✅ this line was missing
});
  } catch (err) {
    console.error("❌ Auto-tagging on add failed:", err);
  }

  // ✅ Update local state
  set((state) => ({
    transactions: [...state.transactions, newItem],
  }));
},

  removeTransaction: async (id) => {
  const tx = get().transactions.find((t) => t.id === id);
  if (!tx?.firestoreId) return;

  // 🔥 1. Delete the transaction itself
  await deleteDoc(doc(db, "transactions", tx.firestoreId));

  // 🔁 2. Update any related corrections to mark as deleted
  const q = query(
    collection(db, "corrections"),
    where("transactionId", "==", tx.firestoreId)
  );

  const snapshot = await getDocs(q);
  const updates = snapshot.docs.map((docSnap) =>
    updateDoc(docSnap.ref, {
      deleted: true,
      deletedAt: new Date().toISOString(),
    })
  );
  await Promise.all(updates);

  // 🔄 3. Remove it from local state
  set((state) => ({
    transactions: state.transactions.filter((t) => t.id !== id),
  }));
},

  updateCategory: async (id, category) => {
    const tx = get().transactions.find((t) => t.id === id);
    if (!tx?.firestoreId) return;

    const updated = get().transactions.map((t) =>
      t.id === id ? { ...t, category } : t
    );
    set({ transactions: updated });

    await updateDoc(doc(db, "transactions", tx.firestoreId), { category });
  },

 updateTag: async (id, tag) => {
  const tx = get().transactions.find((t) => t.id === id);
  if (!tx || !tx.firestoreId) return;

  // Safely default undefined values to null
  const original = {
    tag: tx.tag ?? null,
    category: tx.category ?? null,
    purpose: tx.purpose ?? null,
  };

  const corrected = {
    tag: tag ?? null,
    category: tx.category ?? null,
    purpose: tx.purpose ?? null,
  };

  // Update store
  const updated = get().transactions.map((t) =>
    t.id === id ? { ...t, tag } : t
  );
  set({ transactions: updated });

  // Firestore update
  await updateDoc(doc(db, "transactions", tx.firestoreId), { tag });

  // Log correction
  await addDoc(collection(db, "corrections"), {
    transactionId: tx.id,
    timestamp: Date.now(),
    original,
    corrected,
  });
},
updatePurpose: async (id, purpose) => {
  const tx = get().transactions.find((t) => t.id === id);
  if (!tx || !tx.firestoreId || tx.purpose === purpose) return;

  // Store correction in Firestore
  const correction = {
    transactionId: tx.firestoreId,
    original: {
      tag: tx.tag || null,
      category: tx.category || "unassigned",
      purpose: tx.purpose || "personal",
    },
    corrected: {
      tag: tx.tag || null,
      category: tx.category || "unassigned",
      purpose,
    },
    timestamp: new Date().toISOString(),
  };

  await addDoc(collection(db, "corrections"), correction);

  // Update transaction locally and in Firestore
  const updated = get().transactions.map((t) =>
    t.id === id ? { ...t, purpose } : t
  );
  set({ transactions: updated });

  await updateDoc(doc(db, "transactions", tx.firestoreId), { purpose });
},

  markAsReviewed: (id) => {
    const updated = get().transactions.map((t) =>
      t.id === id ? { ...t, reviewed: true } : t
    );
    set({ transactions: updated });

    const tx = get().transactions.find((t) => t.id === id);
    if (tx?.firestoreId) {
      updateDoc(doc(db, "transactions", tx.firestoreId), { reviewed: true });
    }
  },

  loadTransactionsFromFirestore: async () => {
    const q = query(collection(db, "transactions"));
    const snapshot = await getDocs(q);

    const data: Transaction[] = [];
    snapshot.forEach((docSnap) => {
      const t = docSnap.data();
      console.log("🔥 Fetched Firestore doc:", t);
      data.push({
        id: Date.now() + Math.random(),
        description: t.description,
        amount: t.amount,
        date: t.date,
        category: t.category || "unassigned",
        tag: t.tag,
        confidence: t.confidence,
        reviewed: t.reviewed,
        purpose: t.purpose,
        firestoreId: docSnap.id,
        writeOff: t.writeOff || undefined,
      });
    });

    set({ transactions: data });
    console.log("✅ Loaded transactions into store:", data);
  },

    tagAllTransactionsWithAI: async () => {
    const transactions = get().transactions;

    for (const tx of transactions) {
      if (tx.tag || !tx.firestoreId) continue;

      const prompt = `Classify this transaction and return a JSON object with "tag", "category", "confidence", "purpose", and "writeOff" (writeOff should include { isWriteOff: boolean, reason: string }).

Description: "${tx.description}"`;

      try {
        const response = await fetch("/api/aitag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        const json = await response.json();
        const { tag, category, confidence, purpose, writeOff } = json;
        // ✅ Force dummy writeOff if missing
const finalWriteOff = writeOff || {
  isWriteOff: true,
  reason: "Auto-added for test",
};


        const updated = get().transactions.map((t) =>
          t.id === tx.id
            ? {
                ...t,
                tag,
                category: category || "unassigned",
                confidence: typeof confidence === "number" ? confidence : parseFloat(confidence) || 0,
                purpose: purpose === "business" ? "business" : "personal",
                 writeOff: finalWriteOff,
              }
            : t
        );

        set({ transactions: updated as Transaction[] });

        if (tx.firestoreId) {
          console.log("📝 Updating Firestore with:", {
    tag,
    category,
    confidence: typeof confidence === "number" ? confidence : parseFloat(confidence) || 0,
    purpose,
      writeOff: finalWriteOff,
  });
  console.log("📤 Final payload being sent to Firestore:", {
  tag,
  category,
confidence: typeof confidence === "number" ? confidence : parseFloat(confidence) || 0,
  purpose,
  writeOff: finalWriteOff,
});

 await updateDoc(doc(db, "transactions", tx.firestoreId), {
  tag,
  category,
  confidence: typeof confidence === "number" ? confidence : parseFloat(confidence) || 0,
  purpose,
    writeOff: finalWriteOff,
});
        }

        await new Promise((res) => setTimeout(res, 1500));
      } catch (err) {
        console.error("❌ AI tagging failed:", err);
      }
    }
  },
}));
