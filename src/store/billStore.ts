// src/store/billStore.ts
import { create } from "zustand";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Bill {
  id: string;
  name: string;
  amount: number;
  due: string;
  emoji: string;
  frequency?: "once" | "weekly" | "monthly" | "yearly";
  paid?: boolean;
}

type BillState = {
  bills: Bill[];
  addBill: (bill: Omit<Bill, "id">) => Promise<void>;
  removeBill: (id: string) => Promise<void>;
  togglePaid: (id: string) => Promise<void>;
  loadBillsFromFirestore: () => Promise<void>;
};

export const useBillStore = create<BillState>((set, get) => ({
  bills: [],

  addBill: async (bill) => {
    const docRef = await addDoc(collection(db, "bills"), bill);
    set((state) => ({
      bills: [...state.bills, { ...bill, id: docRef.id }],
    }));
  },

  removeBill: async (id) => {
    await deleteDoc(doc(db, "bills", id));
    set((state) => ({
      bills: state.bills.filter((bill) => bill.id !== id),
    }));
  },

  togglePaid: async (id) => {
    const target = get().bills.find((b) => b.id === id);
    if (!target) return;

    const updated = { ...target, paid: !target.paid };
    await updateDoc(doc(db, "bills", id), { paid: updated.paid });

    set((state) => ({
      bills: state.bills.map((b) => (b.id === id ? updated : b)),
    }));
  },

  loadBillsFromFirestore: async () => {
    const snapshot = await getDocs(query(collection(db, "bills")));
    const bills: Bill[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Bill, "id">),
    }));
    set({ bills });
  },
}));
