// app/tax-report/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useTransactionStore } from "@/store/transactionStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TaxReportPage() {
 const { transactions, loadTransactions } = useTransactionStore();

  const [report, setReport] = useState<null | {
    totalIncome: number;
    totalWriteOffs: number;
    estimatedTax: number;
  }>(null);

useEffect(() => {
  loadTransactions();
}, [loadTransactions]);

  useEffect(() => {
    const income = transactions.reduce((sum, tx) => {
      return sum + (tx.amount > 0 ? tx.amount : 0);
    }, 0);

    const writeOffs = transactions.reduce((sum, tx) => {
      return sum + (tx.writeOff?.isWriteOff ? tx.amount : 0);
    }, 0);

    const estimatedTax = (income - writeOffs) * 0.25; // simple 25% estimate

    setReport({
      totalIncome: income,
      totalWriteOffs: writeOffs,
      estimatedTax,
    });
  }, [transactions]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">🧾 Tax Report Summary</h1>

      {report && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div>Total Income: ${report.totalIncome.toFixed(2)}</div>
            <div>Write-Offs: ${report.totalWriteOffs.toFixed(2)}</div>
            <div>Estimated Tax Owed (25%): ${report.estimatedTax.toFixed(2)}</div>
          </CardContent>
        </Card>
      )}

      <Button disabled>Download PDF (Coming Soon)</Button>
    </div>
  );
}
