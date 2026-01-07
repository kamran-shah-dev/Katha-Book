import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
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
import { Plus, Save, RefreshCw } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Account = Database['public']['Tables']['accounts']['Row'];
type CashbookEntry = Database['public']['Tables']['cashbook_entries']['Row'];
type BalanceStatus = Database['public']['Enums']['balance_status_type'];

const cashbookSchema = z.object({
  account_id: z.string().min(1, 'Account is required'),
  payment_detail: z.string().max(200).optional(),
  pay_status: z.enum(['CREDIT', 'DEBIT']),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  entry_date: z.string(),
  remarks: z.string().max(500).optional(),
});

type CashbookFormData = z.infer<typeof cashbookSchema>;

export default function CashbookEntry() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<(CashbookEntry & { accounts: Account | null })[]>([]);
  const [selectedAccountBalance, setSelectedAccountBalance] = useState<number>(0);
  const [cashInHand, setCashInHand] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<CashbookFormData>({
    resolver: zodResolver(cashbookSchema),
    defaultValues: {
      account_id: '',
      payment_detail: '',
      pay_status: 'DEBIT',
      amount: 0,
      entry_date: format(new Date(), 'yyyy-MM-dd'),
      remarks: '',
    },
  });

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)
        .order('account_name');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('cashbook_entries')
        .select('*, accounts(*)')
        .eq('is_deleted', false)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEntries(data || []);

      // Calculate cash in hand
      let total = 0;
      (data || []).forEach((entry) => {
        if (entry.pay_status === 'CREDIT') {
          total += Number(entry.amount);
        } else {
          total -= Number(entry.amount);
        }
      });
      setCashInHand(total);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchEntries();
  }, []);

  // Calculate account balance when account is selected
  useEffect(() => {
    const accountId = form.watch('account_id');
    if (accountId) {
      calculateAccountBalance(accountId);
    }
  }, [form.watch('account_id')]);

  const calculateAccountBalance = async (accountId: string) => {
    try {
      // Get account opening balance
      const account = accounts.find(a => a.id === accountId);
      if (!account) return;

      let balance = account.balance_status === 'CREDIT' 
        ? Number(account.opening_balance) 
        : -Number(account.opening_balance);

      // Get all ledger entries for this account
      const { data: ledgerData } = await supabase
        .from('ledger_entries')
        .select('credit_amount, debit_amount')
        .eq('account_id', accountId)
        .eq('is_deleted', false);

      if (ledgerData) {
        ledgerData.forEach((entry) => {
          balance += Number(entry.credit_amount) - Number(entry.debit_amount);
        });
      }

      setSelectedAccountBalance(balance);
    } catch (error) {
      console.error('Error calculating balance:', error);
    }
  };

  const handleNew = () => {
    form.reset({
      account_id: '',
      payment_detail: '',
      pay_status: 'DEBIT',
      amount: 0,
      entry_date: format(new Date(), 'yyyy-MM-dd'),
      remarks: '',
    });
    setSelectedAccountBalance(0);
  };

  const onSubmit = async (data: CashbookFormData) => {
    if (!user) return;
    setSaving(true);

    try {
      // Insert cashbook entry
      const { error: cashbookError } = await supabase
        .from('cashbook_entries')
        .insert({
          user_id: user.id,
          account_id: data.account_id,
          entry_date: data.entry_date,
          payment_detail: data.payment_detail || null,
          pay_status: data.pay_status,
          amount: data.amount,
          remarks: data.remarks || null,
        });

      if (cashbookError) throw cashbookError;

      // Also insert ledger entry
      const { error: ledgerError } = await supabase
        .from('ledger_entries')
        .insert({
          user_id: user.id,
          account_id: data.account_id,
          entry_date: data.entry_date,
          detail: data.payment_detail || 'Cashbook Entry',
          reference_type: 'CASHBOOK',
          credit_amount: data.pay_status === 'CREDIT' ? data.amount : 0,
          debit_amount: data.pay_status === 'DEBIT' ? data.amount : 0,
          remarks: data.remarks || null,
        });

      if (ledgerError) throw ledgerError;

      toast({ title: 'Success', description: 'Entry saved successfully' });
      handleNew();
      fetchEntries();
    } catch (error: any) {
      console.error('Error saving entry:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save entry',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedAccount = accounts.find(a => a.id === form.watch('account_id'));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily Cashbook Entry</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Form */}
        <Card className="lg:col-span-1">
          <CardHeader className="py-3">
            <CardTitle className="text-lg">New Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="account_id">Account Name</Label>
              <Select
                value={form.watch('account_id')}
                onValueChange={(value) => form.setValue('account_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.account_id && (
                <p className="text-sm text-destructive">{form.formState.errors.account_id.message}</p>
              )}
            </div>

            {selectedAccount && (
              <div className="p-2 bg-muted rounded-md text-sm">
                <div className="flex justify-between">
                  <span>Balance:</span>
                  <span className={selectedAccountBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    Rs. {Math.abs(selectedAccountBalance).toLocaleString()}
                    {selectedAccountBalance >= 0 ? ' Cr' : ' Dr'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Limit:</span>
                  <span>
                    {selectedAccount.limit_status === 'LIMITED' 
                      ? `Rs. ${Number(selectedAccount.limit_amount).toLocaleString()}`
                      : 'Unlimited'}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="payment_detail">Payment Detail</Label>
              <Input
                id="payment_detail"
                {...form.register('payment_detail')}
                placeholder="Invoice/GD reference"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Pay Status</Label>
                <Select
                  value={form.watch('pay_status')}
                  onValueChange={(value: BalanceStatus) => form.setValue('pay_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREDIT">Credit (In)</SelectItem>
                    <SelectItem value="DEBIT">Debit (Out)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...form.register('amount')}
                />
                {form.formState.errors.amount && (
                  <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="entry_date">Date</Label>
              <Input
                id="entry_date"
                type="date"
                {...form.register('entry_date')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Entries</CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchEntries}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-card">Date</TableHead>
                    <TableHead className="sticky top-0 bg-card">Account Name</TableHead>
                    <TableHead className="sticky top-0 bg-card">Detail</TableHead>
                    <TableHead className="sticky top-0 bg-card text-right">Credit</TableHead>
                    <TableHead className="sticky top-0 bg-card text-right">Debit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No entries found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{format(new Date(entry.entry_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="font-medium">
                          {entry.accounts?.account_name || '-'}
                        </TableCell>
                        <TableCell>{entry.payment_detail || '-'}</TableCell>
                        <TableCell className="text-right text-green-600">
                          {entry.pay_status === 'CREDIT' ? Number(entry.amount).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {entry.pay_status === 'DEBIT' ? Number(entry.amount).toLocaleString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          {/* Footer - Cash In Hand */}
          <div className="border-t p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="font-semibold">CASH IN HAND:</span>
              <span className={`text-xl font-bold ${cashInHand >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Rs. {Math.abs(cashInHand).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                {cashInHand < 0 && ' (Deficit)'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
