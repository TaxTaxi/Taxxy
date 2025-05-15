// src/app/api/aiTag/route.ts

import { NextResponse } from "next/server";
import { aiTagTransactions } from "@/utils/aiAutoTag";
import { Transaction } from "@/store/transactionStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const transactions: Transaction[] = body.transactions;

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: "Invalid or missing transactions array" }, { status: 400 });
    }

    const tagged = await aiTagTransactions(transactions);

    return NextResponse.json({ tagged });
  } catch (err) {
    console.error("AI Tagging Error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}