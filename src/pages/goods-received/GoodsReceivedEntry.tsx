import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Trash2, RefreshCw } from "lucide-react";

/** DEMO ENTRY TYPE */
interface DemoGoods {
  id: string;
  shipment: string;
  account: string;
  product: string;
  gd_no: string;
  entry_date: string;
  port_expenses: number;
  total_amount: number;
}

export default function GoodsReceivedDemo() {
  const [entries, setEntries] = useState<DemoGoods[]>([]);
  const [search, setSearch] = useState("");

  // React Hook Form
  const form = useForm({
    defaultValues: {
      shipment: "TAFTAN",
      account: "",
      product: "",
      gd_no: "",
      entry_date: format(new Date(), "yyyy-MM-dd"),
      custom_tax: 0,
      challan_difference: 0,
      port_expenses: 0,
      commission: 0,
      nlc_difference: 0,
      taftan_difference: 0,
      expense_amount: 0,
    },
  });

  // Watch fields for total calculation
  const fields = form.watch([
    "custom_tax",
    "challan_difference",
    "port_expenses",
    "commission",
    "nlc_difference",
    "taftan_difference",
    "expense_amount",
  ]);

  const totalAmount = fields.reduce((sum, v) => sum + Number(v || 0), 0);

  /** SAVE ENTRY */
  const saveEntry = (data: any) => {
    const newEntry: DemoGoods = {
      id: Date.now().toString(),
      shipment: data.shipment,
      account: data.account,
      product: data.product,
      gd_no: data.gd_no,
      entry_date: data.entry_date,
      port_expenses: Number(data.port_expenses),
      total_amount: totalAmount,
    };

    setEntries((prev) => [newEntry, ...prev]);

    // Reset form
    form.reset({
      shipment: "TAFTAN",
      account: "",
      product: "",
      gd_no: "",
      entry_date: format(new Date(), "yyyy-MM-dd"),
      custom_tax: 0,
      challan_difference: 0,
      port_expenses: 0,
      commission: 0,
      nlc_difference: 0,
      taftan_difference: 0,
      expense_amount: 0,
    });
  };

  /** DELETE ENTRY */
  const deleteEntry = (id: string) => {
    if (!confirm("Delete this entry?")) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  /** FILTER FOR SEARCH */
  const filtered = entries.filter(
    (e) =>
      e.account.toLowerCase().includes(search.toLowerCase()) ||
      e.product.toLowerCase().includes(search.toLowerCase()) ||
      e.gd_no.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* FORM CARD */}
      <Card className="w-full bg-gray-300 border border-gray-400 shadow-sm">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-xl font-bold">Goods Received Entry (Demo)</CardTitle>
        </CardHeader>

        <CardContent className="bg-gray-300 py-4 px-4 space-y-4">

          {/* ROW 1 – 5 COLUMNS */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

            <div>
              <Label>Shipment</Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("shipment")}
                placeholder="TAFTAN / NLC"
              />
            </div>

            <div>
              <Label>Account</Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("account")}
                placeholder="Account Name"
              />
            </div>

            <div>
              <Label>Product</Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("product")}
                placeholder="Product Name"
              />
            </div>

            <div>
              <Label>GD No</Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("gd_no")}
                placeholder="Enter GD No"
              />
            </div>

            <div>
              <Label>Date</Label>
              <Input
                type="date"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("entry_date")}
              />
            </div>

          </div>

          {/* ROW 2 – EXACTLY 4 COLUMNS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

            <div>
              <Label>Custom Tax</Label>
              <Input
                type="number"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("custom_tax")}
              />
            </div>

            <div>
              <Label>Challan Diff</Label>
              <Input
                type="number"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("challan_difference")}
              />
            </div>

            <div>
              <Label>Port Exp</Label>
              <Input
                type="number"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("port_expenses")}
              />
            </div>

            <div>
              <Label>Commission</Label>
              <Input
                type="number"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("commission")}
              />
            </div>

          </div>

          {/* ROW 3 – NLC, TAFTAN, EXP AMOUNT + SAVE BUTTON */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

            <div>
              <Label>NLC Diff</Label>
              <Input
                type="number"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("nlc_difference")}
              />
            </div>

            <div>
              <Label>Taftan Diff</Label>
              <Input
                type="number"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("taftan_difference")}
              />
            </div>

            <div>
              <Label>Expense Amount</Label>
              <Input
                type="number"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("expense_amount")}
              />
            </div>

            {/* SAVE BUTTON */}
            <div className="flex items-end">
              <Button
                className="w-full h-10 bg-[#0A2A43] text-white font-semibold hover:bg-[#051A28]"
                onClick={form.handleSubmit(saveEntry)}
              >
                Save Entry
              </Button>
            </div>

          </div>

          {/* TOTAL BOX */}
          <div className="p-3 bg-white rounded border border-gray-500">
            <div className="flex justify-between font-semibold">
              <span>Total Amount:</span>
              <span>Rs. {totalAmount.toLocaleString()}</span>
            </div>
          </div>

        </CardContent>
      </Card>


      {/* TABLE SECTION */}
      <Card className="w-full border border-gray-300 shadow-sm">
        <CardHeader className="py-2 px-4">
          <div className="flex justify-between items-center">

            <div className="flex items-center gap-4">
              <CardTitle className="text-xl font-bold">Goods Received List</CardTitle>

              <Input
                type="text"
                placeholder="Search..."
                className="h-9 w-60 border border-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>

          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <Table className="w-full text-sm">

              <TableHeader>
                <TableRow className="bg-gray-100 border-b border-gray-300">
                  <TableHead className="border-r">Shipment</TableHead>
                  <TableHead className="border-r">Date</TableHead>
                  <TableHead className="border-r">Account</TableHead>
                  <TableHead className="border-r">GD#</TableHead>
                  <TableHead className="border-r">Product</TableHead>
                  <TableHead className="border-r text-right">Port Exp</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((entry) => (
                    <TableRow key={entry.id} className="border-b hover:bg-gray-50">
                      <TableCell>{entry.shipment}</TableCell>
                      <TableCell>{format(new Date(entry.entry_date), "dd/MM/yy")}</TableCell>
                      <TableCell>{entry.account}</TableCell>
                      <TableCell>{entry.gd_no}</TableCell>
                      <TableCell>{entry.product}</TableCell>
                      <TableCell className="text-right">{entry.port_expenses.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">{entry.total_amount.toLocaleString()}</TableCell>
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
