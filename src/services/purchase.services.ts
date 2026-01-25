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

const purchaseCollection = collection(db, "purchase_entries");

/* =========================
   REALTIME LISTENER
========================= */
export function listenPurchaseEntries(callback: (list: any[]) => void) {
  return onSnapshot(
    query(purchaseCollection, orderBy("entry_date", "desc")),
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
   CREATE PURCHASE ENTRY
========================= */
export async function createPurchaseEntry(data: any) {
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
    purchase_no: data.purchase_no,

    entry_date: Timestamp.fromDate(entryDate),
    created_at: Timestamp.now(),

    search_keywords: generateKeywords(data.account_name),
  };

  const docRef = await addDoc(purchaseCollection, payload);

  // 🔥 LOG (non-blocking)
  logActivity({
    action: "CREATE",
    entity: "PURCHASE",
    entity_id: docRef.id,
    description: `Created purchase entry #${payload.purchase_no}`,
    performed_by: data.created_by || "System",
    metadata: {
      amount: payload.amount,
      account: payload.account_name,
    },
  });

  return docRef.id;
}

/* =========================
   UPDATE PURCHASE ENTRY
========================= */
export async function updatePurchaseEntryById(id: string, data: any) {
  const ref = doc(db, "purchase_entries", id);

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

    search_keywords: generateKeywords(data.account_name),
  };

  await updateDoc(ref, payload);

  // 🔥 LOG
  logActivity({
    action: "UPDATE",
    entity: "PURCHASE",
    entity_id: id,
    description: `Updated purchase entry #${data.purchase_no}`,
    performed_by: data.modified_by || "System",
  });

  return true;
}

/* =========================
   DELETE PURCHASE ENTRY
========================= */
export async function deletePurchaseEntryById(
  id: string,
  userName?: string
) {
  await deleteDoc(doc(db, "purchase_entries", id));
  // 🔥 LOG
  logActivity({
    action: "DELETE",
    entity: "PURCHASE",
    entity_id: id,
    description: "Deleted purchase entry",
    performed_by: userName || "System",
  });

  return true;
}

/* =========================
   GET LAST PURCHASE NUMBER
========================= */
export async function getLastPurchaseNo() {
  const q = query(
    purchaseCollection,
    orderBy("purchase_no", "desc"),
    limit(1)
  );

  const snap = await getDocs(q);
  return snap.empty ? "PUR000" : snap.docs[0].data().purchase_no;
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
