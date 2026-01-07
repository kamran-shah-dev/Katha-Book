import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Save, Trash2, RefreshCw } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleNew = () => {
    setSelectedProduct(null);
    setName('');
    setDescription('');
  };

  const handleRowClick = (product: Product) => {
    setSelectedProduct(product);
    setName(product.name);
    setDescription(product.description || '');
  };

  const handleSave = async () => {
    if (!user || !name.trim()) {
      toast({ title: 'Error', description: 'Product name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);

    try {
      if (selectedProduct) {
        const { error } = await supabase
          .from('products')
          .update({ name: name.trim(), description: description.trim() || null })
          .eq('id', selectedProduct.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Product updated' });
      } else {
        const { error } = await supabase
          .from('products')
          .insert({ user_id: user.id, name: name.trim(), description: description.trim() || null });

        if (error) throw error;
        toast({ title: 'Success', description: 'Product created' });
      }

      handleNew();
      fetchProducts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    if (!confirm('Delete this product?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', selectedProduct.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Product deleted' });
      handleNew();
      fetchProducts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Products</h1>
      
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="py-3">
            <CardTitle className="text-lg">{selectedProduct ? 'Edit Product' : 'New Product'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Product Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleNew} className="flex-1">
                <Plus className="h-4 w-4 mr-1" /> New
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                <Save className="h-4 w-4 mr-1" /> Save
              </Button>
              {selectedProduct && (
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Products List ({products.length})</CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchProducts}><RefreshCw className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : products.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No products</TableCell></TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow 
                      key={product.id} 
                      className={`cursor-pointer ${selectedProduct?.id === product.id ? 'bg-muted' : ''}`}
                      onClick={() => handleRowClick(product)}
                    >
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.description || '-'}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
