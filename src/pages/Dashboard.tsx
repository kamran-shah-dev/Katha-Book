import { useEffect, useState } from "react";
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
    </div>
  );
}
