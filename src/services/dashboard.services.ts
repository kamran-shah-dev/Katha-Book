import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";

export async function getDashboardTotals() {
  try {
    // Get start and end of today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // 1. TODAY'S CASHBOOK ENTRIES
    const cashbookSnap = await getDocs(
      query(
        collection(db, "cashbook_entries"),
        where("date", ">=", Timestamp.fromDate(startOfDay)),
        where("date", "<=", Timestamp.fromDate(endOfDay))
      )
    );

    let todayCredit = 0;
    let todayDebit = 0;
    const todayCashbookCount = cashbookSnap.size;

    cashbookSnap.forEach((doc) => {
      const data = doc.data();

      if (data.type === "CREDIT") {
        todayCredit += Number(data.amount || 0);
      } else if (data.type === "DEBIT") {
        todayDebit += Number(data.amount || 0);
      }
    });

    const cashInHand = todayCredit - todayDebit;

    // 2. TODAY'S IMPORT ENTRIES
    const importSnap = await getDocs(
      query(
        collection(db, "import_entries"),
        where("entry_date", ">=", Timestamp.fromDate(startOfDay)),
        where("entry_date", "<=", Timestamp.fromDate(endOfDay))
      )
    );

    let todayImportTotal = 0;
    importSnap.forEach((doc) => {
      todayImportTotal += Number(doc.data().amount || 0);
    });

    // 3. TODAY'S EXPORT ENTRIES
    const exportSnap = await getDocs(
      query(
        collection(db, "export_entries"),
        where("entry_date", ">=", Timestamp.fromDate(startOfDay)),
        where("entry_date", "<=", Timestamp.fromDate(endOfDay))
      )
    );

    let todayExportTotal = 0;
    exportSnap.forEach((doc) => {
      todayExportTotal += Number(doc.data().amount || 0);
    });

    // 4. TOTAL ACCOUNTS (ALL TIME - NOT DAILY)
    const accountsSnap = await getDocs(collection(db, "accounts"));

    let activeAccounts = 0;
    let inactiveAccounts = 0;

    accountsSnap.forEach((doc) => {
      const data = doc.data();
      if (data.is_active === true) {
        activeAccounts++;
      } else {
        inactiveAccounts++;
      }
    });

    return {
      // TODAY'S DATA
      todayCashbookCount,
      todayCredit,
      todayDebit,
      cashInHand,
      todayImportCount: importSnap.size,
      todayImportTotal,
      todayExportCount: exportSnap.size,
      todayExportTotal,

      // ALL TIME DATA
      totalAccounts: accountsSnap.size,
      activeAccounts,
      inactiveAccounts,
    };
  } catch (error) {
    console.error("❌ Error fetching dashboard totals:", error);
    throw error;
  }
}