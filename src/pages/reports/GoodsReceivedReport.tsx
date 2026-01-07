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

export default function GoodsReceivedReport() {
  const [fromDate, setFromDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('goods_received')
        .select('*, accounts(account_name), products(name)')
        .eq('is_deleted', false)
        .gte('entry_date', fromDate)
        .lte('entry_date', toDate)
        .order('entry_date', { ascending: false });

      setRows(data || []);
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
      <html><head><title>Goods Received Report</title>
      <style>body{font-family:Arial;padding:20px;font-size:11px}h1{text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:4px}th{background:#f5f5f5}.text-right{text-align:right}</style>
      </head><body><h1>Goods Received Report</h1>${printContent.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const totalPortExpenses = rows.reduce((sum, r) => sum + Number(r.port_expenses || 0), 0);
  const totalAmount = rows.reduce((sum, r) => sum + Number(r.total_amount || 0), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Goods Received Report</h1>
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1"><Label>From Date</Label><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></div>
            <div className="space-y-1"><Label>To Date</Label><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></div>
            <div className="flex items-end gap-2 md:col-span-2">
              <Button onClick={generateReport} disabled={loading}><Search className="h-4 w-4 mr-1" /> Generate</Button>
              {rows.length > 0 && <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>}
            </div>
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-lg">Goods Received ({rows.length} records)</CardTitle></CardHeader>
          <CardContent className="p-0" ref={printRef}>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sr#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>GD#</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead className="text-right">Port Exp</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.serial_no}</TableCell>
                      <TableCell>{format(new Date(row.entry_date), 'dd/MM/yy')}</TableCell>
                      <TableCell>{row.accounts?.account_name || '-'}</TableCell>
                      <TableCell>{row.gd_no || '-'}</TableCell>
                      <TableCell>{row.products?.name || '-'}</TableCell>
                      <TableCell className="text-right">{Number(row.net_weight).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{Number(row.port_expenses).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">{Number(row.total_amount).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-bold">
                    <TableCell colSpan={6}>Totals</TableCell>
                    <TableCell className="text-right">{totalPortExpenses.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{totalAmount.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
