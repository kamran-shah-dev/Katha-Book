import {
  collection,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/firebaseConfig";
import { logActivity } from "./activityLog.services";

const cashbookCollection = collection(db, "cashbook_entries");

// --------------------------------------------------
// 🔥 REALTIME LISTENER FOR CASHBOOK ENTRIES
// --------------------------------------------------
export function listenCashEntries(callback: (data: any[]) => void) {
  const q = query(cashbookCollection, orderBy("created_at", "desc"));

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(list);
  });
}

// --------------------------------------------------
// 🔥 CREATE ENTRY
// --------------------------------------------------
export async function createCashEntry(data: any) {
  try {
    const accountRef = doc(db, "accounts", data.account_id);
    const accountSnap = await getDoc(accountRef);

    if (!accountSnap.exists()) {
      throw new Error("Account not found");
    }

    const currentBalance = Number(accountSnap.data().current_balance || 0);
    const newBalance =
      data.type === "CREDIT"
        ? currentBalance + Number(data.amount)
        : currentBalance - Number(data.amount);

    const payload = {
      account_id: data.account_id,
      account_name: data.account_name,
      amount: Number(data.amount),
      balance_after: newBalance,
      type: data.type,
      date:
        data.date instanceof Timestamp
          ? data.date
          : Timestamp.fromDate(new Date(data.date)),
      payment_details: data.payment_details || "",
      remarks: data.remarks || "",
      invoice_no: data.payment_details || "",
      reference_type: "MANUAL",
      reference_id: "",
      created_at: Timestamp.now(),
      entry_by: data.entry_by || "Unknown",
      search_keywords: generateKeywords(data.account_name),
    };

    const batch = writeBatch(db);
    const cashbookRef = doc(cashbookCollection);

    batch.set(cashbookRef, payload);
    batch.update(accountRef, { current_balance: newBalance });

    await batch.commit();

    // 🔥 LOG (non-blocking)
    logActivity({
      action: "CREATE",
      entity: "CASHBOOK",
      entity_id: cashbookRef.id,
      description: `Created cashbook entry (${data.type}) for ${data.account_name}`,
      performed_by: data.entry_by || "System",
    });

    return cashbookRef.id;
  } catch (error) {
    console.error("Error creating cashbook entry:", error);
    throw error;
  }
}

// --------------------------------------------------
// 🔥 SEARCH ENTRIES
// --------------------------------------------------
export async function searchCashEntries(keyword: string) {
  const lower = keyword.toLowerCase().trim();

  const q = query(
    cashbookCollection,
    where("search_keywords", "array-contains", lower)
  );

  return new Promise<any[]>((resolve) => {
    const unsubscribe = onSnapshot(q, (snapshot) => {
      resolve(
        snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
      unsubscribe();
    });
  });
}

// --------------------------------------------------
// 🔥 UPDATE ENTRY
// --------------------------------------------------
export async function updateCashEntry(id: string, data: any) {
  try {
    const entryRef = doc(db, "cashbook_entries", id);
    const entrySnap = await getDoc(entryRef);

    if (!entrySnap.exists()) {
      throw new Error("Entry not found");
    }

    const oldEntry = entrySnap.data();
    const accountRef = doc(db, "accounts", data.account_id);
    const accountSnap = await getDoc(accountRef);

    if (!accountSnap.exists()) {
      throw new Error("Account not found");
    }

    let currentBalance = Number(accountSnap.data().current_balance || 0);

    // reverse old
    currentBalance +=
      oldEntry.type === "CREDIT"
        ? -Number(oldEntry.amount)
        : Number(oldEntry.amount);

    // apply new
    currentBalance +=
      data.type === "CREDIT"
        ? Number(data.amount)
        : -Number(data.amount);

    const payload = {
      account_id: data.account_id,
      account_name: data.account_name,
      amount: Number(data.amount),
      balance_after: currentBalance,
      date:
        data.date instanceof Timestamp
          ? data.date
          : Timestamp.fromDate(new Date(data.date)),
      payment_details: data.payment_details || "",
      remarks: data.remarks || "",
      type: data.type,
      modified_at: Timestamp.now(),
      modified_by: data.modified_by || data.entry_by || "Unknown",
      search_keywords: generateKeywords(data.account_name),
      created_at: oldEntry.created_at,
      entry_by: oldEntry.entry_by,
    };

    const batch = writeBatch(db);
    batch.update(entryRef, payload);
    batch.update(accountRef, { current_balance: currentBalance });
    await batch.commit();

    // 🔥 LOG
    logActivity({
      action: "UPDATE",
      entity: "CASHBOOK",
      entity_id: id,
      description: `Updated cashbook entry for ${data.account_name}`,
      performed_by: data.modified_by || data.entry_by || "System",
    });

    return true;
  } catch (error) {
    console.error("Error updating cashbook entry:", error);
    throw error;
  }
}

// --------------------------------------------------
// 🔥 DELETE ENTRY (FAST)
// --------------------------------------------------
export async function deleteCashEntry(id: string, userName?: string) {
  await deleteDoc(doc(db, "cashbook_entries", id));

  // 🔥 LOG
  logActivity({
    action: "DELETE",
    entity: "CASHBOOK",
    entity_id: id,
    description: "Deleted cashbook entry",
    performed_by: userName || "System",
  });
}

// --------------------------------------------------
// 🔑 SEARCH KEYWORDS
// --------------------------------------------------
function generateKeywords(name: string) {
  const lower = name?.toLowerCase().trim();
  if (!lower) return [];

  const words = lower.split(" ").filter(Boolean);
  return Array.from(new Set([lower, ...words]));
}
