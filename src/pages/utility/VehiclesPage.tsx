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

type Vehicle = Database['public']['Tables']['vehicles']['Row'];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleNo, setVehicleNo] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('vehicle_no');

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleNew = () => {
    setSelectedVehicle(null);
    setVehicleNo('');
    setDescription('');
  };

  const handleRowClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleNo(vehicle.vehicle_no);
    setDescription(vehicle.description || '');
  };

  const handleSave = async () => {
    if (!user || !vehicleNo.trim()) {
      toast({ title: 'Error', description: 'Vehicle number is required', variant: 'destructive' });
      return;
    }
    setSaving(true);

    try {
      if (selectedVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update({ vehicle_no: vehicleNo.trim(), description: description.trim() || null })
          .eq('id', selectedVehicle.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Vehicle updated' });
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert({ user_id: user.id, vehicle_no: vehicleNo.trim(), description: description.trim() || null });

        if (error) throw error;
        toast({ title: 'Success', description: 'Vehicle created' });
      }

      handleNew();
      fetchVehicles();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVehicle) return;
    if (!confirm('Delete this vehicle?')) return;

    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', selectedVehicle.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Vehicle deleted' });
      handleNew();
      fetchVehicles();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Vehicles</h1>
      
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="py-3">
            <CardTitle className="text-lg">{selectedVehicle ? 'Edit Vehicle' : 'New Vehicle'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Vehicle Number" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} />
            <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleNew} className="flex-1">
                <Plus className="h-4 w-4 mr-1" /> New
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                <Save className="h-4 w-4 mr-1" /> Save
              </Button>
              {selectedVehicle && (
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Vehicles List ({vehicles.length})</CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchVehicles}><RefreshCw className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle No</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : vehicles.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No vehicles</TableCell></TableRow>
                ) : (
                  vehicles.map((vehicle) => (
                    <TableRow 
                      key={vehicle.id} 
                      className={`cursor-pointer ${selectedVehicle?.id === vehicle.id ? 'bg-muted' : ''}`}
                      onClick={() => handleRowClick(vehicle)}
                    >
                      <TableCell className="font-medium">{vehicle.vehicle_no}</TableCell>
                      <TableCell>{vehicle.description || '-'}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded ${vehicle.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {vehicle.is_active ? 'Active' : 'Inactive'}
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
