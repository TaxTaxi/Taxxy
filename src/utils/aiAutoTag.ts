import { Transaction } from "@/store/transactionStore";

export async function aiTagTransactions(transactions: Transaction[]): Promise<Transaction[]> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) throw new Error("Missing OpenAI API key");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an assistant helping to categorize financial transactions.",
        },
        {
          role: "user",
          content: `Categorize these transactions:\n${transactions
            .map((t) => `${t.description} - $${t.amount}`)
            .join("\n")}`,
        },
      ],
    }),
  });

  const data = await response.json();

  // Simulate basic tag assignment
  return transactions.map((tx) => ({
    ...tx,
    tag: "AI Tagged", // Replace with real AI logic later
  }));
}
