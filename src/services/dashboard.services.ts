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
      invoiceSnap,
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
          collection(db, "invoice_entries"),
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
    // 🔥 INVOICE TOTALS
    // ---------------------------
    let todayInvoiceTotal = 0;
    invoiceSnap.forEach((d) => {
      todayInvoiceTotal += Number(d.data().amount || 0);
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

      todayInvoiceCount: invoiceSnap.size,
      todayInvoiceTotal,

      // ALL TIME
      totalAccounts: accountsSnap.size,
      activeAccounts,
      inactiveAccounts
    };
  } catch (error) {
    console.error("Dashboard Totals Error:", error);
    // Return default values instead of null to prevent errors
    return {
      todayCashbookCount: 0,
      todayCredit: 0,
      todayDebit: 0,
      cashInHand: 0,
      todayInvoiceCount: 0,
      todayInvoiceTotal: 0,
      totalAccounts: 0,
      activeAccounts: 0,
      inactiveAccounts: 0
    };
  }
}