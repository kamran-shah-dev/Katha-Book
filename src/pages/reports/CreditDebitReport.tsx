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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Printer, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

type CreditDebitExcelRow = {
  "S.No": number | "";
  "Date": string;
  "Account": string;
  "Detail": string;
  "Type": string;
  "Credit": string;
  "Debit": string;
};

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

  // EXPORT TO EXCEL
  const handleExportExcel = () => {
    const excelData: CreditDebitExcelRow[] = rows.map((r, i) => ({
      "S.No": i + 1,
      "Date": format(new Date(r.date), "dd-MM-yyyy"),
      "Account": r.account_name,
      "Detail": r.detail,
      "Type": r.type,
      "Credit": r.credit ? r.credit.toFixed(2) : "0.00",
      "Debit": r.debit ? r.debit.toFixed(2) : "0.00"
    }));

    // Add summary rows
    excelData.push({
      "S.No": "",
      "Date": "",
      "Account": "",
      "Detail": "Total Credit",
      "Type": "",
      "Credit": totalCredit.toFixed(2),
      "Debit": ""
    });
    excelData.push({
      "S.No": "",
      "Date": "",
      "Account": "",
      "Detail": "Total Debit",
      "Type": "",
      "Credit": "",
      "Debit": totalDebit.toFixed(2)
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Credit Debit Report");

    const filename = `CreditDebit_${format(new Date(fromDate), "dd-MMM-yyyy")}_to_${format(new Date(toDate), "dd-MMM-yyyy")}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // PRINT FUNCTION
  const handlePrint = () => {
    const win = window.open("", "_blank");

    win.document.write(`
      <html>
      <head>
        <title>Credit / Debit Report</title>
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
            border-radius: 8px;
            background: #f8f8f8;
            overflow: hidden;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .logo-container img {
            width: 100%;
            height: 100%;
            object-fit: contain;
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

          .summary-box {
            margin-top: 20px;
            padding: 15px;
            border: 2px solid #000;
            background: #f5f5f5;
            width: 300px;
            float: right;
          }

          .summary-box div {
            margin-bottom: 8px;
            font-size: 13px;
          }

          .summary-box strong {
            display: inline-block;
            width: 150px;
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
          <h2>Credit / Debit Report From: ${format(new Date(fromDate), "dd-MMM-yyyy")} To: ${format(new Date(toDate), "dd-MMM-yyyy")}</h2>
        </div>

        <!-- TABLE -->
        <table>
          <thead>
            <tr>
              <th style="width: 50px;">S.No</th>
              <th style="width: 100px;">Date</th>
              <th style="width: 150px;">Account</th>
              <th>Detail</th>
              <th style="width: 80px;">Type</th>
              <th style="width: 100px;">Credit</th>
              <th style="width: 100px;">Debit</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r, i) => {
              const isDateRow = i === 0 || format(new Date(rows[i - 1].date), "dd-MM-yyyy") !== format(new Date(r.date), "dd-MM-yyyy");
              
              let html = '';
              
              if (isDateRow && i > 0) {
                html += `
                  <tr class="date-row">
                    <td colspan="7" style="text-align: center; font-weight: bold;">
                      ${format(new Date(r.date), "dd-MM-yyyy")}
                    </td>
                  </tr>
                `;
              }
              
              html += `
                <tr>
                  <td style="text-align: center;">${i + 1}</td>
                  <td style="text-align: center;">${format(new Date(r.date), "dd-MM-yyyy")}</td>
                  <td>${r.account_name}</td>
                  <td>${r.detail}</td>
                  <td style="text-align: center;">${r.type}</td>
                  <td style="text-align: right;">${r.credit ? r.credit.toFixed(2) : "0.00"}</td>
                  <td style="text-align: right;">${r.debit ? r.debit.toFixed(2) : "0.00"}</td>
                </tr>
              `;
              
              return html;
            }).join('')}
          </tbody>
        </table>

        <!-- SUMMARY BOX -->
        <div class="summary-box">
          <div><strong>Total Credit:</strong> Rs. ${totalCredit.toLocaleString()}</div>
          <div><strong>Total Debit:</strong> Rs. ${totalDebit.toLocaleString()}</div>
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
          </div>
        </CardContent>
      </Card>

      {/* REPORT DISPLAY */}
      {rows.length > 0 && (
        <div ref={printRef} className="bg-white p-8 rounded shadow-lg">
          
          {/* LETTERHEAD */}
          <div className="flex items-center gap-4 border-b-4 border-black pb-4 mb-6">
            
            {/* Logo */}
            <div className="w-36 h-20 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
              <img 
                src="/logo.jpeg"
                alt="Company Logo"
                className="max-w-full max-h-full object-contain"
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
            <div className="text-right text-lg leading-relaxed">
              <p>sher_ali333@yahoo.com</p>
              <p>+92-081-2826518</p>
              <p>+92-081-2837919</p>
              <p>+92-081-2835099</p>
            </div>

          </div>

          {/* REPORT TITLE */}
          <div className="text-center my-6 py-3 border-t-2 border-b-2 border-black">
            <h2 className="text-base font-normal">
              Credit / Debit Report From: {format(new Date(fromDate), "dd-MMM-yyyy")} To: {format(new Date(toDate), "dd-MMM-yyyy")}
            </h2>
          </div>

          {/* TABLE */}
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-3 py-2 text-center w-16">S.No</th>
                <th className="border border-black px-3 py-2 text-center w-32">Date</th>
                <th className="border border-black px-3 py-2 text-center w-40">Account</th>
                <th className="border border-black px-3 py-2 text-center">Detail</th>
                <th className="border border-black px-3 py-2 text-center w-24">Type</th>
                <th className="border border-black px-3 py-2 text-center w-28">Credit</th>
                <th className="border border-black px-3 py-2 text-center w-28">Debit</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => {
                const isDateRow = i === 0 || format(new Date(rows[i - 1].date), "dd-MM-yyyy") !== format(new Date(r.date), "dd-MM-yyyy");
                
                return (
                  <>
                    {/* Date Separator Row */}
                    {isDateRow && i > 0 && (
                      <tr className="bg-gray-200">
                        <td colSpan={7} className="border border-black px-3 py-2 text-center font-bold">
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
                      <td className="border border-black px-3 py-2">{r.account_name}</td>
                      <td className="border border-black px-3 py-2">{r.detail}</td>
                      <td className="border border-black px-3 py-2 text-center">{r.type}</td>
                      <td className="border border-black px-3 py-2 text-right">
                        {r.credit ? r.credit.toFixed(2) : "0.00"}
                      </td>
                      <td className="border border-black px-3 py-2 text-right">
                        {r.debit ? r.debit.toFixed(2) : "0.00"}
                      </td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>

          {/* SUMMARY BOX */}
          <div className="mt-6 ml-auto p-4 border-2 border-black bg-gray-50 w-80">
            <div className="flex justify-between mb-2">
              <strong>Total Credit:</strong>
              <span>Rs. {totalCredit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <strong>Total Debit:</strong>
              <span>Rs. {totalDebit.toLocaleString()}</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}