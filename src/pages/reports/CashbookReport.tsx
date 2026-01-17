import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { db } from "@/firebaseConfig";
import "@/pages/reports/reports.css";
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

export default function CashbookReport() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [rows, setRows] = useState([]);

  const [fromDate, setFromDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd")
  );
  const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const printRef = useRef<HTMLDivElement>(null);

  // Load Accounts
  useEffect(() => {
    const loadAccounts = async () => {
      const snap = await getDocs(collection(db, "accounts"));
      setAccounts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    loadAccounts();
  }, []);

  // Generate Report
  const generateReport = async () => {
    if (!selectedAccount) return alert("Select an account!");

    const q = query(
      collection(db, "cashbook_entries"),
      where("account_id", "==", selectedAccount),
      where("date", ">=", new Date(fromDate)),
      where("date", "<=", new Date(toDate)),
      orderBy("date", "asc"),
      orderBy("created_at", "asc")
    );

    const snap = await getDocs(q);

    const list = snap.docs.map((doc) => {
      const entry = doc.data();

      return {
        date: entry.date.toDate(),
        detail: entry.payment_details || "-",
        credit: entry.type === "CREDIT" ? entry.amount : 0,
        debit: entry.type === "DEBIT" ? entry.amount : 0
      };
    });

    setRows(list);
  };

  const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0);
  const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0);
  const balance = totalCredit - totalDebit;

  // PRINT BEAUTIFUL TEMPLATE
  const handlePrint = () => {
    if (!printRef.current) return;

    const win = window.open("", "_blank");

    win.document.write(`
      <html>
      <head>
        <title>Cashbook Report</title>
        <style>

  body {
    font-family: "Segoe UI", Arial, sans-serif;
    padding: 40px;
    color: #222;
  }

  .header-title {
    font-size: 24px;
    font-weight: 700;
    border-bottom: 3px solid #3f51b5;
    display: inline-block;
    padding-bottom: 4px;
    margin-bottom: 5px;
  }

  .sub-title {
    font-size: 18px;
    margin-top: 3px;
    font-weight: 600;
  }

  .period {
    text-align: right;
    font-size: 13px;
    color: #666;
    margin-bottom: 15px;
  }

  table.report-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    font-size: 13px;
  }

  table.report-table th {
    background: #eef2ff;
    padding: 10px 8px;
    border: 1px solid #cdd4e1;
    font-weight: 600;
  }

  table.report-table td {
    border: 1px solid #e3e6eb;
    padding: 8px;
    vertical-align: top;
  }

  .right {
    text-align: right;
    padding-right: 10px;
  }

  .footer-box {
    margin-top: 25px;
    padding: 12px;
    border: 1px solid #d0d7e2;
    width: 260px;
    float: right;
    background: #fafbff;
    border-radius: 6px;
  }

  .footer-box div {
    margin-bottom: 5px;
    font-size: 14px;
  }

</style>

      </head>
      <body>

        <h1>Cashbook Report</h1>
        <div class="sub">${accounts.find(a => a.id === selectedAccount)?.account_name}</div>
        <div class="period">${format(new Date(fromDate), "dd MMM yyyy")} - ${format(new Date(toDate), "dd MMM yyyy")}</div>

        ${printRef.current.innerHTML}

        <div class="footer">
          Total Credit: Rs. ${totalCredit.toLocaleString()} <br/>
          Total Debit: Rs. ${totalDebit.toLocaleString()} <br/>
          Cash In Hand: Rs. ${balance.toLocaleString()}
        </div>

      </body>
      </html>
    `);

    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Cashbook Report</h1>

      <Card>
        <CardContent className="pt-6">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* Account Select */}
            <div>
              <Label>Account</Label>
              <select
                className="h-10 border rounded px-2 w-full"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                <option value="">Select Account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filters */}
            <div>
              <Label>From</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div>
              <Label>To</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            {/* Generate + Print */}
            <div className="flex items-end gap-2">
              <Button onClick={generateReport}>
                <Search className="w-4 h-4 mr-2" /> Generate
              </Button>

              {rows.length > 0 && (
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
              )}
            </div>

          </div>
        </CardContent>
      </Card>

      {/* TABLE PREVIEW */}
      {rows.length > 0 && (
        <div className="report-container" ref={printRef}>
          
          <div className="report-header">Cashbook Report</div>
          <div className="report-subtitle">
            {accounts.find((a) => a.id === selectedAccount)?.account_name}
          </div>
          <div className="report-period">
            {format(new Date(fromDate), "dd MMM yyyy")} - {format(new Date(toDate), "dd MMM yyyy")}
          </div>

          <table className="report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction Details</th>
                <th className="right">Credit</th>
                <th className="right">Debit</th>
                <th className="right">Balance</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{format(r.date, "dd MMM yyyy")}</td>
                  <td>{r.detail}</td>
                  <td className="right">{r.credit ? "Rs. " + r.credit.toLocaleString() : ""}</td>
                  <td className="right">{r.debit ? "Rs. " + r.debit.toLocaleString() : ""}</td>
                  <td className="right">
                    Rs. {(rows.slice(0, i + 1).reduce((sum, x) => sum + x.credit - x.debit, 0)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="report-summary">
            Total Credit: Rs. {totalCredit.toLocaleString()} <br />
            Total Debit: Rs. {totalDebit.toLocaleString()} <br />
            Cash In Hand: Rs. {balance.toLocaleString()}
          </div>

        </div>
      )}


    </div>
  );
}
