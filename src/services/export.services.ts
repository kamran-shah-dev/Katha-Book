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

const exportCollection = collection(db, "export_entries");

// 🔥 CREATE EXPORT ENTRY (WITH AUTO CASHBOOK ENTRY)
export async function createExportEntry(data: any) {
  try {
    // 1. CREATE EXPORT ENTRY
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

    const docRef = await addDoc(exportCollection, payload);
    const exportId = docRef.id;

    // 2. AUTO-CREATE CASHBOOK ENTRY (CREDIT - THEY OWE YOU)
    await createCashEntryFromTransaction(
      data.account_id,
      data.account_name,
      Number(data.amount),
      "CREDIT", // ⬅️ Export = They owe you = CREDIT
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

// 🔥 GENERATE SEARCH KEYWORDS
function generateKeywords(name: string) {
  const lower = name.toLowerCase();
  return [lower, ...lower.split(" ")];
}

// 🔥 FETCH ALL ENTRIES
export async function fetchExportEntries() {
  const snap = await getDocs(exportCollection);
  return snap.docs.map((d) => {
    const data = d.data();

    return {
      id: d.id,
      ...data,
      entry_date: data.entry_date?.toDate
        ? data.entry_date.toDate().toISOString().slice(0, 10)
        : data.entry_date || "",
    };
  });
}

// 🔥 GET LAST INVOICE NUMBER
export async function getLastExportInvoiceNo() {
  const q = query(exportCollection, orderBy("invoice_no", "desc"), limit(1));

  const snap = await getDocs(q);

  if (snap.empty) return "HAH000";

  return snap.docs[0].data().invoice_no;
}

// 🔥 UPDATE ENTRY
export async function updateExportEntry(id: string, data: any) {
  // ⚠️ WARNING: Updating exports should also update the linked cashbook entry
  // For now, we'll just update the export entry
  // In production, you'd need to:
  // 1. Find the linked cashbook entry (where reference_id = this export id)
  // 2. Update the cashbook entry amount
  // 3. Recalculate account balance

  const ref = doc(db, "export_entries", id);

  await updateDoc(ref, {
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
  });

  return true;
}

// 🔥 DELETE ENTRY
export async function deleteExportEntry(id: string) {
  // ⚠️ WARNING: Deleting exports should also delete the linked cashbook entry
  // For now, simple delete
  // In production, you'd need to:
  // 1. Find and delete the linked cashbook entry
  // 2. Recalculate account balance

  const ref = doc(db, "export_entries", id);
  await deleteDoc(ref);
  return true;
}