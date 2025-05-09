"use client";

import { useEffect, useState, useRef } from "react";
import { useBillStore, Bill } from "@/store/billStore";
import {
    differenceInCalendarDays,
    parseISO,
    isToday,
    isPast,
} from "date-fns";

function getDueStatus(dateString: string): string {
    if (!dateString) return "❓ Unknown";

    const due = parseISO(dateString);
    const today = new Date();
    const days = differenceInCalendarDays(due, today);

    if (isToday(due)) return "📅 Due Today";
    if (days > 0) return `⏳ Due in ${days} day${days > 1 ? "s" : ""}`;
    if (isPast(due)) return `❌ Overdue by ${Math.abs(days)} day${Math.abs(days) > 1 ? "s" : ""}`;

    return "📆 Upcoming";
}
function sortByDueDate(billA: Bill, billB: Bill) {
    return new Date(billA.due).getTime() - new Date(billB.due).getTime();
}

export default function BillsPage() {
    const { bills, addBill, removeBill, setBills, togglePaid } = useBillStore();
   
    useEffect(() => {
        useBillStore.getState().loadBillsFromStorage();
      }, []);
      
    // ✅ Grouping logic: separate lists for rendering
    const unpaidBills = bills
        .filter((bill) => !bill.paid)
        .sort(sortByDueDate);

    const paidBills = bills
        .filter((bill) => bill.paid)
        .sort(sortByDueDate);

    const [form, setForm] = useState<{
        name: string;
        amount: string;
        due: string;
        emoji: string;
        frequency: "once" | "weekly" | "monthly" | "yearly" | "";
    }>({
        name: "",
        amount: "",
        due: "",
        emoji: "",
        frequency: "",
    });    

    const hasLoaded = useRef(false);

    useEffect(() => {
      if (hasLoaded.current) {
        localStorage.setItem("taxxy_bills", JSON.stringify(bills));
      } else {
        hasLoaded.current = true;
      }
    }, [bills]);    

    function handleAddBill(e: React.FormEvent) {
        e.preventDefault();
        const newBill: Bill = {
            id: Date.now(),
            name: form.name || "New Bill",
            amount: parseFloat(form.amount) || 0,
            due: form.due || "",
            emoji: form.emoji || "🧾",
            frequency: form.frequency || "once",
            paid: false,
        };
        addBill(newBill);
        setForm({ name: "", amount: "", due: "", emoji: "", frequency: "" });
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Bills</h1>

            <form onSubmit={handleAddBill} className="mb-8 grid gap-4 max-w-xl">
                <input
                    className="p-2 rounded border border-gray-300 text-black"
                    placeholder="Bill name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                    className="p-2 rounded border border-gray-300 text-black"
                    placeholder="Amount"
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
                <input
                    className="p-2 rounded border border-gray-300 text-black"
                    type="date"
                    value={form.due}
                    onChange={(e) => setForm({ ...form, due: e.target.value })}
                />
                <input
                    className="p-2 rounded border border-gray-300 text-black"
                    placeholder="Emoji (optional)"
                    value={form.emoji}
                    onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                />
                <select
                    className="p-2 rounded border border-gray-300 text-black"
                    value={form.frequency}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            frequency: e.target.value as "" | "once" | "weekly" | "monthly" | "yearly",
                        })
                    }
                >
                    <option value="">Select frequency</option>
                    <option value="once">One-time</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                </select>
                <button className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition">
                    Add Bill
                </button>
            </form>

            {/* Unpaid Section */}
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Upcoming Bills</h2>
            <div className="grid gap-6 max-w-xl mb-10">
                {unpaidBills.length === 0 ? (
                    <p className="text-gray-500">No unpaid bills!</p>
                ) : (
                    unpaidBills.map((bill) => (
                        <div
                            key={bill.id}
                            className="bg-white rounded-xl shadow p-6 flex justify-between items-center"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">{bill.emoji}</span>
                                <div>
                                    <div className="text-lg font-medium text-gray-800">{bill.name}</div>
                                    <div
                                        className={`text-sm px-2 py-1 inline-block rounded-full ${getDueStatus(bill.due).startsWith("❌")
                                                ? "bg-red-100 text-red-700"
                                                : getDueStatus(bill.due).startsWith("📅")
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-gray-100 text-gray-600"
                                            }`}
                                    >
                                        {getDueStatus(bill.due)}
                                    </div>

                                    {bill.frequency && (
                                        <div className="text-sm text-gray-400">Repeats: {bill.frequency}</div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-xl font-semibold text-gray-700">${bill.amount}</div>
                                <button
                                    onClick={() => togglePaid(bill.id)}
                                    className="text-sm text-blue-500 hover:underline"
                                >
                                    Mark as Paid
                                </button>
                                <button
                                    onClick={() => removeBill(bill.id)}
                                    className="text-sm text-red-500 hover:underline"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Paid Section */}
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Paid Bills</h2>
            <div className="grid gap-6 max-w-xl">
                {paidBills.length === 0 ? (
                    <p className="text-gray-500">No paid bills yet.</p>
                ) : (
                    paidBills.map((bill) => (
                        <div
                            key={bill.id}
                            className="bg-gray-200 opacity-70 rounded-xl shadow p-6 flex justify-between items-center"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">{bill.emoji}</span>
                                <div>
                                    <div className="text-lg font-medium text-gray-800">{bill.name}</div>
                                    <div className="text-sm text-gray-500">{getDueStatus(bill.due)}</div>
                                    {bill.frequency && (
                                        <div className="text-sm text-gray-400">Repeats: {bill.frequency}</div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-xl font-semibold text-gray-700">${bill.amount}</div>
                                <button
                                    onClick={() => togglePaid(bill.id)}
                                    className="text-sm text-green-500 hover:underline"
                                >
                                    Unmark ✓
                                </button>
                                <button
                                    onClick={() => removeBill(bill.id)}
                                    className="text-sm text-red-500 hover:underline"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}