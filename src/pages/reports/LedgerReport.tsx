import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { db } from "@/firebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Printer } from "lucide-react";

export default function LedgerReport() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [fromDate, setFromDate] = useState(
    format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd")
  );
  const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [rows, setRows] = useState([]);
  const printRef = useRef<HTMLDivElement>(null);

  // Load accounts
  useEffect(() => {
    const loadAccounts = async () => {
      const snap = await getDocs(collection(db, "accounts"));
      setAccounts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    loadAccounts();
  }, []);

  // Generate Ledger
  const generateReport = async () => {
    if (!selectedAccountId) return alert("Select account!");

    const acc = accounts.find((a) => a.id === selectedAccountId);
    setSelectedAccount(acc);

    const q = query(
      collection(db, "cashbook_entries"),
      where("account_id", "==", selectedAccountId),
      where("date", ">=", new Date(fromDate)),
      where("date", "<=", new Date(toDate)),
      orderBy("date", "asc"),
      orderBy("created_at", "asc")
    );

    const snap = await getDocs(q);

    const list = [];
    let runningBalance = Number(acc.opening_balance || 0);

    // Add Opening Balance Row
    list.push({
      date: fromDate,
      detail: "Opening Balance",
      credit: runningBalance > 0 ? runningBalance : 0,
      debit: runningBalance < 0 ? Math.abs(runningBalance) : 0,
      balance: runningBalance
    });

    snap.docs.forEach((doc) => {
      const e = doc.data();

      const credit = e.type === "CREDIT" ? Number(e.amount) : 0;
      const debit = e.type === "DEBIT" ? Number(e.amount) : 0;

      runningBalance += credit - debit;

      list.push({
        date: e.date.toDate(),
        detail: e.payment_details || "-",
        credit,
        debit,
        balance: runningBalance
      });
    });

    setRows(list);
  };

  // PRINT FUNCTION
  const handlePrint = () => {
    const win = window.open("", "_blank");

    win.document.write(`
      <html>
      <head>
        <title>Ledger Report</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          h1 { text-align: center; }
          .center { text-align:center; margin-bottom:20px; color:#777; }
          table { width: 100%; border-collapse: collapse; font-size:13px; }
          th, td { border:1px solid #ccc; padding:8px; }
          th { background:#f2f2f2; }
          .credit { color:green; }
          .debit { color:red; }
        </style>
      </head>
      <body>
        <h1>Ledger Report</h1>
        <div class="center">
          ${selectedAccount?.account_name}<br>
          ${format(new Date(fromDate), "dd MMM yyyy")} -
          ${format(new Date(toDate), "dd MMM yyyy")}
        </div>
        ${printRef.current.innerHTML}
      </body>
      </html>
    `);

    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-4">
      
      <h1 className="text-2xl font-bold">Ledger Report</h1>

      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">

          {/* Account Selection */}
          <div>
            <Label>Account</Label>
            <select
              className="h-10 border rounded px-2 w-full"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              <option value="">Select Account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>From Date</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>

          <div>
            <Label>To Date</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={generateReport}>
              <Search className="w-4 h-4 mr-2" />
              Generate
            </Button>

            {rows.length > 0 && (
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4" />
              </Button>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Report Table */}
      {rows.length > 0 && (
        <div ref={printRef}>
          <table className="w-full border-collapse shadow-sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Details</th>
                <th style={{ textAlign: "right" }}>Credit</th>
                <th style={{ textAlign: "right" }}>Debit</th>
                <th style={{ textAlign: "right" }}>Balance</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{format(new Date(r.date), "dd MMM yyyy")}</td>
                  <td>{r.detail}</td>
                  <td style={{ textAlign: "right", color: "green" }}>
                    {r.credit ? "Rs. " + r.credit.toLocaleString() : ""}
                  </td>
                  <td style={{ textAlign: "right", color: "red" }}>
                    {r.debit ? "Rs. " + r.debit.toLocaleString() : ""}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {r.balance >= 0 ? "Rs. " + r.balance.toLocaleString() : "-Rs. " + Math.abs(r.balance).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
