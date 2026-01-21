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
import { ImportEntry } from "@/lib/types";

const importCollection = collection(db, "import_entries");

// 🔥 REALTIME LISTENER
export function listenImportEntries(callback: (list: ImportEntry[]) => void) {
  return onSnapshot(
    query(importCollection, orderBy("entry_date", "desc")),
    (snap) => {
      const formatted = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        entry_date:
          d.data().entry_date?.toDate
            ? d.data().entry_date.toDate()
            : new Date(d.data().entry_date),
      })) as ImportEntry[];

      callback(formatted);
    }
  );
}

// 🔥 CREATE IMPORT ENTRY + AUTO CASHBOOK
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createImportEntry(data: any) {
  try {
    const payload = {
      account_id: data.account_id || "",
      account_name: data.account_name || "",
      supplier: data.supplier || "",
      bags_qty: Number(data.bags_qty),
      weight_per_bag: Number(data.weight_per_bag),
      rate_per_kg: Number(data.rate_per_kg),
      total_weight: Number(data.total_weight),
      amount: Number(data.amount),
      vehicle_numbers: data.vehicle_numbers || "",
      grn_no: data.grn_no || "",
      invoice_no: data.invoice_no,
      entry_date: new Date(data.entry_date),
      created_at: new Date(),
      search_keywords: generateKeywords(data.account_name),
    };

    const docRef = await addDoc(importCollection, payload);
    const importId = docRef.id;

    // Auto cashbook entry (DEBIT)
    await createCashEntryFromTransaction(
      data.account_id,
      data.account_name,
      Number(data.amount),
      "DEBIT",
      "IMPORT",
      importId,
      data.invoice_no,
      new Date(data.entry_date)
    );

    return importId;
  } catch (error) {
    console.error("Error creating import entry:", error);
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
  const q = query(importCollection, orderBy("invoice_no", "desc"), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? "IMP000" : snap.docs[0].data().invoice_no;
}

// 🔥 UPDATE IMPORT ENTRY
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateImportEntryById(id: string, data: any) {
  const ref = doc(db, "import_entries", id);

  const payload = {
    account_id: data.account_id,
    account_name: data.account_name,
    supplier: data.supplier,
    bags_qty: Number(data.bags_qty),
    weight_per_bag: Number(data.weight_per_bag),
    rate_per_kg: Number(data.rate_per_kg),
    total_weight: Number(data.total_weight),
    amount: Number(data.amount),
    vehicle_numbers: data.vehicle_numbers,
    grn_no: data.grn_no,
    entry_date: new Date(data.entry_date),
    search_keywords: generateKeywords(data.account_name),
  };

  await updateDoc(ref, payload);
  return true;
}

// 🔥 DELETE ENTRY
export async function deleteImportEntryById(id: string) {
  const ref = doc(db, "import_entries", id);
  await deleteDoc(ref);
  return true;
}
