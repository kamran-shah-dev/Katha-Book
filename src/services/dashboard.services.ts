import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";

export async function getDashboardTotals() {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const startTS = Timestamp.fromDate(start);
    const endTS = Timestamp.fromDate(end);

    // ---------------------------
    // 🔥 RUN ALL FIRESTORE QUERIES IN PARALLEL
    // ---------------------------
    const [
      cashSnap,
      importSnap,
      exportSnap,
      accountsSnap
    ] = await Promise.all([
      getDocs(
        query(
          collection(db, "cashbook_entries"),
          where("date", ">=", startTS),
          where("date", "<=", endTS)
        )
      ),
      getDocs(
        query(
          collection(db, "import_entries"),
          where("entry_date", ">=", startTS),
          where("entry_date", "<=", endTS)
        )
      ),
      getDocs(
        query(
          collection(db, "export_entries"),
          where("entry_date", ">=", startTS),
          where("entry_date", "<=", endTS)
        )
      ),
      getDocs(collection(db, "accounts"))
    ]);

    // ---------------------------
    // 🔥 PROCESS CASHBOOK
    // ---------------------------
    let todayCredit = 0;
    let todayDebit = 0;

    cashSnap.forEach((d) => {
      const data = d.data();
      const amount = Number(data.amount || 0);
      if (data.type === "CREDIT") todayCredit += amount;
      if (data.type === "DEBIT") todayDebit += amount;
    });

    const cashInHand = todayCredit - todayDebit;

    // ---------------------------
    // 🔥 IMPORT TOTALS
    // ---------------------------
    let todayImportTotal = 0;
    importSnap.forEach((d) => {
      todayImportTotal += Number(d.data().amount || 0);
    });

    // ---------------------------
    // 🔥 EXPORT TOTALS
    // ---------------------------
    let todayExportTotal = 0;
    exportSnap.forEach((d) => {
      todayExportTotal += Number(d.data().amount || 0);
    });

    // ---------------------------
    // 🔥 ACCOUNT SUMMARY
    // ---------------------------
    let activeAccounts = 0;
    let inactiveAccounts = 0;

    accountsSnap.forEach((d) => {
      const { is_active } = d.data();
      if (is_active) activeAccounts++;
      else inactiveAccounts++;
    });

    // ---------------------------
    // 🔥 RETURN FINAL DASHBOARD DATA
    // ---------------------------
    return {
      // DAILY
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
      inactiveAccounts
    };
  } catch (error) {
    console.error("Dashboard Totals Error:", error);
    return null;
  }
}
