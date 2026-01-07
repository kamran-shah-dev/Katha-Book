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

export default function GDSearch() {
  const [gdNo, setGdNo] = useState('');
  const [goodsResults, setGoodsResults] = useState<any[]>([]);
  const [exportResults, setExportResults] = useState<any[]>([]);
  const [invoiceResults, setInvoiceResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleSearch = async () => {
    if (!gdNo.trim()) return;
    setLoading(true);

    try {
      const [goodsRes, exportRes, invoiceRes] = await Promise.all([
        supabase.from('goods_received').select('*, accounts(account_name), products(name)').eq('is_deleted', false).ilike('gd_no', `%${gdNo}%`),
        supabase.from('export_entries').select('*, accounts(account_name), products(name)').eq('is_deleted', false).ilike('gd_no', `%${gdNo}%`),
        supabase.from('invoices').select('*, accounts(account_name)').eq('is_deleted', false).ilike('gd_no', `%${gdNo}%`),
      ]);

      setGoodsResults(goodsRes.data || []);
      setExportResults(exportRes.data || []);
      setInvoiceResults(invoiceRes.data || []);
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
      <html><head><title>GD No Search - ${gdNo}</title>
      <style>body{font-family:Arial;padding:20px}h1,h2{text-align:center}table{width:100%;border-collapse:collapse;margin-bottom:20px}th,td{border:1px solid #ddd;padding:6px}th{background:#f5f5f5}</style>
      </head><body><h1>GD No Search Results: ${gdNo}</h1>${printContent.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const hasResults = goodsResults.length > 0 || exportResults.length > 0 || invoiceResults.length > 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">GD No Search</h1>
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-1">
              <Label>GD Number</Label>
              <Input 
                value={gdNo} 
                onChange={(e) => setGdNo(e.target.value)} 
                placeholder="Enter GD number to search"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !gdNo.trim()}>
              <Search className="h-4 w-4 mr-1" /> {loading ? 'Searching...' : 'Search'}
            </Button>
            {hasResults && <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>}
          </div>
        </CardContent>
      </Card>

      <div ref={printRef} className="space-y-4">
        {goodsResults.length > 0 && (
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-lg">Goods Received ({goodsResults.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sr#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>GD#</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goodsResults.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.serial_no}</TableCell>
                      <TableCell>{format(new Date(row.entry_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{row.accounts?.account_name || '-'}</TableCell>
                      <TableCell className="font-medium">{row.gd_no}</TableCell>
                      <TableCell>{row.products?.name || '-'}</TableCell>
                      <TableCell className="text-right">{Number(row.total_amount).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {exportResults.length > 0 && (
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-lg">Export Entries ({exportResults.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exp#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>GD#</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exportResults.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.export_no}</TableCell>
                      <TableCell>{format(new Date(row.entry_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{row.accounts?.account_name || '-'}</TableCell>
                      <TableCell className="font-medium">{row.gd_no}</TableCell>
                      <TableCell>{row.products?.name || '-'}</TableCell>
                      <TableCell className="text-right">{Number(row.amount).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {invoiceResults.length > 0 && (
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-lg">Invoices ({invoiceResults.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inv#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>GD#</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceResults.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.invoice_no}</TableCell>
                      <TableCell>{format(new Date(row.invoice_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{row.accounts?.account_name || '-'}</TableCell>
                      <TableCell className="font-medium">{row.gd_no}</TableCell>
                      <TableCell className="text-right">{Number(row.total_amount).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {!loading && gdNo && !hasResults && (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No results found for GD# "{gdNo}"</CardContent></Card>
        )}
      </div>
    </div>
  );
}
