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
import { CashEntry } from "@/lib/types";

const cashbookCollection = collection(db, "cashbook_entries");

// --------------------------------------------------
// 🔥 REALTIME LISTENER FOR CASHBOOK ENTRIES
// --------------------------------------------------
export function listenCashEntries(callback: (data: CashEntry[]) => void) {
  const q = query(cashbookCollection, orderBy("date", "desc"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as CashEntry[];
    callback(list);
  });

  return unsubscribe;
}

// --------------------------------------------------
// 🔥 CREATE ENTRY (OPTIMIZED WITH BATCH WRITE)
// --------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createCashEntry(data: any) {
  try {
    // Get account current balance
    const accountRef = doc(db, "accounts", data.account_id);
    const accountSnap = await getDoc(accountRef);

    if (!accountSnap.exists()) {
      throw new Error("Account not found");
    }

    const currentBalance = Number(accountSnap.data().current_balance || 0);
    
    // Calculate new balance
    let newBalance = 0;
    if (data.pay_status === "CREDIT") {
      newBalance = currentBalance + Number(data.amount);
    } else {
      newBalance = currentBalance - Number(data.amount);
    }

    // Prepare cashbook entry
    const cashbookPayload = {
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

    // Use batch write for atomic operation
    const batch = writeBatch(db);

    // Add cashbook entry
    const cashbookRef = doc(cashbookCollection);
    batch.set(cashbookRef, cashbookPayload);

    // Update account balance
    batch.update(accountRef, {
      current_balance: newBalance,
    });

    // Commit batch (faster than sequential operations)
    await batch.commit();

    return cashbookRef.id;
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
    // Get account current balance
    const accountRef = doc(db, "accounts", accountId);
    const accountSnap = await getDoc(accountRef);

    if (!accountSnap.exists()) {
      throw new Error("Account not found");
    }

    const currentBalance = Number(accountSnap.data().current_balance || 0);
    
    // Calculate new balance
    let newBalance = 0;
    if (type === "CREDIT") {
      newBalance = currentBalance + amount;
    } else {
      newBalance = currentBalance - amount;
    }

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

    // Use batch write
    const batch = writeBatch(db);

    const cashbookRef = doc(cashbookCollection);
    batch.set(cashbookRef, payload);

    batch.update(accountRef, {
      current_balance: newBalance,
    });

    await batch.commit();

    return cashbookRef.id;
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

  return new Promise<CashEntry[]>((resolve) => {
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as CashEntry[];
      resolve(results);
      unsubscribe();
    });
  });
}


// --------------------------------------------------
// 🔥 UPDATE ENTRY
// --------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateCashEntry(id: string, data: any) {
  try {
    // Get the existing entry
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

    // Reverse old transaction
    let currentBalance = Number(accountSnap.data().current_balance || 0);
    
    if (oldEntry.type === "CREDIT") {
      currentBalance -= Number(oldEntry.amount);
    } else {
      currentBalance += Number(oldEntry.amount);
    }

    // Apply new transaction
    if (data.pay_status === "CREDIT") {
      currentBalance += Number(data.amount);
    } else {
      currentBalance -= Number(data.amount);
    }

    const payload = {
      account_id: data.account_id,
      account_name: data.account_name,
      amount: Number(data.amount),
      balance_after: currentBalance,
      date: new Date(data.entry_date),
      invoice_no: data.payment_detail || "",
      payment_details: data.payment_detail || "",
      remarks: data.remarks || "",
      type: data.pay_status,
      search_keywords: generateKeywords(data.account_name),
    };

    // Use batch write
    const batch = writeBatch(db);

    batch.update(entryRef, payload);
    batch.update(accountRef, {
      current_balance: currentBalance,
    });

    await batch.commit();

    return true;
  } catch (error) {
    console.error("Error updating cashbook entry:", error);
    throw error;
  }
}

// --------------------------------------------------
// 🔥 DELETE ENTRY
// --------------------------------------------------
export async function deleteCashEntry(id: string) {
  try {
    const entryRef = doc(db, "cashbook_entries", id);
    const entrySnap = await getDoc(entryRef);

    if (!entrySnap.exists()) {
      throw new Error("Entry not found");
    }

    const entry = entrySnap.data();
    const accountRef = doc(db, "accounts", entry.account_id);
    const accountSnap = await getDoc(accountRef);

    if (!accountSnap.exists()) {
      throw new Error("Account not found");
    }

    // Reverse the transaction
    let currentBalance = Number(accountSnap.data().current_balance || 0);
    
    if (entry.type === "CREDIT") {
      currentBalance -= Number(entry.amount);
    } else {
      currentBalance += Number(entry.amount);
    }

    // Use batch write
    const batch = writeBatch(db);

    batch.delete(entryRef);
    batch.update(accountRef, {
      current_balance: currentBalance,
    });

    await batch.commit();

    return true;
  } catch (error) {
    console.error("Error deleting cashbook entry:", error);
    throw error;
  }
}

// --------------------------------------------------
// 🔥 GENERATE SEARCH KEYWORDS
// --------------------------------------------------
function generateKeywords(name: string) {
  const lower = name.toLowerCase();
  return [lower, ...lower.split(" ")];
}
