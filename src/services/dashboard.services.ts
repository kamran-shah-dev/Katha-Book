import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";

function normalizeDate(value: any): Date {
  if (!value) return new Date(0);

  if (value instanceof Timestamp) return value.toDate();
  if (value.toDate) return value.toDate();
  if (typeof value === "string") return new Date(value);
  if (value instanceof Date) return value;

  return new Date(0);
}

export async function getDashboardTotals() {
  try {
    // GET START AND END OF TODAY
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const startTS = Timestamp.fromDate(startOfDay);
    const endTS = Timestamp.fromDate(endOfDay);

    // ================================
    // 1️⃣ CASHBOOK
    // ================================
    const cashSnap = await getDocs(
      query(
        collection(db, "cashbook_entries"),
        where("date", ">=", startTS),
        where("date", "<=", endTS)
      )
    );

    let todayCredit = 0;
    let todayDebit = 0;

    cashSnap.forEach((d) => {
      const data = d.data();
      const amount = Number(data.amount || 0);

      if (data.type === "CREDIT") todayCredit += amount;
      if (data.type === "DEBIT") todayDebit += amount;
    });

    const cashInHand = todayCredit - todayDebit;

    // ================================
    // 2️⃣ IMPORTS
    // ================================
    const importSnap = await getDocs(
      query(
        collection(db, "import_entries"),
        where("entry_date", ">=", startTS),
        where("entry_date", "<=", endTS)
      )
    );

    let todayImportTotal = 0;

    importSnap.forEach((d) => {
      todayImportTotal += Number(d.data().amount || 0);
    });

    // ================================
    // 3️⃣ EXPORTS
    // ================================
    const exportSnap = await getDocs(
      query(
        collection(db, "export_entries"),
        where("entry_date", ">=", startTS),
        where("entry_date", "<=", endTS)
      )
    );

    let todayExportTotal = 0;

    exportSnap.forEach((d) => {
      todayExportTotal += Number(d.data().amount || 0);
    });

    // ================================
    // 4️⃣ ACCOUNTS SUMMARY
    // ================================
    const accountsSnap = await getDocs(collection(db, "accounts"));

    let activeAccounts = 0;
    let inactiveAccounts = 0;

    accountsSnap.forEach((d) => {
      const { is_active } = d.data();
      if (is_active) activeAccounts++;
      else inactiveAccounts++;
    });

    // RETURN DASHBOARD SUMMARY
    return {
      // TODAY
      todayCashbookCount: cashSnap.size,
      todayCredit,
      todayDebit,
      cashInHand,

      todayImportCount: importSnap.size,
      todayImportTotal,

      todayExportCount: exportSnap.size,
      todayExportTotal,

      // ALL TIME
      totalAccounts: accountsSnap.size,
      activeAccounts,
      inactiveAccounts,
    };
  } catch (error) {
    console.error("❌ Dashboard Totals Error:", error);
    return null;
  }
}
