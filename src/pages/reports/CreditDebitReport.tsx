import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Printer, Search } from 'lucide-react';

export default function CreditDebitReport() {
  const [fromDate, setFromDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('ledger_entries')
        .select('*, accounts(account_name)')
        .eq('is_deleted', false)
        .gte('entry_date', fromDate)
        .lte('entry_date', toDate)
        .order('entry_date', { ascending: false });

      let filtered = data || [];
      if (filterType === 'credit') {
        filtered = filtered.filter(r => Number(r.credit_amount) > 0);
      } else if (filterType === 'debit') {
        filtered = filtered.filter(r => Number(r.debit_amount) > 0);
      }

      setRows(filtered);
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
      <html><head><title>Credit/Debit Report</title>
      <style>body{font-family:Arial;padding:20px;font-size:12px}h1{text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px}th{background:#f5f5f5}.text-right{text-align:right}</style>
      </head><body><h1>Credit/Debit Report</h1>${printContent.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const totalCredit = rows.reduce((sum, r) => sum + Number(r.credit_amount || 0), 0);
  const totalDebit = rows.reduce((sum, r) => sum + Number(r.debit_amount || 0), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Credit / Debit Report</h1>
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-1"><Label>From Date</Label><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></div>
            <div className="space-y-1"><Label>To Date</Label><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></div>
            <div className="space-y-1">
              <Label>Filter</Label>
              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="credit">Credits Only</SelectItem>
                  <SelectItem value="debit">Debits Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 md:col-span-2">
              <Button onClick={generateReport} disabled={loading}><Search className="h-4 w-4 mr-1" /> Generate</Button>
              {rows.length > 0 && <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>}
            </div>
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-lg">Transactions ({rows.length})</CardTitle></CardHeader>
          <CardContent className="p-0" ref={printRef}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{format(new Date(row.entry_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="font-medium">{row.accounts?.account_name || '-'}</TableCell>
                    <TableCell>{row.detail || '-'}</TableCell>
                    <TableCell>{row.reference_type || '-'}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {Number(row.credit_amount) > 0 ? Number(row.credit_amount).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {Number(row.debit_amount) > 0 ? Number(row.debit_amount).toLocaleString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted font-bold">
                  <TableCell colSpan={4}>Totals</TableCell>
                  <TableCell className="text-right text-green-600">{totalCredit.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-red-600">{totalDebit.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
