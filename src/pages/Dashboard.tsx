import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  FileText,
  FolderSearch,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

export default function Dashboard() {
  const [creditTotal, setCreditTotal] = useState(0);
  const [debitTotal, setDebitTotal] = useState(0);
  const [cashInHand, setCashInHand] = useState(0);

  useEffect(() => {
    // TODO: Replace with Supabase queries
    const dummyCredit = 25000;
    const dummyDebit = 12000;

    setCreditTotal(dummyCredit);
    setDebitTotal(dummyDebit);
    setCashInHand(dummyCredit - dummyDebit);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Cash in hand */}
        <Card className="border-l-4 border-green-500">
          <CardHeader>
            <CardTitle className="text-muted-foreground flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Cash In Hand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              Rs. {cashInHand.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Total Credit */}
        <Card className="border-l-4 border-blue-500">
          <CardHeader>
            <CardTitle className="text-muted-foreground flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-blue-600" />
              Total Credit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              Rs. {creditTotal.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Total Debit */}
        <Card className="border-l-4 border-red-500">
          <CardHeader>
            <CardTitle className="text-muted-foreground flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
              Total Debit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              Rs. {debitTotal.toLocaleString()}
            </p>
          </CardContent>
        </Card>


        
      </div>

      {/* QUICK REPORT LINKS */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Cashbook Report */}
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

          {/* Account Ledger Report */}
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

          {/* Credit & Debit Report */}
          <Link
            to="/reports/credit-debit"
            className="flex items-center gap-3 p-4 bg-white shadow-md rounded-lg hover:shadow-lg transition border border-[#6F4E37]"
          >
            <FolderSearch className="h-8 w-8 text-[#6F4E37]" />
            <div>
              <p className="text-lg font-semibold text-[#3B2F2F]">Credit & Debit</p>
              <p className="text-sm text-gray-500">Complete account movements</p>
            </div>
          </Link>

          {/* Parties Report */}
          <Link
            to="/reports/parties"
            className="flex items-center gap-3 p-4 bg-white shadow-md rounded-lg hover:shadow-lg transition border border-[#6F4E37]"
          >
            <Users className="h-8 w-8 text-[#6F4E37]" />
            <div>
              <p className="text-lg font-semibold text-[#3B2F2F]">Parties Report</p>
              <p className="text-sm text-gray-500">All party accounts summary</p>
            </div>
          </Link>

        </div>

    </div>
  );
}
