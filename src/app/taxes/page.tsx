"use client";

import { useEffect, useMemo, useState } from "react";
import { useBillStore } from "@/store/billStore";
import { useIncomeStore } from "@/store/incomeStore";
import { useTransactionStore } from "@/store/transactionStore";
import { generateTaxSummary } from "@/utils/generatetaxsummary";
import { Transaction } from "@/store/transactionStore"; 
import { getRelevantCorrections } from "@/utils/getRelevantCorrections";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TaxesPage() {
  const { loadBillsFromFirestore } = useBillStore();
  const { loadIncomeFromFirestore } = useIncomeStore();
  const { transactions, loadTransactionsFromFirestore } = useTransactionStore();

  const [showWriteOffs, setShowWriteOffs] = useState(false);

  useEffect(() => {
    loadBillsFromFirestore();
    loadIncomeFromFirestore();
    loadTransactionsFromFirestore();
  }, []);

  const summary = generateTaxSummary(transactions);

  const writeOffs = useMemo(
    () => transactions.filter((t) => t.writeOff?.isWriteOff),
    [transactions]
  );

  const totalWriteOffAmount = useMemo(
    () => writeOffs.reduce((sum, tx) => sum + tx.amount, 0),
    [writeOffs]
  );

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-100">Tax Overview</h1>

      <div className="bg-white shadow rounded-xl p-6 space-y-4 text-gray-700">
        <h2 className="text-xl font-semibold mb-2">🧠 AI-Powered Tax Summary</h2>
        <div>
          <strong>Transaction Income:</strong> ${summary.totalIncome.toFixed(2)}
        </div>
        <div>
          <strong>Business Expenses:</strong> ${summary.businessExpenses.toFixed(2)}
        </div>
        <div>
          <strong>Taxable Income:</strong> ${summary.taxableIncome.toFixed(2)}
        </div>
        <div>
          <strong>Estimated Tax Owed (25%):</strong> ${summary.estimatedTaxOwed.toFixed(2)}
        </div>
      </div>

      <div className="bg-white shadow rounded-xl p-6 space-y-4 text-gray-700">
        <h2 className="text-xl font-semibold mb-2">🧾 Write-Off Summary</h2>
        <p>
          {writeOffs.length} transaction{writeOffs.length !== 1 ? "s" : ""} flagged as
          write-offs
        </p>
        <p>Total write-off amount: ${totalWriteOffAmount.toFixed(2)}</p>

        <button
          onClick={() => setShowWriteOffs(!showWriteOffs)}
          className="text-blue-600 hover:underline text-sm mt-2"
        >
          {showWriteOffs ? "Hide details" : "Show transactions"}
        </button>

        {showWriteOffs && (
          <ul className="mt-2 border-t pt-2 space-y-1 text-sm">
            {writeOffs.map((tx) => (
              <EditableWriteOffItem key={tx.id} tx={tx} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// 🔧 Inline editor component for write-offsimport { useEffect, useState } from "react";

function EditableWriteOffItem({ tx }: { tx: Transaction }) {
  const [editing, setEditing] = useState(false);
  const [reason, setReason] = useState(tx.writeOff?.reason || "");
  const [purpose, setPurpose] = useState(tx.purpose || "personal");
  const [showWhy, setShowWhy] = useState(false);
  const [whyExamples, setWhyExamples] = useState<string[]>([]);

  const updateTx = useTransactionStore((s) => s.updatePurpose);

  const handleSave = async () => {
    await updateTx(tx.id, purpose);
    await updateDoc(doc(db, "transactions", tx.firestoreId!), {
      writeOff: {
        isWriteOff: true,
        reason,
      },
    });
    setEditing(false);
  };

  const fetchWhy = async () => {
    const examples = await getRelevantCorrections(tx.description);
    const readable = examples.map(
      (c, i) =>
        `Example ${i + 1}:\nOriginal: "${c.original.reason}" (${c.original.purpose})\nCorrected: "${c.corrected.reason}" (${c.corrected.purpose})`
    );
    setWhyExamples(readable);
  };

  useEffect(() => {
    if (showWhy) fetchWhy();
  }, [showWhy]);

  return (
    <li className="flex flex-col gap-1 border-b pb-2 mb-2">
      {!editing ? (
        <>
          <div className="flex justify-between">
            <span>{tx.description}</span>
            <span>${tx.amount.toFixed(2)}</span>
            <span className="text-gray-500">{tx.date}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Purpose: {tx.purpose}</span>
            <span>Reason: {tx.writeOff?.reason}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWhy((s) => !s)}
                className="text-purple-600 hover:underline text-xs"
              >
                {showWhy ? "Hide Why" : "Why?"}
              </button>
              <button
                onClick={() => setEditing(true)}
                className="text-blue-500 hover:underline text-xs"
              >
                Edit
              </button>
            </div>
          </div>
          {showWhy && whyExamples.length > 0 && (
            <div className="bg-gray-100 rounded p-2 mt-2 text-xs whitespace-pre-line text-gray-700">
              {whyExamples.join("\n\n")}
            </div>
          )}
          {showWhy && whyExamples.length === 0 && (
            <div className="text-xs text-gray-500 mt-1">No examples available yet.</div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1 text-sm">
            <label className="text-xs font-medium">Reason:</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />

            <label className="text-xs font-medium mt-2">Purpose:</label>
            <select
              value={purpose}
              onChange={(e) =>
                setPurpose(e.target.value as "business" | "personal")
              }
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="business">Business</option>
              <option value="personal">Personal</option>
            </select>

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-gray-500 hover:underline text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </li>
  );
}
