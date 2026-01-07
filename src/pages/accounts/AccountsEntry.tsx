import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Save, RefreshCw, Trash2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Account = Database['public']['Tables']['accounts']['Row'];
type AccountSubHead = Database['public']['Enums']['account_sub_head_type'];
type BalanceStatus = Database['public']['Enums']['balance_status_type'];
type LimitStatus = Database['public']['Enums']['limit_status_type'];

const subHeadOptions: { value: AccountSubHead; label: string }[] = [
  { value: 'BANKS', label: 'BANKS' },
  { value: 'DOLLAR_LEDGERS', label: 'DOLLAR LEDGERS' },
  { value: 'EXPORT_PARTIES', label: 'EXPORT PARTIES' },
  { value: 'IMPORT_PARTIES', label: 'IMPORT PARTIES' },
  { value: 'NLC_TAFTAN_EXPENSE_LEDGERS', label: 'NLC / TAFTAN EXPENSE LEDGERS' },
  { value: 'PERSONALS', label: 'PERSONALS' },
];

const accountSchema = z.object({
  account_name: z.string().min(1, 'Account name is required').max(100),
  sub_head: z.enum(['BANKS', 'DOLLAR_LEDGERS', 'EXPORT_PARTIES', 'IMPORT_PARTIES', 'NLC_TAFTAN_EXPENSE_LEDGERS', 'PERSONALS']),
  balance_status: z.enum(['CREDIT', 'DEBIT']),
  opening_balance: z.coerce.number().min(0),
  address: z.string().max(200).optional(),
  cell_no: z.string().max(20).optional(),
  limit_status: z.enum(['UNLIMITED', 'LIMITED']),
  limit_amount: z.coerce.number().min(0).optional(),
  is_active: z.boolean(),
  remarks: z.string().max(500).optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;

export default function AccountsEntry() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      account_name: '',
      sub_head: 'PERSONALS',
      balance_status: 'DEBIT',
      opening_balance: 0,
      address: '',
      cell_no: '',
      limit_status: 'UNLIMITED',
      limit_amount: 0,
      is_active: true,
      remarks: '',
    },
  });

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('account_name');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch accounts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleNew = () => {
    setSelectedAccount(null);
    form.reset({
      account_name: '',
      sub_head: 'PERSONALS',
      balance_status: 'DEBIT',
      opening_balance: 0,
      address: '',
      cell_no: '',
      limit_status: 'UNLIMITED',
      limit_amount: 0,
      is_active: true,
      remarks: '',
    });
  };

  const handleRowClick = (account: Account) => {
    setSelectedAccount(account);
    form.reset({
      account_name: account.account_name,
      sub_head: account.sub_head,
      balance_status: account.balance_status,
      opening_balance: Number(account.opening_balance),
      address: account.address || '',
      cell_no: account.cell_no || '',
      limit_status: account.limit_status,
      limit_amount: Number(account.limit_amount) || 0,
      is_active: account.is_active,
      remarks: account.remarks || '',
    });
  };

  const onSubmit = async (data: AccountFormData) => {
    if (!user) return;
    setSaving(true);

    try {
      if (selectedAccount) {
        // Update existing account
        const { error } = await supabase
          .from('accounts')
          .update({
            account_name: data.account_name,
            sub_head: data.sub_head,
            balance_status: data.balance_status,
            opening_balance: data.opening_balance,
            address: data.address || null,
            cell_no: data.cell_no || null,
            limit_status: data.limit_status,
            limit_amount: data.limit_amount || 0,
            is_active: data.is_active,
            remarks: data.remarks || null,
          })
          .eq('id', selectedAccount.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Account updated successfully' });
      } else {
        // Create new account
        const { error } = await supabase
          .from('accounts')
          .insert({
            user_id: user.id,
            account_name: data.account_name,
            sub_head: data.sub_head,
            balance_status: data.balance_status,
            opening_balance: data.opening_balance,
            address: data.address || null,
            cell_no: data.cell_no || null,
            limit_status: data.limit_status,
            limit_amount: data.limit_amount || 0,
            is_active: data.is_active,
            remarks: data.remarks || null,
          });

        if (error) throw error;
        toast({ title: 'Success', description: 'Account created successfully' });
      }

      handleNew();
      fetchAccounts();
    } catch (error: any) {
      console.error('Error saving account:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save account',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;
    
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', selectedAccount.id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Account deleted successfully' });
      handleNew();
      fetchAccounts();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Accounts Entry</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
          </Button>
          {selectedAccount && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Form */}
        <Card className="lg:col-span-1 border-sky-600 bg-sky-200">
          <CardHeader className="py-3">
            <CardTitle className="text-lg">
              {selectedAccount ? 'Edit Account' : 'New Account'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 ">
            <div className="space-y-1">
              <Label htmlFor="sub_head">A/C Sub Head</Label>
              <Select
                value={form.watch('sub_head')}
                onValueChange={(value: AccountSubHead) => form.setValue('sub_head', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sub head" />
                </SelectTrigger>
                <SelectContent>
                  {subHeadOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="account_name">Account Name</Label>
              <Input
                id="account_name"
                {...form.register('account_name')}
                placeholder="Enter account name"
              />
              {form.formState.errors.account_name && (
                <p className="text-sm text-destructive">{form.formState.errors.account_name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Balance Status</Label>
                <Select
                  value={form.watch('balance_status')}
                  onValueChange={(value: BalanceStatus) => form.setValue('balance_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREDIT">Credit</SelectItem>
                    <SelectItem value="DEBIT">Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="opening_balance">Amount</Label>
                <Input
                  id="opening_balance"
                  type="number"
                  step="0.01"
                  {...form.register('opening_balance')}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                {...form.register('address')}
                placeholder="Enter address"
                rows={2}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="cell_no">Cell No</Label>
              <Input
                id="cell_no"
                {...form.register('cell_no')}
                placeholder="Enter cell number"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Credit Limit Status</Label>
                <Select
                  value={form.watch('limit_status')}
                  onValueChange={(value: LimitStatus) => form.setValue('limit_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNLIMITED">Unlimited</SelectItem>
                    <SelectItem value="LIMITED">Limited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="limit_amount">Limit Amount</Label>
                <Input
                  id="limit_amount"
                  type="number"
                  step="0.01"
                  {...form.register('limit_amount')}
                  disabled={form.watch('limit_status') === 'UNLIMITED'}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={form.watch('is_active') ? 'yes' : 'no'}
                onValueChange={(value) => form.setValue('is_active', value === 'yes')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes (Active)</SelectItem>
                  <SelectItem value="no">No (Inactive)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                {...form.register('remarks')}
                placeholder="Enter remarks"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="lg:col-span-2 border-sky-600">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Accounts List</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Total: {accounts.length} accounts
              </span>
              <Button variant="ghost" size="sm" onClick={fetchAccounts}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-card">Account Name</TableHead>
                    <TableHead className="sticky top-0 bg-card">Sub Head</TableHead>
                    <TableHead className="sticky top-0 bg-card text-right">Credit</TableHead>
                    <TableHead className="sticky top-0 bg-card text-right">Debit</TableHead>
                    <TableHead className="sticky top-0 bg-card">Cell No</TableHead>
                    <TableHead className="sticky top-0 bg-card">Limit</TableHead>
                    <TableHead className="sticky top-0 bg-card">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : accounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No accounts found. Create your first account.
                      </TableCell>
                    </TableRow>
                  ) : (
                    accounts.map((account) => (
                      <TableRow
                        key={account.id}
                        className={`cursor-pointer ${selectedAccount?.id === account.id ? 'bg-muted' : ''}`}
                        onClick={() => handleRowClick(account)}
                      >
                        <TableCell className="font-medium">{account.account_name}</TableCell>
                        <TableCell className="text-xs">
                          {subHeadOptions.find(o => o.value === account.sub_head)?.label}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {account.balance_status === 'CREDIT' ? Number(account.opening_balance).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {account.balance_status === 'DEBIT' ? Number(account.opening_balance).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>{account.cell_no || '-'}</TableCell>
                        <TableCell>
                          {account.limit_status === 'LIMITED' 
                            ? Number(account.limit_amount).toLocaleString() 
                            : 'Unlimited'}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded ${account.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {account.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
