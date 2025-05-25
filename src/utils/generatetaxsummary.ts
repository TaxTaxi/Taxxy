import { Transaction } from "@/store/transactionStore";

export function generateTaxSummary(transactions: Transaction[]) {
  let totalIncome = 0;
  let businessExpenses = 0;

  transactions.forEach((tx) => {
    const isIncome =
      tx.category === "income" ||
      tx.purpose === "business" && tx.tag?.toLowerCase().includes("paycheck");

    const isBusinessExpense =
      tx.category === "expense" && tx.purpose === "business";

    if (isIncome) {
      totalIncome += tx.amount;
    }

    if (isBusinessExpense) {
      businessExpenses += tx.amount;
    }
  });

  const taxableIncome = totalIncome - businessExpenses;
  const estimatedTaxOwed = taxableIncome * 0.25;

  return {
    totalIncome,
    businessExpenses,
    taxableIncome,
    estimatedTaxOwed,
  };
}
