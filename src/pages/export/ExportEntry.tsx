import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Trash2, Pencil } from "lucide-react";

import {
  fetchExportEntries,
  createExportEntry,
  updateExportEntry,
  deleteExportEntry,
  getLastExportInvoiceNo
} from "@/services/export.services";

import { fetchAccounts } from "@/services/accounts.services";

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
    loadAccounts();
    loadEntries();
    loadInvoiceNo();
  }, []);

 const openInvoice = (entry: any, type: "import" | "export") => {
    const payload = {
      ...entry,
      type,
    };

    localStorage.setItem("invoiceData", JSON.stringify(payload));
    window.open("/invoice-preview", "_blank");
  };


  const loadAccounts = async () => {
    const res = await fetchAccounts();
    setAccounts(res);
  };

  const loadEntries = async () => {
    const res = await fetchExportEntries();
    setEntries(res);
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
    await loadEntries();
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
    await loadEntries();
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
    loadEntries();
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
    form.setValue("entry_date", format(entry.entry_date.toDate(), "yyyy-MM-dd"));
  };

  return (
    <div className="space-y-6">

      {/* FORM SECTION */}
      <Card className="w-full bg-gray-300 border border-gray-400 shadow-sm">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-xl font-bold">
            Export Entry {editingId ? "(Editing)" : ""}
          </CardTitle>
        </CardHeader>

        <CardContent className="bg-gray-300 py-4 px-4 space-y-3">

          {/* ROW 1 */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">

            <div>
              <Label>Invoice Number</Label>
              <Input
                value={invoiceNo}
                readOnly
                className="h-9 border-2 border-black bg-gray-200 text-gray-700 font-semibold cursor-not-allowed"
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
                <SelectTrigger className="h-9 border-2 border-black">
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
                className="h-9 border-2 border-black focus:outline-none"
                placeholder="Enter product"
                {...form.register("product")}
              />
            </div>

            <div>
              <Label>Bags Qty</Label>
              <Input
                type="number"
                className="h-9 border-2 border-black focus:outline-none"
                {...form.register("bags_qty")}
              />
            </div>

            <div>
              <Label>Weight/Bag (KG)</Label>
              <Input
                type="number"
                step="0.001"
                className="h-9 border-2 border-black focus:outline-none"
                {...form.register("weight_per_bag")}
              />
            </div>

            <div>
              <Label>Rate/KG</Label>
              <Input
                type="number"
                step="0.01"
                className="h-9 border-2 border-black focus:outline-none"
                {...form.register("rate_per_kg")}
              />
            </div>

          </div>

          {/* ROW 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            <div className="md:col-span-2">
              <Label>Vehicle Numbers</Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none"
                placeholder="ABC-123, XYZ-555"
                {...form.register("vehicle_numbers")}
              />
            </div>

            <div className="flex gap-3">
              <div className="w-1/2">
                <Label>GD No</Label>
                <Input
                  className="h-9 border-2 border-black focus:outline-none"
                  {...form.register("gd_no")}
                />
              </div>

              <div className="flex items-end w-1/2">
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
                className="h-9 border-2 border-black focus:outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Button variant="outline" size="sm" onClick={loadEntries}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <Table className="w-full text-sm">

              <TableHeader>
                <TableRow className="bg-gray-100 border-b border-gray-300">
                  <TableHead className="border-r w-24">Invoice#</TableHead>
                  <TableHead className="border-r w-24">Date</TableHead>
                  <TableHead className="border-r w-40">Account</TableHead>
                  <TableHead className="border-r w-40">Product</TableHead>
                  <TableHead className="border-r text-right w-20">Bags</TableHead>
                  <TableHead className="border-r text-right w-24">Weight</TableHead>
                  <TableHead className="border-r text-right w-28">Amount</TableHead>
                  <TableHead className="text-center w-28">Action</TableHead>
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
                      <TableCell>{entry.invoice_no}</TableCell>
                      <TableCell>{format(new Date(entry.entry_date), "dd/MM/yy")}</TableCell>
                      <TableCell>{entry.account_name}</TableCell>
                      <TableCell>{entry.product}</TableCell>
                      <TableCell className="text-right">{entry.bags_qty}</TableCell>
                      <TableCell className="text-right">{entry.total_weight.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{entry.amount.toLocaleString()}</TableCell>

                      <TableCell className="text-center flex gap-2 justify-center">
                        <Button
                          size="sm"
                          className="bg-[#0A2A43] text-white"
                          onClick={() => handleEdit(entry)}
                        >
                          <Pencil size={14} /> Edit
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteEntryHandler(entry.id)}
                        >
                          <Trash2 size={16} />
                        </Button>

                        <Button
                          size="sm"
                          className="bg-blue-700 text-white"
                          onClick={() => openInvoice(entry , "export")}
                        >
                          Print
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
