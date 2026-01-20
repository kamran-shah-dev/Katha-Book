import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/firebaseConfig";
import { updateAccountBalance } from "./accounts.services";

const cashbookCollection = collection(db, "cashbook_entries");

// --------------------------------------------------
// 🔥 REALTIME LISTENER FOR CASHBOOK ENTRIES
// --------------------------------------------------
export function listenCashEntries(callback: (data: any[]) => void) {
  const q = query(cashbookCollection, orderBy("date", "desc"));

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
// 🔥 CREATE ENTRY (updates account balance first)
// --------------------------------------------------
export async function createCashEntry(data: any) {
  try {
    // 1) Update account balance
    const newBalance = await updateAccountBalance(
      data.account_id,
      Number(data.amount),
      data.pay_status
    );

    // 2) Save entry
    const payload = {
      account_id: data.account_id,
      account_name: data.account_name,
      amount: Number(data.amount),
      balance_after: newBalance,
      type: data.pay_status,
      date: new Date(data.entry_date),
      payment_details: data.payment_detail || "",
      remarks: data.remarks || "",
      invoice_no: data.payment_detail || "",
      reference_type: "MANUAL",
      reference_id: "",
      created_at: new Date(),
      search_keywords: generateKeywords(data.account_name),
    };

    const ref = await addDoc(cashbookCollection, payload);
    return ref.id;
  } catch (error) {
    console.error("Error creating cashbook entry:", error);
    throw error;
  }
}

// --------------------------------------------------
// 🔥 CREATE ENTRY FROM IMPORT/EXPORT
// --------------------------------------------------
export async function createCashEntryFromTransaction(
  accountId: string,
  accountName: string,
  amount: number,
  type: "CREDIT" | "DEBIT",
  referenceType: "IMPORT" | "EXPORT",
  referenceId: string,
  invoiceNo: string,
  date: Date
) {
  try {
    const newBalance = await updateAccountBalance(accountId, amount, type);

    const payload = {
      account_id: accountId,
      account_name: accountName,
      amount,
      balance_after: newBalance,
      type,
      date,
      payment_details: `${referenceType} ${invoiceNo}`,
      remarks: `Auto-generated from ${referenceType} entry`,
      invoice_no: invoiceNo,
      reference_type: referenceType,
      reference_id: referenceId,
      created_at: new Date(),
      search_keywords: generateKeywords(accountName),
    };

    const ref = await addDoc(cashbookCollection, payload);
    return ref.id;
  } catch (error) {
    console.error("Error creating auto cashbook entry:", error);
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
      const results = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      resolve(results);
      unsubscribe(); // Stop after one-time search result
    });
  });
}

// --------------------------------------------------
// 🔥 UPDATE ENTRY
// (⚠️ Complex balances not recalculated here)
// --------------------------------------------------
export async function updateCashEntry(id: string, data: any) {
  const ref = doc(db, "cashbook_entries", id);

  const payload = {
    account_id: data.account_id,
    account_name: data.account_name,
    amount: Number(data.amount),
    date: new Date(data.entry_date),
    invoice_no: data.payment_detail || "",
    payment_details: data.payment_detail || "",
    remarks: data.remarks || "",
    type: data.pay_status,
    search_keywords: generateKeywords(data.account_name),
  };

  await updateDoc(ref, payload);
  return true;
}

// --------------------------------------------------
// 🔥 DELETE ENTRY
// (⚠️ Does not recalc balances yet)
// --------------------------------------------------
export async function deleteCashEntry(id: string) {
  const ref = doc(db, "cashbook_entries", id);
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
