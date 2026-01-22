import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

import { db } from "@/firebaseConfig";
import { createCashEntryFromTransaction } from "./cashbook.services";

const invoiceCollection = collection(db, "invoice_entries");

// 🔥 REALTIME LISTENER
export function listenInvoiceEntries(callback: (list: any[]) => void) {
  return onSnapshot(
    query(invoiceCollection, orderBy("entry_date", "desc")),
    (snap) => {
      const formatted = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        entry_date:
          d.data().entry_date?.toDate
            ? d.data().entry_date.toDate()
            : new Date(d.data().entry_date),
      }));

      callback(formatted);
    }
  );
}

// 🔥 CREATE INVOICE ENTRY + AUTO CASHBOOK
export async function createInvoiceEntry(data: any) {
  try {
    const payload = {
      account_id: data.account_id || "",
      account_name: data.account_name || "",
      supplier: data.supplier || "",
      bags_qty: Number(data.bags_qty),
      weight_per_bag: Number(data.weight_per_bag),
      weight_unit: data.weight_unit || "kg",
      rate_per_kg: Number(data.rate_per_kg),
      total_weight: Number(data.total_weight),
      amount: Number(data.amount),
      vehicle_numbers: data.vehicle_numbers || "",
      grn_no: data.grn_no || "",
      invoice_no: data.invoice_no,
      entry_date: new Date(data.entry_date),
      created_at: new Date(),
      // Additional adjustment fields
      bardana: Number(data.bardana || 0),
      mazdoori: Number(data.mazdoori || 0),
      munshiana: Number(data.munshiana || 0),
      charsadna: Number(data.charsadna || 0),
      walai: Number(data.walai || 0),
      tol: Number(data.tol || 0),
      search_keywords: generateKeywords(data.account_name),
    };

    const docRef = await addDoc(invoiceCollection, payload);
    const invoiceId = docRef.id;

    // Auto cashbook entry (DEBIT) - uses final amount with adjustments
    await createCashEntryFromTransaction(
      data.account_id,
      data.account_name,
      Number(data.amount),
      "DEBIT",
      "IMPORT",
      invoiceId,
      data.invoice_no,
      new Date(data.entry_date)
    );

    return invoiceId;
  } catch (error) {
    console.error("Error creating invoice entry:", error);
    throw error;
  }
}

// 🔥 GENERATE SEARCH KEYWORDS
function generateKeywords(name: string) {
  const lower = name.toLowerCase();
  return [lower, ...lower.split(" ")];
}

// 🔥 GET LAST INVOICE NUMBER
export async function getLastInvoiceNo() {
  const q = query(invoiceCollection, orderBy("invoice_no", "desc"), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? "IMP000" : snap.docs[0].data().invoice_no;
}

// 🔥 UPDATE INVOICE ENTRY
export async function updateInvoiceEntryById(id: string, data: any) {
  const ref = doc(db, "invoice_entries", id);

  const payload = {
    account_id: data.account_id,
    account_name: data.account_name,
    supplier: data.supplier,
    bags_qty: Number(data.bags_qty),
    weight_per_bag: Number(data.weight_per_bag),
    weight_unit: data.weight_unit || "kg",
    rate_per_kg: Number(data.rate_per_kg),
    total_weight: Number(data.total_weight),
    amount: Number(data.amount),
    vehicle_numbers: data.vehicle_numbers,
    grn_no: data.grn_no,
    entry_date: new Date(data.entry_date),
    // Additional adjustment fields
    bardana: Number(data.bardana || 0),
    mazdoori: Number(data.mazdoori || 0),
    munshiana: Number(data.munshiana || 0),
    charsadna: Number(data.charsadna || 0),
    walai: Number(data.walai || 0),
    tol: Number(data.tol || 0),
    search_keywords: generateKeywords(data.account_name),
  };

  await updateDoc(ref, payload);
  return true;
}

// 🔥 DELETE ENTRY
export async function deleteInvoiceEntryById(id: string) {
  const ref = doc(db, "invoice_entries", id);
  await deleteDoc(ref);
  return true;
}