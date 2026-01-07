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

export default function VehicleWiseReport() {
  const [fromDate, setFromDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [vehicleNo, setVehicleNo] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('goods_received')
        .select('*, accounts(account_name), products(name)')
        .eq('is_deleted', false)
        .gte('entry_date', fromDate)
        .lte('entry_date', toDate)
        .order('vehicle_no')
        .order('entry_date');

      const { data } = await query;

      let filtered = data || [];
      if (vehicleNo) {
        filtered = filtered.filter(r => r.vehicle_no?.toLowerCase().includes(vehicleNo.toLowerCase()));
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
      <html><head><title>Vehicle Wise Report</title>
      <style>body{font-family:Arial;padding:20px;font-size:12px}h1{text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px}th{background:#f5f5f5}.text-right{text-align:right}</style>
      </head><body><h1>Vehicle Wise Report</h1>${printContent.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Group by vehicle
  const groupedByVehicle = rows.reduce((acc, row) => {
    const vehicle = row.vehicle_no || 'No Vehicle';
    if (!acc[vehicle]) acc[vehicle] = [];
    acc[vehicle].push(row);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Vehicle Wise Report</h1>
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-1"><Label>From Date</Label><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></div>
            <div className="space-y-1"><Label>To Date</Label><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></div>
            <div className="space-y-1"><Label>Vehicle No (optional)</Label><Input value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} placeholder="Filter by vehicle" /></div>
            <div className="flex items-end gap-2 md:col-span-2">
              <Button onClick={generateReport} disabled={loading}><Search className="h-4 w-4 mr-1" /> Generate</Button>
              {rows.length > 0 && <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>}
            </div>
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <div ref={printRef} className="space-y-4">
          {Object.entries(groupedByVehicle).map(([vehicle, entries]: [string, any[]]) => (
            <Card key={vehicle}>
              <CardHeader className="py-3 bg-muted">
                <CardTitle className="text-lg">Vehicle: {vehicle} ({entries.length} entries)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>GD#</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell>{format(new Date(row.entry_date), 'dd/MM/yy')}</TableCell>
                        <TableCell>{row.accounts?.account_name || '-'}</TableCell>
                        <TableCell>{row.gd_no || '-'}</TableCell>
                        <TableCell>{row.products?.name || '-'}</TableCell>
                        <TableCell className="text-right">{Number(row.net_weight).toFixed(2)}</TableCell>
                        <TableCell className="text-right">{Number(row.total_amount).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={4}>Subtotal</TableCell>
                      <TableCell className="text-right">{entries.reduce((s: number, r: any) => s + Number(r.net_weight), 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{entries.reduce((s: number, r: any) => s + Number(r.total_amount), 0).toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
