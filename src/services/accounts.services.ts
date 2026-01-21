import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  orderBy,
  where,
  onSnapshot,
} from "firebase/firestore";

import { db } from "@/firebaseConfig";
import { Account } from "@/lib/types";

// COLLECTION REFERENCE
const accountsCollection = collection(db, "accounts");

// ---------------------------------------
// 🔥 REALTIME LISTENER FOR ACCOUNTS (MAIN FIX)
// ---------------------------------------
export function listenAccounts(callback: (data: Account[]) => void) {
  const q = query(accountsCollection, orderBy("account_name", "asc"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Account[];

    callback(list);
  });

  return unsubscribe;
}

// ---------------------------------------
// 🔥 CREATE ACCOUNT
// ---------------------------------------
export async function createAccount(data: Omit<Account, "id" | "current_balance" | "created_at" | "search_keywords">) {
  const payload = {
    account_name: data.account_name,
    sub_head: data.sub_head,
    balance_status: data.balance_status,
    opening_balance: Number(data.opening_balance),
    current_balance: Number(data.opening_balance),
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

// ---------------------------------------
// 🔥 GENERATE SEARCH KEYWORDS
// ---------------------------------------
function generateKeywords(name: string) {
  const lower = name.toLowerCase().trim();

  if (!lower) return [];

  const words = lower.split(" ").filter(Boolean);

  return Array.from(new Set([lower, ...words]));
}

// ---------------------------------------
// 🔥 GET SINGLE ACCOUNT
// ---------------------------------------
export async function getAccountById(id: string): Promise<Account | null> {
  const ref = doc(db, "accounts", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data(),
  } as Account;
}

// ---------------------------------------
// 🔥 UPDATE ACCOUNT
// (listener will auto-refresh UI)
// ---------------------------------------
export async function updateAccount(id: string, data: Partial<Account>) {
  const ref = doc(db, "accounts", id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {
    account_name: data.account_name,
    sub_head: data.sub_head,
    balance_status: data.balance_status,
    opening_balance: Number(data.opening_balance),
    cell_no: data.cell_no,
    ntn_number: data.ntn_number || "",
    address: data.address || "",
    is_active: data.is_active,
  };

  if (data.account_name) {
      payload.search_keywords = generateKeywords(data.account_name);
  }

  await updateDoc(ref, payload);
  return true;
}

// ---------------------------------------
// 🔥 DELETE ACCOUNT
// (listener auto-updates, no reload needed)
// ---------------------------------------
export async function deleteAccount(id: string) {
  const ref = doc(db, "accounts", id);
  await deleteDoc(ref);
  return true;
}

// ---------------------------------------
// 🔍 SEARCH ACCOUNTS (Firestore query)
// ---------------------------------------
export async function searchAccounts(keyword: string) {
  const lower = keyword.toLowerCase().trim();

  const q = query(
    accountsCollection,
    where("search_keywords", "array-contains", lower)
  );

  const snap = await new Promise<Account[]>((resolve) => {
    const results: Account[] = [];

    onSnapshot(q, (snapshot) => {
      snapshot.forEach((doc) =>
        results.push({ id: doc.id, ...doc.data() } as Account)
      );
      resolve(results);
    });
  });

  return snap;
}

// ---------------------------------------
// 🔥 UPDATE ACCOUNT BALANCE
// (used by transactions)
// ---------------------------------------
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
  const newBalance =
    type === "CREDIT" ? currentBalance + amount : currentBalance - amount;

  await updateDoc(ref, { current_balance: newBalance });

  return newBalance;
}
