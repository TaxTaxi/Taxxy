import { create } from "zustand";

export interface Bill {
  id: number;
  name: string;
  amount: number;
  due: string;
  emoji: string;
  frequency?: "once" | "weekly" | "monthly" | "yearly";
  paid?: boolean;
}

type BillState = {
  bills: Bill[];
  addBill: (bill: Bill) => void;
  removeBill: (id: number) => void;
  setBills: (bills: Bill[]) => void;
  togglePaid: (id: number) => void;
  loadBillsFromStorage: () => void;
};

export const useBillStore = create<BillState>((set, get) => ({
  bills: [],

  addBill: (bill) => {
    const updated = [...get().bills, bill];
    set({ bills: updated });
    localStorage.setItem("taxxy_bills", JSON.stringify(updated));
  },

  removeBill: (id) => {
    const updated = get().bills.filter((b) => b.id !== id);
    set({ bills: updated });
    localStorage.setItem("taxxy_bills", JSON.stringify(updated));
  },

  togglePaid: (id) => {
    const updated = get().bills.map((bill) =>
      bill.id === id ? { ...bill, paid: !bill.paid } : bill
    );
    set({ bills: updated });
    localStorage.setItem("taxxy_bills", JSON.stringify(updated));
  },

  setBills: (bills) => {
    set({ bills });
    localStorage.setItem("taxxy_bills", JSON.stringify(bills));
  },

  loadBillsFromStorage: () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("taxxy_bills");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            set({ bills: parsed });
          }
        } catch {
          // ignore bad data
        }
      }
    }
  },
}));
