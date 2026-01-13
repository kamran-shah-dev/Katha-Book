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
} from "firebase/firestore";

import { db } from "@/firebaseConfig";

const accountsCollection = collection(db, "accounts");

// 🔥 CREATE ACCOUNT
export async function createAccount(data: any) {
  const payload = {
    account_name: data.account_name,
    sub_head: data.sub_head,
    balance_status: data.balance_status,
    opening_balance: Number(data.opening_balance),
    current_balance: Number(data.opening_balance), // ⬅️ INITIALIZE WITH OPENING BALANCE
    cell_no: data.cell_no,
    ntn_number: data.ntn_number || "",
    address: data.address || "",
    is_active: data.is_active,
    created_at: new Date(),
    search_keywords: generateKeywords(data.account_name),
  };

  const docRef = await addDoc(accountsCollection, payload);
  return docRef.id;
}

// 🔥 GENERATE SEARCH KEYWORDS
function generateKeywords(name: string) {
  const lower = name.toLowerCase();
  return [lower, ...lower.split(" ")];
}

// 🔥 GET ALL ACCOUNTS
export async function fetchAccounts() {
  const q = query(accountsCollection, orderBy("account_name", "asc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

// 🔥 GET ACCOUNT BY ID
export async function getAccountById(id: string) {
  const ref = doc(db, "accounts", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data(),
  };
}

// 🔥 UPDATE ACCOUNT BALANCE (CALLED BY CASHBOOK/IMPORT/EXPORT)
export async function updateAccountBalance(
  accountId: string,
  amount: number,
  type: "CREDIT" | "DEBIT"
) {
  const ref = doc(db, "accounts", accountId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Account not found");
  }

  const currentBalance = Number(snap.data().current_balance || 0);

  let newBalance = 0;

  if (type === "CREDIT") {
    newBalance = currentBalance + amount;
  } else {
    newBalance = currentBalance - amount;
  }

  await updateDoc(ref, {
    current_balance: newBalance,
  });

  return newBalance;
}

// 🔥 SEARCH ACCOUNTS BY NAME
export async function searchAccounts(keyword: string) {
  const lower = keyword.toLowerCase();

  const q = query(
    accountsCollection,
    where("search_keywords", "array-contains", lower)
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

// 🔥 UPDATE ACCOUNT
export async function updateAccount(id: string, data: any) {
  const ref = doc(db, "accounts", id);

  const payload = {
    account_name: data.account_name,
    sub_head: data.sub_head,
    balance_status: data.balance_status,
    opening_balance: Number(data.opening_balance),
    cell_no: data.cell_no,
    ntn_number: data.ntn_number || "",
    address: data.address || "",
    is_active: data.is_active,
    search_keywords: generateKeywords(data.account_name),
  };

  await updateDoc(ref, payload);
  return true;
}

// 🔥 DELETE ACCOUNT
export async function deleteAccount(id: string) {
  const ref = doc(db, "accounts", id);
  await deleteDoc(ref);
  return true;
}