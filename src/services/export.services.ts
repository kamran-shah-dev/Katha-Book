import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore";

import { db } from "@/firebaseConfig";
import { createCashEntryFromTransaction } from "./cashbook.services";

const exportCollection = collection(db, "export_entries");

// --------------------------------------------------
// 🔥 REALTIME LISTENER FOR EXPORT ENTRIES
// --------------------------------------------------
export function listenExportEntries(callback: (entries: any[]) => void) {
  const q = query(exportCollection, orderBy("entry_date", "desc"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(list);
  });

  return unsubscribe;
}

// --------------------------------------------------
// 🔥 CREATE EXPORT ENTRY (WITH AUTO CASHBOOK ENTRY)
// --------------------------------------------------
export async function createExportEntry(data: any) {
  try {
    const payload = {
      account_id: data.account_id || "",
      account_name: data.account_name || "",
      product: data.product || "",
      bags_qty: Number(data.bags_qty),
      weight_per_bag: Number(data.weight_per_bag),
      rate_per_kg: Number(data.rate_per_kg),
      total_weight: Number(data.total_weight),
      amount: Number(data.amount),
      vehicle_numbers: data.vehicle_numbers || "",
      gd_no: data.gd_no || "",
      invoice_no: data.invoice_no,
      entry_date: new Date(data.entry_date),
      created_at: new Date(),
      search_keywords: generateKeywords(data.account_name),
    };

    // 1) Add Export entry
    const ref = await addDoc(exportCollection, payload);
    const exportId = ref.id;

    // 2) Auto-cashbook transaction (CREDIT)
    await createCashEntryFromTransaction(
      data.account_id,
      data.account_name,
      Number(data.amount),
      "CREDIT",
      "EXPORT",
      exportId,
      data.invoice_no,
      new Date(data.entry_date)
    );

    return exportId;
  } catch (error) {
    console.error("Error creating export entry:", error);
    throw error;
  }
}

// --------------------------------------------------
// 🔥 SEARCH EXPORT ENTRIES
// --------------------------------------------------
export async function searchExportEntries(keyword: string) {
  const lower = keyword.toLowerCase();

  const q = query(
    exportCollection,
    where("search_keywords", "array-contains", lower)
  );

  return new Promise<any[]>((resolve) => {
    const unsub = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      resolve(results);
      unsub();
    });
  });
}

// --------------------------------------------------
// 🔥 GET LAST INVOICE NUMBER
// --------------------------------------------------
export async function getLastExportInvoiceNo() {
  const q = query(exportCollection, orderBy("invoice_no", "desc"), limit(1));

  return new Promise<string>((resolve) => {
    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) resolve("HAH000");
      else resolve(snapshot.docs[0].data().invoice_no);
      unsub();
    });
  });
}

// --------------------------------------------------
// 🔥 UPDATE EXPORT ENTRY
// --------------------------------------------------
export async function updateExportEntry(id: string, data: any) {
  const ref = doc(db, "export_entries", id);

  const payload = {
    account_id: data.account_id,
    account_name: data.account_name,
    product: data.product,
    bags_qty: Number(data.bags_qty),
    weight_per_bag: Number(data.weight_per_bag),
    rate_per_kg: Number(data.rate_per_kg),
    total_weight: Number(data.total_weight),
    amount: Number(data.amount),
    vehicle_numbers: data.vehicle_numbers,
    gd_no: data.gd_no,
    entry_date: new Date(data.entry_date),
    search_keywords: generateKeywords(data.account_name),
  };

  await updateDoc(ref, payload);
  return true;
}

// --------------------------------------------------
// 🔥 DELETE EXPORT ENTRY
// --------------------------------------------------
export async function deleteExportEntry(id: string) {
  const ref = doc(db, "export_entries", id);
  await deleteDoc(ref);
  return true;
}

// --------------------------------------------------
// 🔥 GENERATE SEARCH KEYWORDS
// --------------------------------------------------
function generateKeywords(name: string) {
  const lower = name.toLowerCase();
  return [lower, ...lower.split(" ")];
}
