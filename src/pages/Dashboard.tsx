import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  FileText, 
  FolderSearch, 
  Users, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCcw,
  FileInput,
  FileOutput,
  Receipt,
  UserCheck,
  UserX
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardTotals } from "@/services/dashboard.services";

export default function Dashboard() {
  const [stats, setStats] = useState({
    todayCashbookCount: 0,
    todayCredit: 0,
    todayDebit: 0,
    cashInHand: 0,
    todayInvoiceCount: 0,
    todayInvoiceTotal: 0,
    // todayExportCount: 0,
    // todayExportTotal: 0,
    totalAccounts: 0,
    activeAccounts: 0,
    inactiveAccounts: 0,
  });


  useEffect(() => {
    loadTotals();
  }, []);

  const loadTotals = async () => {
    try {
      const result = await getDashboardTotals();
      setStats(result);
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold ml-2 md:ml-6">Dashboard Overview</h1>

        <button
          onClick={loadTotals}
          className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {/* TODAY'S STATS - ROW 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Cash in Hand (Today) */}
        <Card className="border-l-4 border-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Cash In Hand (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              Rs. {stats.cashInHand.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Cashbook Entries (Today) */}
        <Card className="border-l-4 border-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Cashbook Entries (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {stats.todayCashbookCount}
            </p>
          </CardContent>
        </Card>

        {/* Total Credit (Today) */}
        <Card className="border-l-4 border-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-blue-600" />
              Total Credit (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              Rs. {stats.todayCredit.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Total Debit (Today) */}
        <Card className="border-l-4 border-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-red-600" />
              Total Debit (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              Rs. {stats.todayDebit.toLocaleString()}
            </p>
          </CardContent>
        </Card>

      </div>

      {/* INVOICE & ACCOUNTS - ROW 2 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Total Invoices (Today) */}
        <Card className="border-l-4 border-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <FileInput className="h-4 w-4" />
              Total Invoices (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-orange-600">
              {stats.todayInvoiceCount} Entries
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Rs. {stats.todayInvoiceTotal.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Total Exports (Today) */}
        {/* <Card className="border-l-4 border-teal-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <FileOutput className="h-4 w-4" />
              Total Exports (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-teal-600">
              {stats.todayExportCount} Entries
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Rs. {stats.todayExportTotal.toLocaleString()}
            </p>
          </CardContent>
        </Card> */}

        {/* Active Accounts (All Time) */}
        <Card className="border-l-4 border-green-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Active Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">
              {stats.activeAccounts}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Total: {stats.totalAccounts}
            </p>
          </CardContent>
        </Card>

        {/* Inactive Accounts (All Time) */}
        <Card className="border-l-4 border-gray-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Inactive Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-600">
              {stats.inactiveAccounts}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Total: {stats.totalAccounts}
            </p>
          </CardContent>
        </Card>

      </div>

      {/* QUICK REPORT LINKS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <Link
          to="/reports/cashbook"
          className="flex items-center gap-3 p-4 bg-white shadow-md rounded-lg hover:shadow-lg transition border border-[#6F4E37]"
        >
          <BookOpen className="h-8 w-8 text-[#6F4E37]" />
          <div>
            <p className="text-lg font-semibold text-[#3B2F2F]">Cashbook Report</p>
            <p className="text-sm text-gray-500">Daily transactions summary</p>
          </div>
        </Link>

        <Link
          to="/reports/ledger"
          className="flex items-center gap-3 p-4 bg-white shadow-md rounded-lg hover:shadow-lg transition border border-[#6F4E37]"
        >
          <FileText className="h-8 w-8 text-[#6F4E37]" />
          <div>
            <p className="text-lg font-semibold text-[#3B2F2F]">Account Ledger</p>
            <p className="text-sm text-gray-500">View party-wise ledger</p>
          </div>
        </Link>

        {/* <Link
          to="/reports/credit-debit"
          className="flex items-center gap-3 p-4 bg-white shadow-md rounded-lg hover:shadow-lg transition border border-[#6F4E37]"
        >
          <FolderSearch className="h-8 w-8 text-[#6F4E37]" />
          <div>
            <p className="text-lg font-semibold text-[#3B2F2F]">Credit & Debit</p>
            <p className="text-sm text-gray-500">Complete account movements</p>
          </div>
        </Link> */}

      </div>

    </div>
  );
}