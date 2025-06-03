// src/store/billStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface Bill {
  id: string; // Supabase UUID
  name: string;
  amount: number;
  dueDate: string; // changed to `due` to match your page.tsx
  frequency?: "monthly" | "weekly" | "yearly" | "once";
  paid?: boolean;
  emoji?: string;
  user_id?: string;
}

type BillState = {
  bills: Bill[];
  setBills: (items: Bill[]) => void;
  loadBills: () => Promise<void>;
  addBill: (item: Omit<Bill, "id">) => Promise<void>;
  removeBill: (id: string) => Promise<void>;
  togglePaid: (id: string) => void;
};

export const useBillStore = create<BillState>((set, get) => ({
  bills: [],

  setBills: (items) => set({ bills: items }),

  loadBills: async () => {
    const { data, error } = await supabase.from("bills").select("*");
    if (error) {
      console.error("❌ Error loading bills:", error);
      return;
    }
    set({ bills: data });
  },

 addBill: async (item) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("❌ No user session found");
    return;
  }

  const { data, error } = await supabase
    .from("bills")
    .insert([
      {
        ...item,
        user_id: user.id, // ✅ attach user ID
      },
    ])
    .select();

  if (error || !data || !data[0]) {
    console.error("❌ Supabase insert failed", error);
    return;
  }

  set((state) => ({ bills: [...state.bills, data[0]] }));
},

  removeBill: async (id: string) => {
    const { error } = await supabase.from("bills").delete().eq("id", id);
    if (error) {
      console.error("❌ Error deleting bill:", error);
      return;
    }

    set((state) => ({
      bills: state.bills.filter((bill) => bill.id !== id),
    }));
  },

  togglePaid: (id) => {
    set((state) => ({
      bills: state.bills.map((bill) =>
        bill.id === id ? { ...bill, paid: !bill.paid } : bill
      ),
    }));
  },
}));
