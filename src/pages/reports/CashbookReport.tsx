import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Printer, Search } from 'lucide-react';

interface CashbookRow {
  date: string;
  account_name: string;
  detail: string;
  credit: number;
  debit: number;
}

export default function CashbookReport() {
  const [fromDate, setFromDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [rows, setRows] = useState<CashbookRow[]>([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('cashbook_entries')
        .select('*, accounts(account_name)')
        .eq('is_deleted', false)
        .gte('entry_date', fromDate)
        .lte('entry_date', toDate)
        .order('entry_date')
        .order('created_at');

      const reportRows: CashbookRow[] = (data || []).map(entry => ({
        date: entry.entry_date,
        account_name: entry.accounts?.account_name || '-',
        detail: entry.payment_detail || '-',
        credit: entry.pay_status === 'CREDIT' ? Number(entry.amount) : 0,
        debit: entry.pay_status === 'DEBIT' ? Number(entry.amount) : 0,
      }));

      setRows(reportRows);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Cashbook Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
            h1 { text-align: center; }
            .period { text-align: center; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 6px; }
            th { background: #f5f5f5; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <h1>Cashbook Report</h1>
          <p class="period">${format(new Date(fromDate), 'dd/MM/yyyy')} to ${format(new Date(toDate), 'dd/MM/yyyy')}</p>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0);
  const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Cashbook Report</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <Label>From Date</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>To Date</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="flex items-end gap-2 md:col-span-2">
              <Button onClick={generateReport} disabled={loading}>
                <Search className="h-4 w-4 mr-1" /> {loading ? 'Loading...' : 'Generate'}
              </Button>
              {rows.length > 0 && (
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-1" /> Print
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-lg">Cashbook Entries</CardTitle></CardHeader>
          <CardContent className="p-0" ref={printRef}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{format(new Date(row.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="font-medium">{row.account_name}</TableCell>
                    <TableCell>{row.detail}</TableCell>
                    <TableCell className="text-right text-green-600">{row.credit > 0 ? row.credit.toLocaleString() : '-'}</TableCell>
                    <TableCell className="text-right text-red-600">{row.debit > 0 ? row.debit.toLocaleString() : '-'}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted font-bold">
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right text-green-600">{totalCredit.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-red-600">{totalDebit.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow className="bg-primary/10 font-bold">
                  <TableCell colSpan={3}>Net Cash Flow</TableCell>
                  <TableCell colSpan={2} className={`text-right ${totalCredit - totalDebit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Rs. {Math.abs(totalCredit - totalDebit).toLocaleString()} {totalCredit - totalDebit >= 0 ? '(In)' : '(Out)'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
