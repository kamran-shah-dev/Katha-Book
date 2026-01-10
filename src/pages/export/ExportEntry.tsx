import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Trash2 } from "lucide-react";

/** DEMO TYPES */
interface DemoEntry {
  id: string;
  account: string;
  product: string;
  bags_qty: number;
  weight_per_bag: number;
  rate_per_kg: number;
  total_weight: number;
  amount: number;
  vehicle_numbers: string;
  gd_no: string;
  entry_date: string;
}

export default function ExportEntryDemo() {
  // DEMO STATE
  const [entries, setEntries] = useState<DemoEntry[]>([]);
  const [search, setSearch] = useState("");

  // FORM SETUP
  const form = useForm({
    defaultValues: {
      account: "",
      product: "",
      bags_qty: 0,
      weight_per_bag: 0,
      rate_per_kg: 0,
      vehicle_numbers: "",
      gd_no: "",
      entry_date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  // WATCH VALUES
  const bags = form.watch("bags_qty");
  const weight = form.watch("weight_per_bag");
  const rate = form.watch("rate_per_kg");

  const totalWeight = bags * weight;
  const amount = totalWeight * rate;

  /** ADD ENTRY */
  const saveEntry = (data: any) => {
    const newEntry: DemoEntry = {
      id: Date.now().toString(),
      account: data.account,
      product: data.product,
      bags_qty: data.bags_qty,
      weight_per_bag: data.weight_per_bag,
      rate_per_kg: data.rate_per_kg,
      total_weight: totalWeight,
      amount,
      vehicle_numbers: data.vehicle_numbers,
      gd_no: data.gd_no,
      entry_date: data.entry_date,
    };

    setEntries((prev) => [newEntry, ...prev]);
    form.reset({
      account: "",
      product: "",
      bags_qty: 0,
      weight_per_bag: 0,
      rate_per_kg: 0,
      vehicle_numbers: "",
      gd_no: "",
      entry_date: format(new Date(), "yyyy-MM-dd"),
    });
  };

  /** DELETE ENTRY */
  const deleteEntry = (id: string) => {
    if (!confirm("Delete this entry?")) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  /** FILTERED LIST */
  const filtered = entries.filter((e) =>
    e.account.toLowerCase().includes(search.toLowerCase()) ||
    e.product.toLowerCase().includes(search.toLowerCase()) ||
    e.vehicle_numbers.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* FORM SECTION */}
      <Card className="w-full bg-gray-300 border border-gray-400 shadow-sm">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-xl font-bold">Export Entry (Demo)</CardTitle>
        </CardHeader>

        <CardContent className="bg-gray-300 py-4 px-4 space-y-3">

          {/* ROW 1 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

            <div>
              <Label>Account</Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Enter account"
                {...form.register("account")}
              />
            </div>

            <div>
              <Label>Product</Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Enter product"
                {...form.register("product")}
              />
            </div>

            <div>
              <Label>Bags Qty</Label>
              <Input
                type="number"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("bags_qty")}
              />
            </div>

            <div>
              <Label>Weight/Bag (KG)</Label>
              <Input
                type="number"
                step="0.001"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("weight_per_bag")}
              />
            </div>

            <div>
              <Label>Rate/KG</Label>
              <Input
                type="number"
                step="0.01"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("rate_per_kg")}
              />
            </div>

          </div>

          {/* ROW 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* Vehicle Numbers (65%) */}
            <div className="md:col-span-2">
              <Label>Vehicle Numbers</Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="ABC-123, XYZ-555"
                {...form.register("vehicle_numbers")}
              />
            </div>

            {/* GD No + Save Button */}
            <div className="flex gap-3">

              <div className="w-1/2">
                <Label>GD No</Label>
                <Input
                  className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  {...form.register("gd_no")}
                />
              </div>

              <div className="flex items-end w-1/2">
                <Button
                  className="w-full h-10 bg-[#0A2A43] text-white font-semibold hover:bg-[#051A28]"
                  onClick={form.handleSubmit(saveEntry)}
                >
                  Save
                </Button>
              </div>

            </div>
          </div>

          {/* CALC BOX */}
          <div className="p-3 bg-white rounded border border-gray-500">
            <div className="flex justify-between font-semibold">
              <span>Total Weight:</span>
              <span>{totalWeight.toFixed(3)} KG</span>
            </div>

            <div className="flex justify-between font-semibold">
              <span>Amount:</span>
              <span>Rs. {amount.toLocaleString()}</span>
            </div>
          </div>

        </CardContent>
      </Card>


      {/* TABLE SECTION */}
      <Card className="w-full border border-gray-300 shadow-sm">

        <CardHeader className="py-2 px-4">
          <div className="flex justify-between items-center">

            <div className="flex items-center gap-4">
              <CardTitle className="text-xl font-bold">Export Entries</CardTitle>

              <Input
                type="text"
                placeholder="Search entries..."
                className="h-9 w-60 border border-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Button variant="outline" size="sm" onClick={() => {}}>
              <RefreshCw className="h-4 w-4" />
            </Button>

          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <Table className="w-full text-sm">

              <TableHeader>
                <TableRow className="bg-gray-100 border-b border-gray-300">
                  <TableHead className="border-r w-24">Date</TableHead>
                  <TableHead className="border-r w-40">Account</TableHead>
                  <TableHead className="border-r w-40">Product</TableHead>
                  <TableHead className="border-r text-right w-20">Bags</TableHead>
                  <TableHead className="border-r text-right w-24">Weight</TableHead>
                  <TableHead className="border-r text-right w-28">Amount</TableHead>
                  <TableHead className="text-center w-20">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((entry) => (
                    <TableRow key={entry.id} className="border-b hover:bg-gray-50">
                      <TableCell>{format(new Date(entry.entry_date), "dd/MM/yy")}</TableCell>
                      <TableCell>{entry.account}</TableCell>
                      <TableCell>{entry.product}</TableCell>
                      <TableCell className="text-right">{entry.bags_qty}</TableCell>
                      <TableCell className="text-right">{entry.total_weight.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{entry.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="destructive" size="sm" onClick={() => deleteEntry(entry.id)}>
                          <Trash2 size={16} />
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
  );
}
