import { useState, useEffect, useRef } from 'react';
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
import type { Database } from '@/integrations/supabase/types';

type Account = Database['public']['Tables']['accounts']['Row'];
type LedgerEntry = Database['public']['Tables']['ledger_entries']['Row'];

interface LedgerRow {
  date: string;
  detail: string;
  credit: number;
  debit: number;
  balance: number;
}

export default function LedgerReport() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [fromDate, setFromDate] = useState(format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [ledgerRows, setLedgerRows] = useState<LedgerRow[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data } = await supabase.from('accounts').select('*').order('account_name');
      setAccounts(data || []);
    };
    fetchAccounts();
  }, []);

  const generateReport = async () => {
    if (!selectedAccountId) return;
    setLoading(true);

    try {
      const account = accounts.find(a => a.id === selectedAccountId);
      setSelectedAccount(account || null);

      // Get opening balance from account
      let runningBalance = account?.balance_status === 'CREDIT' 
        ? Number(account.opening_balance) 
        : -Number(account.opening_balance);

      // Get entries before from date for opening balance
      const { data: priorEntries } = await supabase
        .from('ledger_entries')
        .select('credit_amount, debit_amount')
        .eq('account_id', selectedAccountId)
        .eq('is_deleted', false)
        .lt('entry_date', fromDate);

      if (priorEntries) {
        priorEntries.forEach(entry => {
          runningBalance += Number(entry.credit_amount) - Number(entry.debit_amount);
        });
      }

      setOpeningBalance(runningBalance);

      // Get entries in date range
      const { data: entries } = await supabase
        .from('ledger_entries')
        .select('*')
        .eq('account_id', selectedAccountId)
        .eq('is_deleted', false)
        .gte('entry_date', fromDate)
        .lte('entry_date', toDate)
        .order('entry_date')
        .order('created_at');

      const rows: LedgerRow[] = [];

      // Add opening balance row
      rows.push({
        date: fromDate,
        detail: 'Opening Balance',
        credit: runningBalance > 0 ? runningBalance : 0,
        debit: runningBalance < 0 ? Math.abs(runningBalance) : 0,
        balance: runningBalance,
      });

      // Process entries
      (entries || []).forEach(entry => {
        const credit = Number(entry.credit_amount) || 0;
        const debit = Number(entry.debit_amount) || 0;
        runningBalance += credit - debit;

        rows.push({
          date: entry.entry_date,
          detail: entry.detail || '-',
          credit,
          debit,
          balance: runningBalance,
        });
      });

      setLedgerRows(rows);
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
          <title>Ledger Report - ${selectedAccount?.account_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
            h1 { text-align: center; margin-bottom: 5px; }
            .period { text-align: center; margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; }
            th { background: #f5f5f5; text-align: left; }
            .text-right { text-align: right; }
            .credit { color: green; }
            .debit { color: red; }
          </style>
        </head>
        <body>
          <h1>Ledger Report</h1>
          <p class="period">${selectedAccount?.account_name}<br/>
          ${format(new Date(fromDate), 'dd/MM/yyyy')} to ${format(new Date(toDate), 'dd/MM/yyyy')}</p>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const totals = ledgerRows.reduce((acc, row, i) => {
    if (i === 0) return acc; // Skip opening balance
    return {
      credit: acc.credit + row.credit,
      debit: acc.debit + row.debit,
    };
  }, { credit: 0, debit: 0 });

  const closingBalance = ledgerRows.length > 0 ? ledgerRows[ledgerRows.length - 1].balance : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ledger Report</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2 space-y-1">
              <Label>Account</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.account_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>From Date</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>To Date</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={generateReport} disabled={!selectedAccountId || loading} className="flex-1">
                <Search className="h-4 w-4 mr-1" /> {loading ? 'Loading...' : 'Generate'}
              </Button>
              {ledgerRows.length > 0 && (
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {ledgerRows.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-lg">{selectedAccount?.account_name} - Ledger</CardTitle>
          </CardHeader>
          <CardContent className="p-0" ref={printRef}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Date</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead className="text-right w-32">Credit</TableHead>
                  <TableHead className="text-right w-32">Debit</TableHead>
                  <TableHead className="text-right w-36">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerRows.map((row, i) => (
                  <TableRow key={i} className={i === 0 ? 'bg-muted/50 font-medium' : ''}>
                    <TableCell>{format(new Date(row.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{row.detail}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {row.credit > 0 ? row.credit.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {row.debit > 0 ? row.debit.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${row.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(row.balance).toLocaleString()} {row.balance >= 0 ? 'Cr' : 'Dr'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted font-bold">
                  <TableCell colSpan={2}>Totals</TableCell>
                  <TableCell className="text-right text-green-600">{totals.credit.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-red-600">{totals.debit.toLocaleString()}</TableCell>
                  <TableCell className={`text-right ${closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(closingBalance).toLocaleString()} {closingBalance >= 0 ? 'Cr' : 'Dr'}
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
