import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";

import { db } from "@/firebaseConfig";

// Firestore collection reference
const importCollection = collection(db, "import_entries");

// Generate keywords for search
function generateKeywords(name: string) {
  const lower = name.toLowerCase();
  return [lower, ...lower.split(" ")];
}

// CREATE IMPORT ENTRY
export async function createImportEntry(data: any) {
  const payload = {
    account_id: data.account_id || "",
    account_name: data.account_name || "",
    supplier: data.supplier,
    bags_qty: Number(data.bags_qty),
    weight_per_bag: Number(data.weight_per_bag),
    rate_per_kg: Number(data.rate_per_kg),
    total_weight: Number(data.total_weight),
    amount: Number(data.amount),
    vehicle_numbers: data.vehicle_numbers,
    grn_no: data.grn_no || "",
    entry_date: new Date(data.entry_date),
    created_at: new Date(),
    invoice_no: data.invoice_no,
    search_keywords: generateKeywords(data.account_name),
  };

  const docRef = await addDoc(importCollection, payload);
  return docRef.id;
}

// FETCH ALL IMPORT ENTRIES (ORDERED BY DATE)
export async function fetchImportEntries() {
  const q = query(importCollection, orderBy("entry_date", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

// SEARCH IMPORT ENTRIES
export async function searchImportEntries(keyword: string) {
  const lower = keyword.toLowerCase();

  const q = query(
    importCollection,
    where("search_keywords", "array-contains", lower)
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

// UPDATE IMPORT ENTRY
export async function updateImportEntry(id: string, data: any) {
  const ref = doc(db, "import_entries", id);

  const payload = {
    account_id: data.account_id || "",
    account_name: data.account_name || "",
    supplier: data.supplier,
    bags_qty: Number(data.bags_qty),
    weight_per_bag: Number(data.weight_per_bag),
    rate_per_kg: Number(data.rate_per_kg),
    total_weight: Number(data.total_weight),
    amount: Number(data.amount),
    vehicle_numbers: data.vehicle_numbers,
    grn_no: data.grn_no,
    entry_date: new Date(data.entry_date),
    invoice_no: data.invoice_no,
    search_keywords: generateKeywords(data.account_name),
  };

  await updateDoc(ref, payload);
  return true;
}

// DELETE IMPORT ENTRY
export async function deleteImportEntry(id: string) {
  const ref = doc(db, "import_entries", id);
  await deleteDoc(ref);
  return true;
}
