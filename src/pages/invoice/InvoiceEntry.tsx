import { useState, useEffect, useRef } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Save, RefreshCw, Printer, Trash2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Account = Database['public']['Tables']['accounts']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];

interface InvoiceItemForm {
  product_name: string;
  bags_qty: number;
  weight_per_bag: number;
  rate_per_kg: number;
}

const invoiceSchema = z.object({
  account_id: z.string().min(1, 'Account is required'),
  gd_no: z.string().optional(),
  invoice_date: z.string(),
  vehicle_numbers: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function InvoiceEntry() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<(Invoice & { accounts: Account | null })[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [printItems, setPrintItems] = useState<InvoiceItem[]>([]);
  const [printAccount, setPrintAccount] = useState<Account | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      account_id: '',
      gd_no: '',
      invoice_date: format(new Date(), 'yyyy-MM-dd'),
      vehicle_numbers: '',
    },
  });

  const fetchData = async () => {
    try {
      const [accountsRes, productsRes, invoicesRes] = await Promise.all([
        supabase.from('accounts').select('*').eq('is_active', true).order('account_name'),
        supabase.from('products').select('*').eq('is_active', true).order('name'),
        supabase.from('invoices')
          .select('*, accounts(*)')
          .eq('is_deleted', false)
          .order('invoice_date', { ascending: false })
          .limit(100),
      ]);

      setAccounts(accountsRes.data || []);
      setProducts(productsRes.data || []);
      setInvoices(invoicesRes.data || []);
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
    setSelectedInvoice(null);
    setInvoiceItems([{ product_name: '', bags_qty: 0, weight_per_bag: 0, rate_per_kg: 0 }]);
    form.reset({
      account_id: '',
      gd_no: '',
      invoice_date: format(new Date(), 'yyyy-MM-dd'),
      vehicle_numbers: '',
    });
  };

  const handleRowClick = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    form.reset({
      account_id: invoice.account_id || '',
      gd_no: invoice.gd_no || '',
      invoice_date: invoice.invoice_date,
      vehicle_numbers: invoice.vehicle_numbers || '',
    });

    const { data: items } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice.id)
      .order('sort_order');

    if (items && items.length > 0) {
      setInvoiceItems(items.map(item => ({
        product_name: item.product_name || '',
        bags_qty: item.bags_qty || 0,
        weight_per_bag: Number(item.weight_per_bag) || 0,
        rate_per_kg: Number(item.rate_per_kg) || 0,
      })));
    } else {
      setInvoiceItems([{ product_name: '', bags_qty: 0, weight_per_bag: 0, rate_per_kg: 0 }]);
    }
  };

  const addItem = () => {
    setInvoiceItems([...invoiceItems, { product_name: '', bags_qty: 0, weight_per_bag: 0, rate_per_kg: 0 }]);
  };

  const removeItem = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItemForm, value: string | number) => {
    const updated = [...invoiceItems];
    updated[index] = { ...updated[index], [field]: value };
    setInvoiceItems(updated);
  };

  const calculateItemTotal = (item: InvoiceItemForm) => {
    const totalWeight = item.bags_qty * item.weight_per_bag;
    return totalWeight * item.rate_per_kg;
  };

  const grandTotal = invoiceItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  const onSubmit = async (data: InvoiceFormData) => {
    if (!user) return;
    setSaving(true);

    try {
      let invoiceId: string;

      if (selectedInvoice) {
        const { error } = await supabase
          .from('invoices')
          .update({
            account_id: data.account_id || null,
            gd_no: data.gd_no || null,
            invoice_date: data.invoice_date,
            vehicle_numbers: data.vehicle_numbers || null,
            total_amount: grandTotal,
            net_pay: grandTotal,
          })
          .eq('id', selectedInvoice.id);

        if (error) throw error;
        invoiceId = selectedInvoice.id;

        await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
      } else {
        const { data: newInvoice, error } = await supabase
          .from('invoices')
          .insert({
            user_id: user.id,
            account_id: data.account_id || null,
            gd_no: data.gd_no || null,
            invoice_date: data.invoice_date,
            vehicle_numbers: data.vehicle_numbers || null,
            total_amount: grandTotal,
            net_pay: grandTotal,
          })
          .select()
          .single();

        if (error) throw error;
        invoiceId = newInvoice.id;
      }

      const itemsToInsert = invoiceItems.map((item, index) => ({
        invoice_id: invoiceId,
        product_name: item.product_name,
        bags_qty: item.bags_qty,
        weight_per_bag: item.weight_per_bag,
        total_weight: item.bags_qty * item.weight_per_bag,
        rate_per_kg: item.rate_per_kg,
        amount: calculateItemTotal(item),
        sort_order: index,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({ title: 'Success', description: 'Invoice saved successfully' });
      handleNew();
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async (invoice: Invoice) => {
    const { data: items } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice.id)
      .order('sort_order');

    const account = accounts.find(a => a.id === invoice.account_id);
    
    setPrintInvoice(invoice);
    setPrintItems(items || []);
    setPrintAccount(account || null);
    setShowPrintDialog(true);
  };

  const doPrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${printInvoice?.invoice_no}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; color: #666; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; background: #f9f9f9; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  useEffect(() => {
    handleNew();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoice Generation</h1>
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
        <Card className="lg:col-span-2">
          <CardHeader className="py-3">
            <CardTitle className="text-lg">{selectedInvoice ? `Edit Invoice #${selectedInvoice.invoice_no}` : 'New Invoice'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label>Account (M/S.)</Label>
                <Select value={form.watch('account_id')} onValueChange={(v) => form.setValue('account_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.account_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>GD No</Label>
                <Input {...form.register('gd_no')} />
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" {...form.register('invoice_date')} />
              </div>
              <div className="space-y-1">
                <Label>Vehicle Numbers</Label>
                <Input {...form.register('vehicle_numbers')} />
              </div>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">S.No</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-24">Bags Qty</TableHead>
                    <TableHead className="w-28">Weight/Bag</TableHead>
                    <TableHead className="w-28">Total Weight</TableHead>
                    <TableHead className="w-24">Rate/KG</TableHead>
                    <TableHead className="w-32 text-right">Amount</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Input 
                          value={item.product_name}
                          onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                          placeholder="Product name"
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number"
                          value={item.bags_qty}
                          onChange={(e) => updateItem(index, 'bags_qty', parseInt(e.target.value) || 0)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number"
                          step="0.001"
                          value={item.weight_per_bag}
                          onChange={(e) => updateItem(index, 'weight_per_bag', parseFloat(e.target.value) || 0)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={(item.bags_qty * item.weight_per_bag).toFixed(3)}
                          readOnly
                          className="h-8 bg-muted"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number"
                          step="0.01"
                          value={item.rate_per_kg}
                          onChange={(e) => updateItem(index, 'rate_per_kg', parseFloat(e.target.value) || 0)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        Rs. {calculateItemTotal(item).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeItem(index)}
                          disabled={invoiceItems.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
              <div className="text-xl font-bold">
                Total: Rs. {grandTotal.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Invoices</CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-card">Inv#</TableHead>
                    <TableHead className="sticky top-0 bg-card">Date</TableHead>
                    <TableHead className="sticky top-0 bg-card">Account</TableHead>
                    <TableHead className="sticky top-0 bg-card text-right">Amount</TableHead>
                    <TableHead className="sticky top-0 bg-card w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                  ) : invoices.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No invoices found.</TableCell></TableRow>
                  ) : (
                    invoices.map((invoice) => (
                      <TableRow 
                        key={invoice.id} 
                        className={`cursor-pointer ${selectedInvoice?.id === invoice.id ? 'bg-muted' : ''}`}
                        onClick={() => handleRowClick(invoice)}
                      >
                        <TableCell>{invoice.invoice_no}</TableCell>
                        <TableCell>{format(new Date(invoice.invoice_date), 'dd/MM/yy')}</TableCell>
                        <TableCell className="font-medium truncate max-w-[100px]">{invoice.accounts?.account_name || '-'}</TableCell>
                        <TableCell className="text-right">{Number(invoice.total_amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handlePrint(invoice); }}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
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

      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          <div ref={printRef} className="p-4 bg-white">
            <div className="header text-center mb-6">
              <h1 className="text-2xl font-bold">EXPORT INVOICE</h1>
              <p className="text-muted-foreground">Clearing & Forwarding</p>
            </div>
            <div className="flex justify-between mb-4 text-sm">
              <div>
                <p><strong>Invoice No:</strong> {printInvoice?.invoice_no}</p>
                <p><strong>GD No:</strong> {printInvoice?.gd_no || '-'}</p>
              </div>
              <div className="text-right">
                <p><strong>Date:</strong> {printInvoice && format(new Date(printInvoice.invoice_date), 'dd/MM/yyyy')}</p>
              </div>
            </div>
            <div className="mb-4">
              <p><strong>M/S.:</strong> {printAccount?.account_name}</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead className="text-right">Bags Qty</TableHead>
                  <TableHead className="text-right">Weight/Bag</TableHead>
                  <TableHead className="text-right">Total Weight</TableHead>
                  <TableHead className="text-right">Rate/KG</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {printItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell className="text-right">{item.bags_qty}</TableCell>
                    <TableCell className="text-right">{Number(item.weight_per_bag).toFixed(3)}</TableCell>
                    <TableCell className="text-right">{Number(item.total_weight).toFixed(3)}</TableCell>
                    <TableCell className="text-right">{Number(item.rate_per_kg).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{Number(item.amount).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted">
                  <TableCell colSpan={6} className="text-right">Total:</TableCell>
                  <TableCell className="text-right">Rs. {Number(printInvoice?.total_amount).toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            {printInvoice?.vehicle_numbers && (
              <div className="mt-4">
                <p><strong>Vehicle Numbers:</strong> {printInvoice.vehicle_numbers}</p>
              </div>
            )}
            <div className="mt-6 pt-4 border-t">
              <p className="text-right text-xl font-bold">Net Pay: Rs. {Number(printInvoice?.net_pay).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>Close</Button>
            <Button onClick={doPrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
