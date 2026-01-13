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
} from "firebase/firestore";

import { db } from "@/firebaseConfig";
import { createCashEntryFromTransaction } from "./cashbook.services";

const importCollection = collection(db, "import_entries");

// 🔥 CREATE IMPORT ENTRY (WITH AUTO CASHBOOK ENTRY)
export async function createImportEntry(data: any) {
  try {
    // 1. CREATE IMPORT ENTRY
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
    };

    const docRef = await addDoc(importCollection, payload);
    const importId = docRef.id;

    // 2. AUTO-CREATE CASHBOOK ENTRY (DEBIT - YOU OWE MONEY)
    await createCashEntryFromTransaction(
      data.account_id,
      data.account_name,
      Number(data.amount),
      "DEBIT", // ⬅️ Import = You owe money = DEBIT
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

// 🔥 FETCH ALL ENTRIES
export async function fetchImportEntries() {
  const q = query(importCollection, orderBy("entry_date", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

// 🔥 GET LAST INVOICE NUMBER
export async function getLastInvoiceNo() {
  const q = query(importCollection, orderBy("invoice_no", "desc"), limit(1));

  const snap = await getDocs(q);

  if (snap.empty) return "IMP000";

  return snap.docs[0].data().invoice_no;
}

// 🔥 UPDATE ENTRY BY ID
export async function updateImportEntryById(id: string, data: any) {
  // ⚠️ WARNING: Updating imports should also update the linked cashbook entry
  // For now, we'll just update the import entry
  // In production, you'd need to:
  // 1. Find the linked cashbook entry (where reference_id = this import id)
  // 2. Update the cashbook entry amount
  // 3. Recalculate account balance

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
  };

  await updateDoc(ref, payload);
  return true;
}

// 🔥 DELETE ENTRY BY ID
export async function deleteImportEntryById(id: string) {
  // ⚠️ WARNING: Deleting imports should also delete the linked cashbook entry
  // For now, simple delete
  // In production, you'd need to:
  // 1. Find and delete the linked cashbook entry
  // 2. Recalculate account balance

  const ref = doc(db, "import_entries", id);
  await deleteDoc(ref);
  return true;
}