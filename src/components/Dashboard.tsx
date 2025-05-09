"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBillStore } from "@/store/billStore";
import { useIncomeStore } from "@/store/incomeStore";

const dashboardItems = [
    { id: 1, text: "💵 Track your income and bills in one place." },
    { id: 2, text: "📊 Get smart insights based on your finances." },
    { id: 3, text: "🧾 Estimate taxes based on 1099 income." },
    { id: 4, text: "💡 See what’s due and what’s new." },
];

export default function Dashboard() {
    // ✅ Zustand state for bills and income
    const { incomeItems } = useIncomeStore();
    const { bills } = useBillStore();

    // ✅ UI state for animation + SSR safety
    const [mainIndex, setMainIndex] = useState(0);
    const [isClient, setIsClient] = useState(false);

    // ✅ Total calculations
    const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
    const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0);
    const netBalance = totalIncome - totalBills;

    // ✅ Color code the net balance
    const balanceColor =
        netBalance > 0 ? "text-green-600" : netBalance < 0 ? "text-red-600" : "text-gray-600";

    useEffect(() => {
        useBillStore.getState().loadBillsFromStorage();
        useIncomeStore.getState().loadIncomeFromStorage();
    }, []);

    // ✅ Enable hydration-safe client rendering
    useEffect(() => {
        setIsClient(true);
    }, []);

    // ✅ Animate dashboard insight rotation
    useEffect(() => {
        const interval = setInterval(() => {
            setMainIndex((prev) => (prev + 1) % dashboardItems.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    if (!isClient) return null;

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
                Welcome to Taxxy
            </h1>

            {/* ✅ Financial Summary Box */}
            <div className="bg-white rounded-xl shadow p-6 text-center text-gray-800 max-w-xl mx-auto mb-10">
                <h2 className="text-xl font-semibold mb-2">Financial Overview</h2>
                <p className="text-md">Total Income: <strong>${totalIncome.toFixed(2)}</strong></p>
                <p className="text-md">Total Bills: <strong>${totalBills.toFixed(2)}</strong></p>
                <p className={`text-md font-bold mt-2 ${balanceColor}`}>
                    Net Balance: ${netBalance.toFixed(2)}
                </p>
            </div>

            {/* ✅ Rotating Insights */}
            <div className="flex flex-col items-center justify-center min-h-[40vh] bg-gray-100 p-8 space-y-10">
                <div className="w-full max-w-xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={dashboardItems[mainIndex].id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.5 }}
                            className="bg-white rounded-2xl shadow-md p-6 text-center text-xl font-medium text-gray-800"
                        >
                            {dashboardItems[mainIndex].text}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
