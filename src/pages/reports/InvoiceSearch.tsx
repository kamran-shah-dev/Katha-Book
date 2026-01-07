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

export default function InvoiceSearch() {
  const [fromDate, setFromDate] = useState(format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('invoices')
        .select('*, accounts(account_name)')
        .eq('is_deleted', false)
        .gte('invoice_date', fromDate)
        .lte('invoice_date', toDate)
        .order('invoice_date', { ascending: false });

      const { data } = await query;

      let filtered = data || [];
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(inv => 
          inv.invoice_no.toString().includes(term) ||
          inv.gd_no?.toLowerCase().includes(term) ||
          inv.accounts?.account_name?.toLowerCase().includes(term)
        );
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
      <html><head><title>Invoice Search Report</title>
      <style>body{font-family:Arial;padding:20px}h1{text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}th{background:#f5f5f5}.text-right{text-align:right}</style>
      </head><body><h1>Invoice Search Report</h1>${printContent.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const totalAmount = rows.reduce((sum, r) => sum + Number(r.total_amount || 0), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Invoice Search</h1>
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-1"><Label>From Date</Label><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></div>
            <div className="space-y-1"><Label>To Date</Label><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></div>
            <div className="space-y-1"><Label>Search (Inv#, GD#, Account)</Label><Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." /></div>
            <div className="flex items-end gap-2 md:col-span-2">
              <Button onClick={generateReport} disabled={loading}><Search className="h-4 w-4 mr-1" /> Search</Button>
              {rows.length > 0 && <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>}
            </div>
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-lg">Found {rows.length} Invoices</CardTitle></CardHeader>
          <CardContent className="p-0" ref={printRef}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inv#</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>GD#</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.invoice_no}</TableCell>
                    <TableCell>{format(new Date(row.invoice_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="font-medium">{row.accounts?.account_name || '-'}</TableCell>
                    <TableCell>{row.gd_no || '-'}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{row.vehicle_numbers || '-'}</TableCell>
                    <TableCell className="text-right font-medium">{Number(row.total_amount).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted font-bold">
                  <TableCell colSpan={5}>Total</TableCell>
                  <TableCell className="text-right">{totalAmount.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
