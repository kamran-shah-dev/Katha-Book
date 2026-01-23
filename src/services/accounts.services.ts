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
import { logActivity } from "./activityLog.services";

// ---------------------------------------
// COLLECTION REFERENCE
// ---------------------------------------
const accountsCollection = collection(db, "accounts");

// ---------------------------------------
// 🔥 REALTIME LISTENER FOR ACCOUNTS
// ---------------------------------------
export function listenAccounts(callback: (data: any[]) => void) {
  const q = query(accountsCollection, orderBy("account_name", "asc"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    callback(list);
  });

  return unsubscribe;
}

// ---------------------------------------
// 🔥 CREATE ACCOUNT
// ---------------------------------------
export async function createAccount(data: any) {
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

  // 1️⃣ Create account
  const docRef = await addDoc(accountsCollection, payload);

  // 2️⃣ Log activity (non-blocking)
  logActivity({
    action: "CREATE",
    entity: "ACCOUNT",
    entity_id: docRef.id,
    description: `Created account "${data.account_name}"`,
    performed_by: data.created_by || "System",
  });

  return docRef.id;
}

// ---------------------------------------
// 🔥 GET SINGLE ACCOUNT
// ---------------------------------------
export async function getAccountById(id: string) {
  const ref = doc(db, "accounts", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data(),
  };
}

// ---------------------------------------
// 🔥 UPDATE ACCOUNT
// ---------------------------------------
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

  // 1️⃣ Update account
  await updateDoc(ref, payload);

  // 2️⃣ Log activity
  logActivity({
    action: "UPDATE",
    entity: "ACCOUNT",
    entity_id: id,
    description: `Updated account "${data.account_name}"`,
    performed_by: data.modified_by || "System",
  });

  return true;
}

// ---------------------------------------
// 🔥 DELETE ACCOUNT
// ---------------------------------------
export async function deleteAccount(id: string, userName?: string) {
  const ref = doc(db, "accounts", id);

  // 1️⃣ Delete account
  await deleteDoc(ref);

  // 2️⃣ Log activity
  logActivity({
    action: "DELETE",
    entity: "ACCOUNT",
    entity_id: id,
    description: `Deleted account`,
    performed_by: userName || "System",
  });

  return true;
}

// ---------------------------------------
// 🔍 SEARCH ACCOUNTS
// ---------------------------------------
export async function searchAccounts(keyword: string) {
  const lower = keyword.toLowerCase().trim();

  const q = query(
    accountsCollection,
    where("search_keywords", "array-contains", lower)
  );

  return new Promise<any[]>((resolve) => {
    const results: any[] = [];

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });

      unsubscribe();
      resolve(results);
    });
  });
}

// ---------------------------------------
// 🔥 UPDATE ACCOUNT BALANCE
// (USED BY CASHBOOK / TRANSACTIONS)
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
    type === "CREDIT"
      ? currentBalance + amount
      : currentBalance - amount;

  await updateDoc(ref, {
    current_balance: newBalance,
  });

  return newBalance;
}

// ---------------------------------------
// 🔑 SEARCH KEYWORDS HELPER
// ---------------------------------------
function generateKeywords(name: string) {
  const lower = name?.toLowerCase().trim();
  if (!lower) return [];

  const words = lower.split(" ").filter(Boolean);
  return Array.from(new Set([lower, ...words]));
}
