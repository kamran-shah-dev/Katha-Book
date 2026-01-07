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
import type { Database } from '@/integrations/supabase/types';

type Account = Database['public']['Tables']['accounts']['Row'];

interface AccountBalance {
  account: Account;
  balance: number;
}

export default function AccountsBalanceReport() {
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)
        .order('account_name');

      if (!accounts) return;

      const balancePromises = accounts.map(async (account) => {
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

        return { account, balance };
      });

      const results = await Promise.all(balancePromises);
      setBalances(results.filter(r => r.balance !== 0));
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
          <title>Accounts Balance Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background: #f5f5f5; text-align: left; }
            .text-right { text-align: right; }
            .credit { color: green; }
            .debit { color: red; }
          </style>
        </head>
        <body>
          <h1>Accounts Balance Report</h1>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const totalCredit = balances.filter(b => b.balance > 0).reduce((sum, b) => sum + b.balance, 0);
  const totalDebit = balances.filter(b => b.balance < 0).reduce((sum, b) => sum + Math.abs(b.balance), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Accounts Balance Report</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchBalances}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-lg">All Accounts Balance</CardTitle>
        </CardHeader>
        <CardContent className="p-0" ref={printRef}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Sub Head</TableHead>
                <TableHead className="text-right">Credit Balance</TableHead>
                <TableHead className="text-right">Debit Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : balances.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No balances found</TableCell></TableRow>
              ) : (
                <>
                  {balances.map(({ account, balance }) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.account_name}</TableCell>
                      <TableCell className="text-sm">{account.sub_head.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {balance > 0 ? balance.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {balance < 0 ? Math.abs(balance).toLocaleString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-bold">
                    <TableCell colSpan={2}>Total</TableCell>
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
