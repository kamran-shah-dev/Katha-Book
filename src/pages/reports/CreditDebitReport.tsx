import { useState, useRef } from "react";
import { format } from "date-fns";
import { db } from "@/firebaseConfig";

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";

import "@/pages/reports/reports.css"; // <-- important file for styling

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Printer } from "lucide-react";

export default function CreditDebitReport() {
  const [rows, setRows] = useState([]);
  const [filterType, setFilterType] = useState("all");

  const [fromDate, setFromDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd")
  );
  const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const printRef = useRef<HTMLDivElement>(null);

  // Generate Report
  const generateReport = async () => {
    const q = query(
      collection(db, "cashbook_entries"),
      where("date", ">=", new Date(fromDate)),
      where("date", "<=", new Date(toDate)),
      orderBy("date", "asc"),
      orderBy("created_at", "asc")
    );

    const snap = await getDocs(q);

    let entries = snap.docs.map((doc) => {
      const e = doc.data();
      return {
        id: doc.id,
        date: e.date.toDate(),
        account_name: e.account_name || "",
        detail: e.payment_details || "",
        type: e.type,
        credit: e.type === "CREDIT" ? e.amount : 0,
        debit: e.type === "DEBIT" ? e.amount : 0,
      };
    });

    // Apply credit/debit filter
    if (filterType === "credit") entries = entries.filter((e) => e.credit > 0);
    if (filterType === "debit") entries = entries.filter((e) => e.debit > 0);

    setRows(entries);
  };

  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);

  // Print formatted page
  const handlePrint = () => {
    if (!printRef.current) return;

    const win = window.open("", "_blank");

    win.document.write(`
      <html>
      <head>
        <title>Credit / Debit Report</title>
        <style>
          body { font-family: Arial; padding: 30px; }
          h1 { font-size: 26px; font-weight: bold; margin-bottom: 5px; }
          .period { color: #666; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; font-size: 14px; }
          th { background: #f5f5f5; }
          tr:nth-child(even) { background: #fafafa; }
          .right { text-align: right; }
          .footer { margin-top: 20px; font-weight: bold; }
        </style>
      </head>
      <body>

        <h1>Credit / Debit Report</h1>
        <div class="period">${format(new Date(fromDate), "dd MMM yyyy")} - ${format(
          new Date(toDate),
          "dd MMM yyyy"
        )}</div>

        ${printRef.current.innerHTML}

        <div class="footer">
          Total Credit: Rs. ${totalCredit.toLocaleString()} <br/>
          Total Debit: Rs. ${totalDebit.toLocaleString()}
        </div>

      </body>
      </html>
    `);

    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Credit / Debit Report</h1>

      {/* FILTER SECTION */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-5 gap-4">

            {/* Date From */}
            <div>
              <Label>From</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            {/* Date To */}
            <div>
              <Label>To</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            {/* Type Filter */}
            <div>
              <Label>Filter</Label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border h-10 rounded px-2 w-full"
              >
                <option value="all">All</option>
                <option value="credit">Credit Only</option>
                <option value="debit">Debit Only</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex items-end gap-2 md:col-span-2">
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

      {/* TABLE DISPLAY */}
      {rows.length > 0 && (
        <div ref={printRef} className="report-container">

          <table className="report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Account</th>
                <th>Details</th>
                <th>Type</th>
                <th className="right">Credit</th>
                <th className="right">Debit</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{format(r.date, "dd MMM yyyy")}</td>
                  <td>{r.account_name}</td>
                  <td>{r.detail}</td>
                  <td>{r.type}</td>
                  <td className="right">{r.credit ? "Rs. " + r.credit.toLocaleString() : ""}</td>
                  <td className="right">{r.debit ? "Rs. " + r.debit.toLocaleString() : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="report-summary">
            <strong>Total Credit:</strong> Rs. {totalCredit.toLocaleString()} <br />
            <strong>Total Debit:</strong> Rs. {totalDebit.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
