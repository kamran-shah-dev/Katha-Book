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
type ExportEntry = Database['public']['Tables']['export_entries']['Row'];

const exportSchema = z.object({
  account_id: z.string().min(1, 'Account is required'),
  product_id: z.string().optional(),
  vehicle_numbers: z.string().optional(),
  entry_date: z.string(),
  gd_no: z.string().optional(),
  bags_qty: z.coerce.number().min(0),
  weight_per_bag: z.coerce.number().min(0),
  rate_per_kg: z.coerce.number().min(0),
  remarks: z.string().optional(),
});

type ExportFormData = z.infer<typeof exportSchema>;

export default function ExportEntryPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [entries, setEntries] = useState<(ExportEntry & { accounts: Account | null; products: Product | null })[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ExportEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ExportFormData>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      account_id: '',
      product_id: '',
      vehicle_numbers: '',
      entry_date: format(new Date(), 'yyyy-MM-dd'),
      gd_no: '',
      bags_qty: 0,
      weight_per_bag: 0,
      rate_per_kg: 0,
      remarks: '',
    },
  });

  const bagsQty = form.watch('bags_qty');
  const weightPerBag = form.watch('weight_per_bag');
  const ratePerKg = form.watch('rate_per_kg');
  const totalWeight = bagsQty * weightPerBag;
  const amount = totalWeight * ratePerKg;

  const fetchData = async () => {
    try {
      const [accountsRes, productsRes, entriesRes] = await Promise.all([
        supabase.from('accounts').select('*').eq('is_active', true).order('account_name'),
        supabase.from('products').select('*').eq('is_active', true).order('name'),
        supabase.from('export_entries')
          .select('*, accounts(*), products(*)')
          .eq('is_deleted', false)
          .order('entry_date', { ascending: false })
          .limit(100),
      ]);

      setAccounts(accountsRes.data || []);
      setProducts(productsRes.data || []);
      setEntries(entriesRes.data || []);
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
      account_id: '',
      product_id: '',
      vehicle_numbers: '',
      entry_date: format(new Date(), 'yyyy-MM-dd'),
      gd_no: '',
      bags_qty: 0,
      weight_per_bag: 0,
      rate_per_kg: 0,
      remarks: '',
    });
  };

  const handleRowClick = (entry: ExportEntry) => {
    setSelectedEntry(entry);
    form.reset({
      account_id: entry.account_id || '',
      product_id: entry.product_id || '',
      vehicle_numbers: entry.vehicle_numbers || '',
      entry_date: entry.entry_date,
      gd_no: entry.gd_no || '',
      bags_qty: entry.bags_qty || 0,
      weight_per_bag: Number(entry.weight_per_bag) || 0,
      rate_per_kg: Number(entry.rate_per_kg) || 0,
      remarks: entry.remarks || '',
    });
  };

  const onSubmit = async (data: ExportFormData) => {
    if (!user) return;
    setSaving(true);

    const calculatedTotalWeight = data.bags_qty * data.weight_per_bag;
    const calculatedAmount = calculatedTotalWeight * data.rate_per_kg;

    try {
      if (selectedEntry) {
        const { error } = await supabase
          .from('export_entries')
          .update({
            account_id: data.account_id || null,
            product_id: data.product_id || null,
            vehicle_numbers: data.vehicle_numbers || null,
            entry_date: data.entry_date,
            gd_no: data.gd_no || null,
            bags_qty: data.bags_qty,
            weight_per_bag: data.weight_per_bag,
            total_weight: calculatedTotalWeight,
            rate_per_kg: data.rate_per_kg,
            amount: calculatedAmount,
            remarks: data.remarks || null,
          })
          .eq('id', selectedEntry.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Export entry updated successfully' });
      } else {
        const { error } = await supabase
          .from('export_entries')
          .insert({
            user_id: user.id,
            account_id: data.account_id || null,
            product_id: data.product_id || null,
            vehicle_numbers: data.vehicle_numbers || null,
            entry_date: data.entry_date,
            gd_no: data.gd_no || null,
            bags_qty: data.bags_qty,
            weight_per_bag: data.weight_per_bag,
            total_weight: calculatedTotalWeight,
            rate_per_kg: data.rate_per_kg,
            amount: calculatedAmount,
            remarks: data.remarks || null,
          });

        if (error) throw error;
        toast({ title: 'Success', description: 'Export entry created successfully' });
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
        <h1 className="text-2xl font-bold">Export Entry</h1>
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
            {selectedEntry && (
              <div className="p-2 bg-muted rounded text-sm">
                Export No: <strong>{selectedEntry.export_no}</strong>
              </div>
            )}

            <div className="space-y-1">
              <Label>Account</Label>
              <Select value={form.watch('account_id')} onValueChange={(v) => form.setValue('account_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.account_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Vehicle Numbers</Label>
              <Input {...form.register('vehicle_numbers')} placeholder="e.g. ABC-123, XYZ-456" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" {...form.register('entry_date')} />
              </div>
              <div className="space-y-1">
                <Label>GD No</Label>
                <Input {...form.register('gd_no')} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Product</Label>
              <Select value={form.watch('product_id') || ''} onValueChange={(v) => form.setValue('product_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Bags Qty</Label>
                <Input type="number" {...form.register('bags_qty')} />
              </div>
              <div className="space-y-1">
                <Label>Weight/Bag (KG)</Label>
                <Input type="number" step="0.001" {...form.register('weight_per_bag')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Total Weight</Label>
                <Input value={totalWeight.toFixed(3)} readOnly className="bg-muted" />
              </div>
              <div className="space-y-1">
                <Label>Rate/KG</Label>
                <Input type="number" step="0.01" {...form.register('rate_per_kg')} />
              </div>
            </div>

            <div className="p-3 bg-primary/10 rounded-md">
              <div className="flex justify-between font-semibold">
                <span>Amount:</span>
                <span>Rs. {amount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Export Entries</CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-card">Exp#</TableHead>
                    <TableHead className="sticky top-0 bg-card">Date</TableHead>
                    <TableHead className="sticky top-0 bg-card">Account</TableHead>
                    <TableHead className="sticky top-0 bg-card">Product</TableHead>
                    <TableHead className="sticky top-0 bg-card text-right">Bags</TableHead>
                    <TableHead className="sticky top-0 bg-card text-right">Weight</TableHead>
                    <TableHead className="sticky top-0 bg-card text-right">Amount</TableHead>
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
                        <TableCell>{entry.export_no}</TableCell>
                        <TableCell>{format(new Date(entry.entry_date), 'dd/MM/yy')}</TableCell>
                        <TableCell className="font-medium">{entry.accounts?.account_name || '-'}</TableCell>
                        <TableCell>{entry.products?.name || '-'}</TableCell>
                        <TableCell className="text-right">{entry.bags_qty}</TableCell>
                        <TableCell className="text-right">{Number(entry.total_weight).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">{Number(entry.amount).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <div className="border-t p-4 bg-muted/50">
            <span>Total Records: <strong>{entries.length}</strong></span>
          </div>
        </Card>
      </div>
    </div>
  );
}
