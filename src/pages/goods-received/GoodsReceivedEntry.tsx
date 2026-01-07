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
type Product = Database['public']['Tables']['products']['Row'];
type GoodsReceived = Database['public']['Tables']['goods_received']['Row'];

const goodsReceivedSchema = z.object({
  shipment: z.string().default('TAFTAN'),
  account_id: z.string().min(1, 'Account is required'),
  product_id: z.string().optional(),
  gd_no: z.string().optional(),
  entry_date: z.string(),
  total_weight: z.coerce.number().min(0),
  net_weight: z.coerce.number().min(0),
  custom_tax: z.coerce.number().min(0),
  challan_difference: z.coerce.number().min(0),
  port_expenses: z.coerce.number().min(0),
  commission: z.coerce.number().min(0),
  nlc_difference: z.coerce.number().min(0),
  taftan_difference: z.coerce.number().min(0),
  expense_name: z.string().optional(),
  expense_amount: z.coerce.number().min(0),
  vehicle_no: z.string().optional(),
  remarks: z.string().optional(),
});

type GoodsReceivedFormData = z.infer<typeof goodsReceivedSchema>;

export default function GoodsReceivedEntry() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [entries, setEntries] = useState<(GoodsReceived & { accounts: Account | null; products: Product | null })[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<GoodsReceived | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalPortExpenses, setTotalPortExpenses] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<GoodsReceivedFormData>({
    resolver: zodResolver(goodsReceivedSchema),
    defaultValues: {
      shipment: 'TAFTAN',
      account_id: '',
      product_id: '',
      gd_no: '',
      entry_date: format(new Date(), 'yyyy-MM-dd'),
      total_weight: 0,
      net_weight: 0,
      custom_tax: 0,
      challan_difference: 0,
      port_expenses: 0,
      commission: 0,
      nlc_difference: 0,
      taftan_difference: 0,
      expense_name: '',
      expense_amount: 0,
      vehicle_no: '',
      remarks: '',
    },
  });

  const watchedValues = form.watch([
    'custom_tax', 'challan_difference', 'port_expenses', 'commission',
    'nlc_difference', 'taftan_difference', 'expense_amount'
  ]);

  const totalAmount = watchedValues.reduce((sum, val) => sum + (Number(val) || 0), 0);

  const fetchData = async () => {
    try {
      const [accountsRes, productsRes, entriesRes] = await Promise.all([
        supabase.from('accounts').select('*').eq('is_active', true).order('account_name'),
        supabase.from('products').select('*').eq('is_active', true).order('name'),
        supabase.from('goods_received')
          .select('*, accounts(*), products(*)')
          .eq('is_deleted', false)
          .order('entry_date', { ascending: false })
          .limit(100),
      ]);

      setAccounts(accountsRes.data || []);
      setProducts(productsRes.data || []);
      setEntries(entriesRes.data || []);

      const totalPort = (entriesRes.data || []).reduce((sum, e) => sum + Number(e.port_expenses || 0), 0);
      setTotalPortExpenses(totalPort);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNew = () => {
    setSelectedEntry(null);
    form.reset({
      shipment: 'TAFTAN',
      account_id: '',
      product_id: '',
      gd_no: '',
      entry_date: format(new Date(), 'yyyy-MM-dd'),
      total_weight: 0,
      net_weight: 0,
      custom_tax: 0,
      challan_difference: 0,
      port_expenses: 0,
      commission: 0,
      nlc_difference: 0,
      taftan_difference: 0,
      expense_name: '',
      expense_amount: 0,
      vehicle_no: '',
      remarks: '',
    });
  };

  const handleRowClick = (entry: GoodsReceived) => {
    setSelectedEntry(entry);
    form.reset({
      shipment: entry.shipment || 'TAFTAN',
      account_id: entry.account_id || '',
      product_id: entry.product_id || '',
      gd_no: entry.gd_no || '',
      entry_date: entry.entry_date,
      total_weight: Number(entry.total_weight) || 0,
      net_weight: Number(entry.net_weight) || 0,
      custom_tax: Number(entry.custom_tax) || 0,
      challan_difference: Number(entry.challan_difference) || 0,
      port_expenses: Number(entry.port_expenses) || 0,
      commission: Number(entry.commission) || 0,
      nlc_difference: Number(entry.nlc_difference) || 0,
      taftan_difference: Number(entry.taftan_difference) || 0,
      expense_name: entry.expense_name || '',
      expense_amount: Number(entry.expense_amount) || 0,
      vehicle_no: entry.vehicle_no || '',
      remarks: entry.remarks || '',
    });
  };

  const onSubmit = async (data: GoodsReceivedFormData) => {
    if (!user) return;
    setSaving(true);

    const calculatedTotal = (data.custom_tax || 0) + (data.challan_difference || 0) + 
      (data.port_expenses || 0) + (data.commission || 0) + (data.nlc_difference || 0) + 
      (data.taftan_difference || 0) + (data.expense_amount || 0);

    try {
      if (selectedEntry) {
        const { error } = await supabase
          .from('goods_received')
          .update({
            shipment: data.shipment,
            account_id: data.account_id || null,
            product_id: data.product_id || null,
            gd_no: data.gd_no || null,
            entry_date: data.entry_date,
            total_weight: data.total_weight,
            net_weight: data.net_weight,
            custom_tax: data.custom_tax,
            challan_difference: data.challan_difference,
            port_expenses: data.port_expenses,
            commission: data.commission,
            nlc_difference: data.nlc_difference,
            taftan_difference: data.taftan_difference,
            expense_name: data.expense_name || null,
            expense_amount: data.expense_amount,
            vehicle_no: data.vehicle_no || null,
            remarks: data.remarks || null,
            total_amount: calculatedTotal,
          })
          .eq('id', selectedEntry.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Entry updated successfully' });
      } else {
        const { error } = await supabase
          .from('goods_received')
          .insert({
            user_id: user.id,
            shipment: data.shipment,
            account_id: data.account_id || null,
            product_id: data.product_id || null,
            gd_no: data.gd_no || null,
            entry_date: data.entry_date,
            total_weight: data.total_weight,
            net_weight: data.net_weight,
            custom_tax: data.custom_tax,
            challan_difference: data.challan_difference,
            port_expenses: data.port_expenses,
            commission: data.commission,
            nlc_difference: data.nlc_difference,
            taftan_difference: data.taftan_difference,
            expense_name: data.expense_name || null,
            expense_amount: data.expense_amount,
            vehicle_no: data.vehicle_no || null,
            remarks: data.remarks || null,
            total_amount: calculatedTotal,
          });

        if (error) throw error;
        toast({ title: 'Success', description: 'Entry created successfully' });
      }

      handleNew();
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Goods Received Entry</h1>
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
        <Card className="lg:col-span-1">
          <CardHeader className="py-3">
            <CardTitle className="text-lg">{selectedEntry ? 'Edit Entry' : 'New Entry'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Shipment</Label>
                <Select value={form.watch('shipment')} onValueChange={(v) => form.setValue('shipment', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TAFTAN">TAFTAN</SelectItem>
                    <SelectItem value="NLC">NLC</SelectItem>
                    <SelectItem value="CHAMAN">CHAMAN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" {...form.register('entry_date')} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Account</Label>
              <Select value={form.watch('account_id')} onValueChange={(v) => form.setValue('account_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.account_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Product</Label>
                <Select value={form.watch('product_id') || ''} onValueChange={(v) => form.setValue('product_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>GD #</Label>
                <Input {...form.register('gd_no')} placeholder="GD Number" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Total Weight</Label>
                <Input type="number" step="0.001" {...form.register('total_weight')} />
              </div>
              <div className="space-y-1">
                <Label>Net Weight</Label>
                <Input type="number" step="0.001" {...form.register('net_weight')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Custom Tax</Label>
                <Input type="number" step="0.01" {...form.register('custom_tax')} />
              </div>
              <div className="space-y-1">
                <Label>Challan Diff</Label>
                <Input type="number" step="0.01" {...form.register('challan_difference')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Port Expenses</Label>
                <Input type="number" step="0.01" {...form.register('port_expenses')} />
              </div>
              <div className="space-y-1">
                <Label>Commission</Label>
                <Input type="number" step="0.01" {...form.register('commission')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>NLC Diff</Label>
                <Input type="number" step="0.01" {...form.register('nlc_difference')} />
              </div>
              <div className="space-y-1">
                <Label>Taftan Diff</Label>
                <Input type="number" step="0.01" {...form.register('taftan_difference')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Expense Name</Label>
                <Input {...form.register('expense_name')} />
              </div>
              <div className="space-y-1">
                <Label>Amount</Label>
                <Input type="number" step="0.01" {...form.register('expense_amount')} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Vehicle No</Label>
              <Input {...form.register('vehicle_no')} placeholder="Vehicle number" />
            </div>

            <div className="space-y-1">
              <Label>Remarks</Label>
              <Input {...form.register('remarks')} />
            </div>

            <div className="p-3 bg-primary/10 rounded-md">
              <div className="flex justify-between font-semibold">
                <span>Total Amount:</span>
                <span>Rs. {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Goods Received List</CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-card">Sr#</TableHead>
                    <TableHead className="sticky top-0 bg-card">Date</TableHead>
                    <TableHead className="sticky top-0 bg-card">Account</TableHead>
                    <TableHead className="sticky top-0 bg-card">GD#</TableHead>
                    <TableHead className="sticky top-0 bg-card">Product</TableHead>
                    <TableHead className="sticky top-0 bg-card text-right">Port Exp</TableHead>
                    <TableHead className="sticky top-0 bg-card text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
                  ) : entries.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No entries found.</TableCell></TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow 
                        key={entry.id} 
                        className={`cursor-pointer ${selectedEntry?.id === entry.id ? 'bg-muted' : ''}`}
                        onClick={() => handleRowClick(entry)}
                      >
                        <TableCell>{entry.serial_no}</TableCell>
                        <TableCell>{format(new Date(entry.entry_date), 'dd/MM/yy')}</TableCell>
                        <TableCell className="font-medium">{entry.accounts?.account_name || '-'}</TableCell>
                        <TableCell>{entry.gd_no || '-'}</TableCell>
                        <TableCell>{entry.products?.name || '-'}</TableCell>
                        <TableCell className="text-right">{Number(entry.port_expenses).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">{Number(entry.total_amount).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <div className="border-t p-4 bg-muted/50 flex justify-between">
            <span>Total Port Expenses: <strong>Rs. {totalPortExpenses.toLocaleString()}</strong></span>
            <span>Total Records: <strong>{entries.length}</strong></span>
          </div>
        </Card>
      </div>
    </div>
  );
}
