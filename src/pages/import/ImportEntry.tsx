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
  fetchImportEntries,
  createImportEntry,
  updateImportEntryById,
  deleteImportEntryById,
  getLastInvoiceNo
} from "@/services/import.services";

import { fetchAccounts } from "@/services/accounts.services";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export default function ImportEntryPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("IMP001");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const form = useForm({
    defaultValues: {
      account_id: "",
      account_name: "",
      supplier: "",
      bags_qty: 0,
      weight_per_bag: 0,
      rate_per_kg: 0,
      vehicle_numbers: "",
      grn_no: "",
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



  const loadInvoiceNo = async () => {
    const last = await getLastInvoiceNo();

    const prefix = "IMP";
    const num = parseInt(last.replace(prefix, ""), 10) + 1;

    const next = prefix + String(num).padStart(3, "0");

    setInvoiceNo(next);
  };


  const loadAccounts = async () => {
    try {
      const list = await fetchAccounts();
      setAccounts(list);
    } catch (e) {
      console.error("Error loading accounts", e);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const loadEntries = async () => {
    const res = await fetchImportEntries();
    setEntries(res);
  };

  const generateNextInvoiceNo = () => {
    setInvoiceNo((prev) => {
      const prefix = "IMP";
      const number = parseInt(prev.replace(prefix, ""), 10) + 1;
      return `${prefix}${String(number).padStart(3, "0")}`;
    });
  };

  const saveEntry = async (data: any) => {
    const payload = {
      account_id: data.account_id,
      account_name: data.account_name,
      supplier: data.supplier,
      bags_qty: data.bags_qty,
      weight_per_bag: data.weight_per_bag,
      rate_per_kg: data.rate_per_kg,
      total_weight: totalWeight,
      amount: amount,
      vehicle_numbers: data.vehicle_numbers,
      grn_no: data.grn_no,
      entry_date: data.entry_date,
      invoice_no: invoiceNo,
    };

    await createImportEntry(payload);

    generateNextInvoiceNo();
    loadEntries();

    form.reset({
      account_id: "",
      account_name: "",
      supplier: "",
      bags_qty: 0,
      weight_per_bag: 0,
      rate_per_kg: 0,
      vehicle_numbers: "",
      grn_no: "",
      entry_date: format(new Date(), "yyyy-MM-dd"),
    });
  };

  const handleEdit = (entry: any) => {
    setEditingId(entry.id);

    form.setValue("account_id", entry.account_id);
    form.setValue("account_name", entry.account_name);
    form.setValue("supplier", entry.supplier);
    form.setValue("bags_qty", entry.bags_qty);
    form.setValue("weight_per_bag", entry.weight_per_bag);
    form.setValue("rate_per_kg", entry.rate_per_kg);
    form.setValue("vehicle_numbers", entry.vehicle_numbers);
    form.setValue("grn_no", entry.grn_no);
    form.setValue("entry_date", entry.entry_date);
  };

  const updateEntry = async (id: string, data: any) => {
    const payload = {
      account_id: data.account_id,
      account_name: data.account_name,
      supplier: data.supplier,
      bags_qty: data.bags_qty,
      weight_per_bag: data.weight_per_bag,
      rate_per_kg: data.rate_per_kg,
      total_weight: data.bags_qty * data.weight_per_bag,
      amount: data.bags_qty * data.weight_per_bag * data.rate_per_kg,
      vehicle_numbers: data.vehicle_numbers,
      grn_no: data.grn_no,
      entry_date: data.entry_date,
    };

    await updateImportEntryById(id, payload);

    setEditingId(null);
    loadEntries();

    form.reset({
      account_id: "",
      account_name: "",
      supplier: "",
      bags_qty: 0,
      weight_per_bag: 0,
      rate_per_kg: 0,
      vehicle_numbers: "",
      grn_no: "",
      entry_date: format(new Date(), "yyyy-MM-dd"),
    });
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await deleteImportEntryById(id);
    loadEntries();
  };

  const filtered = entries.filter(
    (e) =>
      e.account_name.toLowerCase().includes(search.toLowerCase()) ||
      e.supplier.toLowerCase().includes(search.toLowerCase()) ||
      e.vehicle_numbers.toLowerCase().includes(search.toLowerCase()) ||
      e.invoice_no.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* FORM SECTION */}
      <Card className="w-full bg-gray-300 border border-gray-400 shadow-sm">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-xl font-bold">
            Import Entry {editingId ? "(Editing)" : ""}
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
                <SelectTrigger className="h-9 border-2 border-black focus:outline-none focus:ring-0">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>

                <SelectContent>
                  {loadingAccounts ? (
                    <div className="p-2 text-gray-500">Loading...</div>
                  ) : (
                    accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.account_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Product</Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none focus:ring-0"
                placeholder="Enter supplier name"
                {...form.register("supplier")}
              />
            </div>

            <div>
              <Label>Bags Qty</Label>
              <Input
                type="number"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0"
                {...form.register("bags_qty")}
              />
            </div>

            <div>
              <Label>Weight/Bag (KG)</Label>
              <Input
                type="number"
                step="0.001"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0"
                {...form.register("weight_per_bag")}
              />
            </div>

            <div>
              <Label>Rate/KG</Label>
              <Input
                type="number"
                step="0.01"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0"
                {...form.register("rate_per_kg")}
              />
            </div>

          </div>

          {/* ROW 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Label>Vehicle Numbers</Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none focus:ring-0"
                placeholder="ABC-123, XYZ-555"
                {...form.register("vehicle_numbers")}
              />
            </div>

            <div className="flex gap-3">
              <div className="w-1/2">
                <Label>GRN No</Label>
                <Input
                  className="h-9 border-2 border-black focus:outline-none focus:ring-0"
                  {...form.register("grn_no")}
                />
              </div>

              <div className="flex items-end w-1/2">
                <Button
                  className="w-full h-10 bg-[#0A2A43] text-white font-semibold"
                  onClick={
                    editingId
                      ? form.handleSubmit((data) => updateEntry(editingId, data))
                      : form.handleSubmit(saveEntry)
                  }
                >
                  {editingId ? "Update" : "Save"}
                </Button>
              </div>
            </div>
          </div>

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
              <CardTitle className="text-xl font-bold">Import Entries</CardTitle>

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
                  <TableHead className="border-r w-40">Supplier</TableHead>
                  <TableHead className="border-r text-right w-20">Bags</TableHead>
                  <TableHead className="border-r text-right w-24">Weight</TableHead>
                  <TableHead className="border-r text-right w-28">Amount</TableHead>
                  <TableHead className="text-center w-28">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-6 text-gray-500"
                    >
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <TableCell>{entry.invoice_no}</TableCell>
                      <TableCell>
                        {entry.entry_date
                          ? format(
                              entry.entry_date.toDate
                                ? entry.entry_date.toDate()
                                : new Date(entry.entry_date),
                              "dd/MM/yy"
                            )
                          : "-"}
                      </TableCell>

                      <TableCell>{entry.account_name}</TableCell>
                      <TableCell>{entry.supplier}</TableCell>
                      <TableCell className="text-right">{entry.bags_qty}</TableCell>
                      <TableCell className="text-right">
                        {entry.total_weight.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.amount.toLocaleString()}
                      </TableCell>

                      <TableCell className="text-center flex gap-2 justify-center">
                        <Button
                          size="sm"
                          className="bg-[#0A2A43] text-white font-semibold"
                          onClick={() => handleEdit(entry)}
                        >
                          <Pencil size={14} />
                          Edit
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteEntry(entry.id)}
                        >
                          <Trash2 size={16} />
                        </Button>

                        <Button
                          size="sm"
                          className="bg-blue-700 text-white"
                          onClick={() => openInvoice(entry, "import")}
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
