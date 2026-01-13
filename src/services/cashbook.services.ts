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
  limit
  
} from "firebase/firestore";

import { db } from "@/firebaseConfig";

const cashbookCollection = collection(db, "cashbook_entries");

// 🔥 CREATE ENTRY
export async function createCashEntry(data: any) {
  // 1. GET LAST ENTRY FOR THIS ACCOUNT
  const q = query(
    cashbookCollection,
    where("account_id", "==", data.account_id),
    orderBy("date", "desc"),
    limit(1)
  );

  const snap = await getDocs(q);

  let lastBalance = 0;

  if (!snap.empty) {
    lastBalance = snap.docs[0].data().balance_after || 0;
  } else {
    // If no entry yet, use opening balance from account
    const accountDoc = doc(db, "accounts", data.account_id);
    const accSnap = await getDoc(accountDoc);

    if (accSnap.exists()) {
      lastBalance = Number(accSnap.data().opening_balance || 0);
    }
  }

  // 2. CALCULATE NEW BALANCE
  let newBalance = 0;

  if (data.pay_status === "CREDIT") {
    newBalance = lastBalance + Number(data.amount);
  } else {
    newBalance = lastBalance - Number(data.amount);
  }

  // 3. SAVE ENTRY WITH updated balance_after
  const payload = {
    account_id: data.account_id,
    account_name: data.account_name,
    amount: Number(data.amount),
    balance_after: newBalance,
    created_at: new Date(),
    date: new Date(data.entry_date),
    invoice_no: data.payment_detail || "",
    payment_details: data.payment_detail || "",
    remarks: data.remarks || "",
    type: data.pay_status,
    search_keywords: generateKeywords(data.account_name),
  };

  const docRef = await addDoc(cashbookCollection, payload);
  return docRef.id;
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

// 🔥 UPDATE ENTRY
export async function updateCashEntry(id: string, data: any) {
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

// 🔥 DELETE ENTRY
export async function deleteCashEntry(id: string) {
  const ref = doc(db, "cashbook_entries", id);
  await deleteDoc(ref);
  return true;
}
