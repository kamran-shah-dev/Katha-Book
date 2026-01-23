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
  Timestamp,
} from "firebase/firestore";

import { db } from "@/firebaseConfig";
import { createCashEntry } from "./cashbook.services";
import { logActivity } from "./activityLog.services";

const invoiceCollection = collection(db, "invoice_entries");

/* =========================
   REALTIME LISTENER
========================= */
export function listenInvoiceEntries(callback: (list: any[]) => void) {
  return onSnapshot(
    query(invoiceCollection, orderBy("entry_date", "desc")),
    (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          entry_date:
            data.entry_date instanceof Timestamp
              ? data.entry_date.toDate()
              : new Date(data.entry_date),
        };
      });

      callback(list);
    }
  );
}

/* =========================
   CREATE INVOICE ENTRY
========================= */
export async function createInvoiceEntry(data: any) {
  const entryDate = new Date(data.entry_date);

  const payload = {
    account_id: data.account_id ?? "",
    account_name: data.account_name ?? "",
    supplier: data.supplier ?? "",

    bags_qty: Number(data.bags_qty || 0),
    weight_per_bag: Number(data.weight_per_bag || 0),
    weight_unit: data.weight_unit || "kg",
    rate_per_kg: Number(data.rate_per_kg || 0),
    total_weight: Number(data.total_weight || 0),
    amount: Number(data.amount || 0),

    vehicle_numbers: data.vehicle_numbers ?? "",
    grn_no: data.grn_no ?? "",
    invoice_no: data.invoice_no,

    entry_date: Timestamp.fromDate(entryDate),
    created_at: Timestamp.now(),

    // Adjustments
    bardana: Number(data.bardana || 0),
    mazdoori: Number(data.mazdoori || 0),
    munshiana: Number(data.munshiana || 0),
    charsadna: Number(data.charsadna || 0),
    walai: Number(data.walai || 0),
    tol: Number(data.tol || 0),

    search_keywords: generateKeywords(data.account_name),
  };

  const docRef = await addDoc(invoiceCollection, payload);

  // 🔥 LOG (non-blocking)
  logActivity({
    action: "CREATE",
    entity: "INVOICE",
    entity_id: docRef.id,
    description: `Created invoice #${payload.invoice_no}`,
    performed_by: data.created_by || "System",
    metadata: {
      amount: payload.amount,
      account: payload.account_name,
    },
  });

  return docRef.id;
}

/* =========================
   UPDATE INVOICE
========================= */
export async function updateInvoiceEntryById(id: string, data: any) {
  const ref = doc(db, "invoice_entries", id);

  const payload = {
    account_id: data.account_id,
    account_name: data.account_name,
    supplier: data.supplier,

    bags_qty: Number(data.bags_qty || 0),
    weight_per_bag: Number(data.weight_per_bag || 0),
    weight_unit: data.weight_unit || "kg",
    rate_per_kg: Number(data.rate_per_kg || 0),
    total_weight: Number(data.total_weight || 0),
    amount: Number(data.amount || 0),

    vehicle_numbers: data.vehicle_numbers,
    grn_no: data.grn_no,

    entry_date: Timestamp.fromDate(new Date(data.entry_date)),

    // Adjustments
    bardana: Number(data.bardana || 0),
    mazdoori: Number(data.mazdoori || 0),
    munshiana: Number(data.munshiana || 0),
    charsadna: Number(data.charsadna || 0),
    walai: Number(data.walai || 0),
    tol: Number(data.tol || 0),

    search_keywords: generateKeywords(data.account_name),
  };

  await updateDoc(ref, payload);

  // 🔥 LOG
  logActivity({
    action: "UPDATE",
    entity: "INVOICE",
    entity_id: id,
    description: `Updated invoice #${data.invoice_no}`,
    performed_by: data.modified_by || "System",
  });

  return true;
}

/* =========================
   DELETE INVOICE
========================= */
export async function deleteInvoiceEntryById(
  id: string,
  userName?: string
) {
  await deleteDoc(doc(db, "invoice_entries", id));

  // 🔥 LOG
  logActivity({
    action: "DELETE",
    entity: "INVOICE",
    entity_id: id,
    description: "Deleted invoice",
    performed_by: userName || "System",
  });

  return true;
}

/* =========================
   GET LAST INVOICE NUMBER
========================= */
export async function getLastInvoiceNo() {
  const q = query(
    invoiceCollection,
    orderBy("invoice_no", "desc"),
    limit(1)
  );

  const snap = await getDocs(q);
  return snap.empty ? "IMP000" : snap.docs[0].data().invoice_no;
}

/* =========================
   SEARCH KEYWORDS
========================= */
function generateKeywords(name = "") {
  const lower = name.toLowerCase().trim();
  if (!lower) return [];

  const words = lower.split(/\s+/);
  return Array.from(new Set([lower, ...words]));
}
