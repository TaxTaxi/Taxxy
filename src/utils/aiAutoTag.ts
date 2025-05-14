// src/utils/aiAutoTag.ts

import { Transaction } from "@/store/transactionStore";

// ✅ Basic keyword-based tagger — this will later be replaced with real AI
export function suggestCategory(transaction: Transaction): Transaction["category"] {
  const desc = transaction.description.toLowerCase();

  if (desc.includes("uber") || desc.includes("lyft") || desc.includes("ride")) {
    return "expense";
  }

  if (desc.includes("payroll") || desc.includes("payment") || desc.includes("stripe")) {
    return "income";
  }

  // Default fallback
  return "unassigned";
}