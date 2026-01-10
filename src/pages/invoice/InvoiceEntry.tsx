import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Plus, Trash2, Printer } from "lucide-react";

export default function InvoiceDemo() {
  const [invoiceItems, setInvoiceItems] = useState([
    { product_name: "", bags_qty: 0, weight_per_bag: 0, rate_per_kg: 0 },
  ]);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Add new row
  const addItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { product_name: "", bags_qty: 0, weight_per_bag: 0, rate_per_kg: 0 },
    ]);
  };

  // Remove row
  const removeItem = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    }
  };

  // Update item
  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...invoiceItems];
    updated[index][field] = value;
    setInvoiceItems(updated);
  };

  const calculateItemTotal = (item: any) => {
    return item.bags_qty * item.weight_per_bag * item.rate_per_kg;
  };

  const grandTotal = invoiceItems.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0
  );

  const saveInvoice = () => {
    const newInvoice = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      items: invoiceItems,
      total: grandTotal,
    };

    setInvoices([...invoices, newInvoice]);
    setInvoiceItems([{ product_name: "", bags_qty: 0, weight_per_bag: 0, rate_per_kg: 0 }]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

      {/* LEFT FORM */}
      <Card className="lg:col-span-2 bg-gray-300 border border-gray-400 shadow-sm">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-xl font-bold">Invoice Entry (Demo)</CardTitle>
        </CardHeader>

        <CardContent className="bg-gray-300 py-4 px-4 space-y-4">

          {/* ITEM TABLE */}
          <div className="border rounded-md bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Bags</TableHead>
                  <TableHead>W/Bag</TableHead>
                  <TableHead>Total Wt</TableHead>
                  <TableHead>Rate/KG</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {invoiceItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>

                    <TableCell>
                      <Input
                        className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={item.product_name}
                        onChange={(e) =>
                          updateItem(index, "product_name", e.target.value)
                        }
                        placeholder="Product"
                      />
                    </TableCell>

                    <TableCell>
                      <Input
                        type="number"
                        className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={item.bags_qty}
                        onChange={(e) =>
                          updateItem(index, "bags_qty", Number(e.target.value))
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <Input
                        type="number"
                        step="0.001"
                        className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={item.weight_per_bag}
                        onChange={(e) =>
                          updateItem(index, "weight_per_bag", Number(e.target.value))
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <Input
                        readOnly
                        className="h-9 border-2 border-black bg-gray-200"
                        value={(item.bags_qty * item.weight_per_bag).toFixed(3)}
                      />
                    </TableCell>

                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={item.rate_per_kg}
                        onChange={(e) =>
                          updateItem(index, "rate_per_kg", Number(e.target.value))
                        }
                      />
                    </TableCell>

                    <TableCell className="text-right font-semibold">
                      Rs. {calculateItemTotal(item).toLocaleString()}
                    </TableCell>

                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={invoiceItems.length === 1}
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center">
            <Button onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>

            <div className="text-xl font-bold">
              Total: Rs. {grandTotal.toLocaleString()}
            </div>
          </div>

          <Button
            className="w-full h-10 bg-[#0A2A43] text-white font-semibold hover:bg-[#051A28]"
            onClick={saveInvoice}
          >
            Save Invoice
          </Button>
        </CardContent>
      </Card>

      {/* RIGHT TABLE */}
      <Card className="border border-gray-400 shadow-sm">
        <CardHeader className="py-2 px-4 flex justify-between items-center">
          <CardTitle className="text-lg font-bold">Invoices</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inv#</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                      No invoices yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv, idx) => (
                    <TableRow key={inv.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{inv.date}</TableCell>
                      <TableCell>Rs. {inv.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
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
  );
}
