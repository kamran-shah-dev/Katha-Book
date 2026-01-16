import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Trash2, Pencil, Printer } from "lucide-react";

import {
  listenExportEntries,
  createExportEntry,
  updateExportEntry,
  deleteExportEntry,
  getLastExportInvoiceNo
} from "@/services/export.services";

import { listenAccounts } from "@/services/accounts.services";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export default function ExportEntryPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("HAH001");
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      account_id: "",
      account_name: "",
      product: "",
      bags_qty: 0,
      weight_per_bag: 0,
      rate_per_kg: 0,
      vehicle_numbers: "",
      gd_no: "",
      entry_date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const bags = form.watch("bags_qty");
  const weight = form.watch("weight_per_bag");
  const rate = form.watch("rate_per_kg");

  const totalWeight = bags * weight;
  const amount = totalWeight * rate;

  useEffect(() => {
    const unsubAccounts = listenAccounts(setAccounts);
    const unsubExport = listenExportEntries((list) => setEntries(list));

    loadInvoiceNo(); 

    return () => {
      unsubAccounts();
      unsubExport();
    };
  }, []);


 const openInvoice = (entry: any, type: "import" | "export") => {
    const payload = {
      ...entry,
      type,
    };

    localStorage.setItem("invoiceData", JSON.stringify(payload));
    window.open("/invoice-preview", "_blank");
  };


  const loadInvoiceNo = async () => {
    const last = await getLastExportInvoiceNo();
    const prefix = "HAH";
    const num = parseInt(last.replace(prefix, ""), 10) + 1;
    const next = prefix + String(num).padStart(3, "0");
    setInvoiceNo(next);
  };

  const saveEntry = async (data: any) => {
    const payload = {
      ...data,
      total_weight: totalWeight,
      amount,
      invoice_no: invoiceNo,
    };

    await createExportEntry(payload);
    await loadInvoiceNo();

    form.reset({
      account_id: "",
      account_name: "",
      product: "",
      bags_qty: 0,
      weight_per_bag: 0,
      rate_per_kg: 0,
      vehicle_numbers: "",
      gd_no: "",
      entry_date: format(new Date(), "yyyy-MM-dd"),
    });
  };

  const updateEntryHandler = async (id: string, data: any) => {
    const payload = {
      ...data,
      total_weight: data.bags_qty * data.weight_per_bag,
      amount: data.bags_qty * data.weight_per_bag * data.rate_per_kg,
    };

    await updateExportEntry(id, payload);
    setEditingId(null);

    form.reset({
      account_id: "",
      account_name: "",
      product: "",
      bags_qty: 0,
      weight_per_bag: 0,
      rate_per_kg: 0,
      vehicle_numbers: "",
      gd_no: "",
      entry_date: format(new Date(), "yyyy-MM-dd"),
    });
  };

  const deleteEntryHandler = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await deleteExportEntry(id);
  };

  const filtered = entries.filter((e) =>
    e.account_name.toLowerCase().includes(search.toLowerCase()) ||
    e.product.toLowerCase().includes(search.toLowerCase()) ||
    e.vehicle_numbers.toLowerCase().includes(search.toLowerCase()) ||
    e.invoice_no.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (entry: any) => {
    setEditingId(entry.id);

    form.setValue("account_id", entry.account_id);
    form.setValue("account_name", entry.account_name);
    form.setValue("product", entry.product);
    form.setValue("bags_qty", entry.bags_qty);
    form.setValue("weight_per_bag", entry.weight_per_bag);
    form.setValue("rate_per_kg", entry.rate_per_kg);
    form.setValue("vehicle_numbers", entry.vehicle_numbers);
    form.setValue("gd_no", entry.gd_no);
    form.setValue(
      "entry_date",
      format(
        entry.entry_date?.toDate
          ? entry.entry_date.toDate()
          : new Date(entry.entry_date),
        "yyyy-MM-dd"
      )
    );
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">

      {/* FORM SECTION */}
      <Card className="w-full bg-gray-300 border border-gray-400 shadow-sm">
        <CardHeader className="py-2 px-3 sm:px-4">
          <CardTitle className="text-lg sm:text-xl font-bold">
            Export Entry {editingId ? "(Editing)" : ""}
          </CardTitle>
        </CardHeader>

        <CardContent className="bg-gray-300 py-3 sm:py-4 px-3 sm:px-4 space-y-3">

          {/* ROW 1 */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">

            <div>
              <Label>Invoice Number</Label>
              <Input
                value={invoiceNo}
                readOnly
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-gray-200 text-gray-700 font-semibold cursor-not-allowed"
              />
            </div>

            {/* ACCOUNT SELECT DROPDOWN */}
            <div>
              <Label>Account</Label>
              <Select
                value={form.watch("account_id")}
                onValueChange={(id) => {
                  const acc = accounts.find((a) => a.id === id);
                  form.setValue("account_id", id);
                  form.setValue("account_name", acc?.account_name || "");
                }}
              >
                <SelectTrigger className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="md:col-span-2">
              <Label>Vehicle Numbers</Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="ABC-123, XYZ-555"
                {...form.register("vehicle_numbers")}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-1/2">
                <Label>GD No</Label>
                <Input
                  className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  {...form.register("gd_no")}
                />
              </div>

              <div className="flex items-end w-full sm:w-1/2">
                <Button
                  className="w-full h-10 bg-[#0A2A43] text-white font-semibold"
                  onClick={
                    editingId
                      ? form.handleSubmit((d) => updateEntryHandler(editingId, d))
                      : form.handleSubmit(saveEntry)
                  }
                >
                  {editingId ? "Update" : "Save"}
                </Button>
              </div>
            </div>
          </div>

          {/* CALC BOX */}
          <div className="p-3 bg-white rounded border border-gray-500">
            <div className="flex justify-between font-semibold text-sm sm:text-base">
              <span>Total Weight:</span>
              <span>{totalWeight.toFixed(3)} KG</span>
            </div>

            <div className="flex justify-between font-semibold text-sm sm:text-base">
              <span>Amount:</span>
              <span>Rs. {amount.toLocaleString()}</span>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* TABLE/CARDS SECTION */}
      <Card className="w-full border border-gray-300 shadow-sm">
        <CardHeader className="py-2 px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <CardTitle className="text-lg sm:text-xl font-bold">Export Entries</CardTitle>

              <Input
                type="text"
                placeholder="Search entries..."
                className="h-9 border-2 border-black focus:outline-none w-full sm:w-auto"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Button variant="outline" size="sm" onClick={() => setSearch("")} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* MOBILE CARD VIEW (hidden on md and up) */}
          <div className="md:hidden max-h-[500px] overflow-y-auto p-3 space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No records found.
              </div>
            ) : (
              filtered.map((entry) => (
                <div key={entry.id} className="border border-gray-300 rounded-lg p-3 bg-white shadow-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-500">Invoice #</p>
                        <p className="font-bold text-sm text-blue-600">{entry.invoice_no}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="font-semibold text-sm">
                          {entry.entry_date
                            ? format(
                                entry.entry_date?.toDate
                                  ? entry.entry_date.toDate()
                                  : new Date(entry.entry_date),
                                "dd/MM/yy"
                              )
                            : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500">Account</p>
                      <p className="font-semibold text-sm">{entry.account_name}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Product</p>
                      <p className="font-medium text-sm">{entry.product}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div>
                        <p className="text-xs text-gray-500">Bags Qty</p>
                        <p className="font-semibold text-sm">{entry.bags_qty}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Weight</p>
                        <p className="font-semibold text-sm">{entry.total_weight.toFixed(2)} KG</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="font-bold text-base text-green-600">
                        Rs. {entry.amount.toLocaleString()}
                      </p>
                    </div>

                    {entry.vehicle_numbers && (
                      <div>
                        <p className="text-xs text-gray-500">Vehicle Numbers</p>
                        <p className="text-sm">{entry.vehicle_numbers}</p>
                      </div>
                    )}

                    {entry.gd_no && (
                      <div>
                        <p className="text-xs text-gray-500">GD No</p>
                        <p className="text-sm">{entry.gd_no}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        className="flex-1 bg-[#0A2A43] text-white font-semibold hover:bg-[#051A28]"
                        onClick={() => handleEdit(entry)}
                      >
                        <Pencil size={14} className="mr-1" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        className="bg-blue-700 text-white hover:bg-blue-800"
                        onClick={() => openInvoice(entry, "export")}
                      >
                        <Printer size={14} />
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteEntryHandler(entry.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DESKTOP TABLE VIEW (hidden on mobile) */}
          <div className="hidden md:block max-h-[500px] overflow-y-auto">
            <Table className="w-full text-sm">

              <TableHeader>
                <TableRow className="bg-gray-100 border-b border-gray-300">
                  <TableHead className="border-r">Invoice#</TableHead>
                  <TableHead className="border-r">Date</TableHead>
                  <TableHead className="border-r">Account</TableHead>
                  <TableHead className="border-r">Product</TableHead>
                  <TableHead className="border-r text-right">Bags</TableHead>
                  <TableHead className="border-r text-right">Weight</TableHead>
                  <TableHead className="border-r text-right">Amount</TableHead>
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
                      <TableCell className="border-r">{entry.invoice_no}</TableCell>
                      <TableCell className="border-r">
                        {entry.entry_date
                          ? format(
                              entry.entry_date?.toDate
                                ? entry.entry_date.toDate()
                                : new Date(entry.entry_date),
                              "dd/MM/yy"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="border-r">{entry.account_name}</TableCell>
                      <TableCell className="border-r">{entry.product}</TableCell>
                      <TableCell className="text-right border-r">{entry.bags_qty}</TableCell>
                      <TableCell className="text-right border-r">{entry.total_weight.toFixed(2)}</TableCell>
                      <TableCell className="text-right border-r">{entry.amount.toLocaleString()}</TableCell>

                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            className="bg-[#0A2A43] text-white hover:bg-[#051A28]"
                            onClick={() => handleEdit(entry)}
                          >
                            <Pencil size={14} className="mr-1" />
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            className="bg-blue-700 text-white hover:bg-blue-800"
                            onClick={() => openInvoice(entry, "export")}
                          >
                            <Printer size={14} className="mr-1" />
                            Print
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteEntryHandler(entry.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
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