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
import { Search, Printer, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

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

  // EXPORT TO EXCEL
  const handleExportExcel = () => {
    // Prepare data for Excel
    const excelData = rows.map((r, i) => ({
      "S.No": i + 1,
      "Date": format(new Date(r.date), "dd-MM-yyyy"),
      "Detail": r.detail,
      "Credit": r.credit ? r.credit.toFixed(2) : "0.00",
      "Debit": r.debit ? r.debit.toFixed(2) : "0.00",
      "Balance": r.balance.toFixed(2)
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger Report");

    // Generate filename
    const filename = `Ledger_${selectedAccount?.account_name}_${format(new Date(fromDate), "dd-MMM-yyyy")}_to_${format(new Date(toDate), "dd-MMM-yyyy")}.xlsx`;

    // Download
    XLSX.writeFile(wb, filename);
  };

  // PRINT FUNCTION
  const handlePrint = () => {
    const win = window.open("", "_blank");

    win.document.write(`
      <html>
      <head>
        <title>Ledger Report - ${selectedAccount?.account_name}</title>
        <style>
          @media print {
            @page { 
              margin: 1cm;
              size: A4;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          
          body { 
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 15px;
          }
          
          .letterhead {
            display: flex;
            align-items: center;
            gap: 15px;
            border-bottom: 3px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          
          .logo-container {
            width: 140px;
            height: 80px;
            border: 2px solid #000;
            border-radius: 8px;
            background: #f8f8f8;
            overflow: hidden;
            flex-shrink: 0;
          }
          
          .logo-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .company-info {
            flex: 1;
          }
          
          .company-name {
            font-size: 20px;
            font-weight: bold;
            margin: 0;
            line-height: 1.2;
          }
          
          .trading-company {
            font-size: 14px;
            color: #666;
            margin: 2px 0;
          }
          
          .contact-info {
            text-align: right;
            font-size: 12px;
            line-height: 1.6;
            flex-shrink: 0;
          }
          
          .report-title {
            text-align: center;
            margin: 20px 0 10px 0;
            padding: 10px 0;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
          }
          
          .report-title h2 {
            margin: 0;
            font-size: 16px;
            font-weight: normal;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 12px;
          }
          
          th, td {
            border: 1px solid #000;
            padding: 6px 8px;
            text-align: left;
          }
          
          th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          
          .text-right {
            text-align: right !important;
          }
          
          .text-center {
            text-align: center !important;
          }
          
          .date-row {
            background-color: #e8e8e8;
            font-weight: bold;
            text-align: center;
          }
          
          tbody tr:nth-child(even) {
            background-color: #f9f9f9;
          }
        </style>
      </head>
      <body>
        <!-- LETTERHEAD -->
        <div class="letterhead">
          <div class="logo-container">
            <img src="/logo.jpeg" alt="Company Logo" />
          </div>
          
          <div class="company-info">
            <div class="company-name">
              HAJI ABDUL HADI &<br />
              HAJI SHER ALI
            </div>
            <div class="trading-company">TRADING COMPANY</div>
          </div>
          
          <div class="contact-info">
            <p>sher_ali333@yahoo.com</p>
            <p>+92-081-2826518</p>
            <p>+92-081-2837919</p>
            <p>+92-081-2835099</p>
          </div>
        </div>

        <!-- REPORT TITLE -->
        <div class="report-title">
          <h2>Mr. ${selectedAccount?.account_name} From: ${format(new Date(fromDate), "dd-MMM-yyyy")} To: ${format(new Date(toDate), "dd-MMM-yyyy")}</h2>
        </div>

        <!-- TABLE -->
        <table>
          <thead>
            <tr>
              <th style="width: 50px;">S.No</th>
              <th style="width: 100px;">Date</th>
              <th>Detail</th>
              <th style="width: 100px;">Credit</th>
              <th style="width: 100px;">Debit</th>
              <th style="width: 100px;">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r, i) => {
              const isDateRow = i === 0 || format(new Date(rows[i - 1].date), "dd-MM-yyyy") !== format(new Date(r.date), "dd-MM-yyyy");
              
              let html = '';
              
              if (isDateRow && i > 0) {
                html += `
                  <tr class="date-row">
                    <td colspan="6" style="text-align: center; font-weight: bold;">
                      ${format(new Date(r.date), "dd-MM-yyyy")}
                    </td>
                  </tr>
                `;
              }
              
              html += `
                <tr>
                  <td style="text-align: center;">${i + 1}</td>
                  <td style="text-align: center;">${format(new Date(r.date), "dd-MM-yyyy")}</td>
                  <td>${r.detail}</td>
                  <td style="text-align: right;">${r.credit ? r.credit.toFixed(2) : "0.00"}</td>
                  <td style="text-align: right;">${r.debit ? r.debit.toFixed(2) : "0.00"}</td>
                  <td style="text-align: right;">${r.balance.toFixed(2)}</td>
                </tr>
              `;
              
              return html;
            }).join('')}
          </tbody>
        </table>
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
              <>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                
                <Button variant="outline" onClick={handleExportExcel} className="bg-green-50 hover:bg-green-100">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Report Display */}
      {rows.length > 0 && (
        <div ref={printRef} className="bg-white p-8 rounded shadow-lg">
          
          {/* LETTERHEAD */}
          <div className="flex items-center gap-4 border-b-4 border-black pb-4 mb-6">
            
            {/* Logo */}
            <div className="w-36 h-20 border-0 border-black rounded-lg overflow-hidden bg-gray-50">
              <img 
                src="/logo.jpeg" 
                alt="Company Logo" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Company Info */}
            <div className="flex-1">
              <h1 className="text-xl font-bold leading-tight">
                HAJI ABDUL HADI &<br />
                HAJI SHER ALI
              </h1>
              <p className="text-sm text-gray-600 mt-1">TRADING COMPANY</p>
            </div>

            {/* Contact Info */}
            <div className="text-right text-xs leading-relaxed">
              <p>sher_ali333@yahoo.com</p>
              <p>+92-081-2826518</p>
              <p>+92-081-2837919</p>
              <p>+92-081-2835099</p>
            </div>

          </div>

          {/* REPORT TITLE */}
          <div className="text-center my-6 py-3 border-t-2 border-b-2 border-black">
            <h2 className="text-base font-normal">
              Mr. {selectedAccount?.account_name} From: {format(new Date(fromDate), "dd-MMM-yyyy")} To: {format(new Date(toDate), "dd-MMM-yyyy")}
            </h2>
          </div>

          {/* TABLE */}
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-3 py-2 text-center w-16">S.No</th>
                <th className="border border-black px-3 py-2 text-center w-32">Date</th>
                <th className="border border-black px-3 py-2 text-center">Detail</th>
                <th className="border border-black px-3 py-2 text-center w-28">Credit</th>
                <th className="border border-black px-3 py-2 text-center w-28">Debit</th>
                <th className="border border-black px-3 py-2 text-center w-32">Balance</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => {
                // Check if this is a date separator row
                const isDateRow = i === 0 || format(new Date(rows[i - 1].date), "dd-MM-yyyy") !== format(new Date(r.date), "dd-MM-yyyy");
                
                return (
                  <>
                    {/* Date Separator Row */}
                    {isDateRow && i > 0 && (
                      <tr className="bg-gray-200">
                        <td colSpan={6} className="border border-black px-3 py-2 text-center font-bold">
                          {format(new Date(r.date), "dd-MM-yyyy")}
                        </td>
                      </tr>
                    )}

                    {/* Data Row */}
                    <tr className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-black px-3 py-2 text-center">{i + 1}</td>
                      <td className="border border-black px-3 py-2 text-center">
                        {format(new Date(r.date), "dd-MM-yyyy")}
                      </td>
                      <td className="border border-black px-3 py-2">{r.detail}</td>
                      <td className="border border-black px-3 py-2 text-right">
                        {r.credit ? r.credit.toFixed(2) : "0.00"}
                      </td>
                      <td className="border border-black px-3 py-2 text-right">
                        {r.debit ? r.debit.toFixed(2) : "0.00"}
                      </td>
                      <td className="border border-black px-3 py-2 text-right">
                        {r.balance.toFixed(2)}
                      </td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>

        </div>
      )}

    </div>
  );
}