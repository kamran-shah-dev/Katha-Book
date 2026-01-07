import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Printer, RefreshCw } from 'lucide-react';

interface SubHeadBalance {
  subHead: string;
  label: string;
  credit: number;
  debit: number;
}

const subHeadLabels: Record<string, string> = {
  'BANKS': 'Banks',
  'DOLLAR_LEDGERS': 'Dollar Ledgers',
  'EXPORT_PARTIES': 'Export Parties',
  'IMPORT_PARTIES': 'Import Parties',
  'NLC_TAFTAN_EXPENSE_LEDGERS': 'NLC / Taftan Expense Ledgers',
  'PERSONALS': 'Personals',
};

export default function SubHeadBalanceReport() {
  const [balances, setBalances] = useState<SubHeadBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const { data: accounts } = await supabase.from('accounts').select('*').eq('is_active', true);
      if (!accounts) return;

      const subHeadTotals: Record<string, { credit: number; debit: number }> = {};
      Object.keys(subHeadLabels).forEach(key => {
        subHeadTotals[key] = { credit: 0, debit: 0 };
      });

      for (const account of accounts) {
        let balance = account.balance_status === 'CREDIT' 
          ? Number(account.opening_balance) 
          : -Number(account.opening_balance);

        const { data: entries } = await supabase
          .from('ledger_entries')
          .select('credit_amount, debit_amount')
          .eq('account_id', account.id)
          .eq('is_deleted', false);

        if (entries) {
          entries.forEach(entry => {
            balance += Number(entry.credit_amount) - Number(entry.debit_amount);
          });
        }

        if (balance > 0) {
          subHeadTotals[account.sub_head].credit += balance;
        } else {
          subHeadTotals[account.sub_head].debit += Math.abs(balance);
        }
      }

      const results: SubHeadBalance[] = Object.entries(subHeadTotals)
        .filter(([_, totals]) => totals.credit > 0 || totals.debit > 0)
        .map(([subHead, totals]) => ({
          subHead,
          label: subHeadLabels[subHead] || subHead,
          credit: totals.credit,
          debit: totals.debit,
        }));

      setBalances(results);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Sub Head Balance Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background: #f5f5f5; text-align: left; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <h1>Account Sub Head Balance Report</h1>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const totalCredit = balances.reduce((sum, b) => sum + b.credit, 0);
  const totalDebit = balances.reduce((sum, b) => sum + b.debit, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sub Head Balance Report</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchBalances}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
          <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-lg">Balance by Sub Head</CardTitle></CardHeader>
        <CardContent className="p-0" ref={printRef}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sub Head</TableHead>
                <TableHead className="text-right">Credit Balance</TableHead>
                <TableHead className="text-right">Debit Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : (
                <>
                  {balances.map((item) => (
                    <TableRow key={item.subHead}>
                      <TableCell className="font-medium">{item.label}</TableCell>
                      <TableCell className="text-right text-green-600">{item.credit > 0 ? item.credit.toLocaleString() : '-'}</TableCell>
                      <TableCell className="text-right text-red-600">{item.debit > 0 ? item.debit.toLocaleString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right text-green-600">{totalCredit.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-red-600">{totalDebit.toLocaleString()}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
