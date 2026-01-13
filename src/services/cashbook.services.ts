import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  limit,
} from "firebase/firestore";

import { db } from "@/firebaseConfig";
import { updateAccountBalance } from "./accounts.services";

const cashbookCollection = collection(db, "cashbook_entries");

// 🔥 CREATE ENTRY (WITH ACCOUNT BALANCE UPDATE)
export async function createCashEntry(data: any) {
  try {
    // 1. UPDATE ACCOUNT BALANCE FIRST
    const newBalance = await updateAccountBalance(
      data.account_id,
      Number(data.amount),
      data.pay_status
    );

    // 2. CREATE CASHBOOK ENTRY
    const payload = {
      account_id: data.account_id,
      account_name: data.account_name,
      amount: Number(data.amount),
      balance_after: newBalance, // ⬅️ Store the account's new balance
      type: data.pay_status,
      date: new Date(data.entry_date),
      payment_details: data.payment_detail || "",
      remarks: data.remarks || "",
      invoice_no: data.payment_detail || "",
      reference_type: "MANUAL", // ⬅️ Indicate this is a manual entry
      reference_id: "", // ⬅️ Empty for manual entries
      created_at: new Date(),
      search_keywords: generateKeywords(data.account_name),
    };

    const docRef = await addDoc(cashbookCollection, payload);
    return docRef.id;
  } catch (error) {
    console.error("Error creating cashbook entry:", error);
    throw error;
  }
}

// 🔥 CREATE ENTRY FROM IMPORT/EXPORT (AUTO-GENERATED)
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
    // 1. UPDATE ACCOUNT BALANCE
    const newBalance = await updateAccountBalance(accountId, amount, type);

    // 2. CREATE CASHBOOK ENTRY
    const payload = {
      account_id: accountId,
      account_name: accountName,
      amount: amount,
      balance_after: newBalance,
      type: type,
      date: date,
      payment_details: `${referenceType} ${invoiceNo}`,
      remarks: `Auto-generated from ${referenceType} entry`,
      invoice_no: invoiceNo,
      reference_type: referenceType,
      reference_id: referenceId,
      created_at: new Date(),
      search_keywords: generateKeywords(accountName),
    };

    const docRef = await addDoc(cashbookCollection, payload);
    return docRef.id;
  } catch (error) {
    console.error("Error creating auto cashbook entry:", error);
    throw error;
  }
}

// 🔥 GENERATE SEARCH KEYWORDS
function generateKeywords(name: string) {
  const lower = name.toLowerCase();
  return [lower, ...lower.split(" ")];
}

// 🔥 FETCH ALL ENTRIES
export async function fetchCashEntries() {
  const q = query(cashbookCollection, orderBy("date", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

// 🔥 SEARCH BY KEYWORD
export async function searchCashEntries(keyword: string) {
  const lower = keyword.toLowerCase();

  const q = query(
    cashbookCollection,
    where("search_keywords", "array-contains", lower)
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

// 🔥 UPDATE ENTRY (COMPLEX - NEEDS BALANCE RECALCULATION)
export async function updateCashEntry(id: string, data: any) {
  // ⚠️ WARNING: Updating cashbook entries is complex because it affects account balances
  // For now, we'll just update the entry details but NOT recalculate balances
  // In a production system, you'd need to:
  // 1. Get the old entry
  // 2. Reverse the old balance change
  // 3. Apply the new balance change
  // 4. Update all subsequent entries for that account

  const ref = doc(db, "cashbook_entries", id);

  const payload = {
    account_id: data.account_id || "",
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

// 🔥 DELETE ENTRY (ALSO COMPLEX - NEEDS BALANCE RECALCULATION)
export async function deleteCashEntry(id: string) {
  // ⚠️ WARNING: Same issue as update - deleting affects balances
  // For now, simple delete. In production, you'd need to recalculate all balances

  const ref = doc(db, "cashbook_entries", id);
  await deleteDoc(ref);
  return true;
}