import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Trash2, Pencil, Printer } from "lucide-react";

import {
  listenPurchaseEntries,
  createPurchaseEntry,
  updatePurchaseEntryById,
  deletePurchaseEntryById,
  getLastPurchaseNo
} from "@/services/purchase.services";

import { listenAccounts } from "@/services/accounts.services";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export default function PurchaseEntryPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [purchaseNo, setPurchaseNo] = useState("PUR001");
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
      weight_unit: "kg",
      grn_no: "",
      entry_date: format(new Date(), "yyyy-MM-dd"),
    },
  });
  
  const { userName } = useAuth();
  const bags = Number(form.watch("bags_qty")) || 0;
  const unit = form.watch("weight_unit") || "kg";
  const weight = Number(form.watch("weight_per_bag")) || 0;
  const rate = Number(form.watch("rate_per_kg")) || 0;

  // Calculate total weight based on unit type
  const totalWeight = unit === "bags" ? bags * weight : bags;
  const finalAmount = totalWeight * rate;

  const unitLabelMap: Record<string, string> = {
    kg: "KG",
    litre: "Litre",
    bags: "Bags",
  };

  useEffect(() => {
      const unsubAcc = listenAccounts((list) => {
          setAccounts(list);
          setLoadingAccounts(false);
      });

      const unsubEntries = listenPurchaseEntries((list) => setEntries(list));

      loadPurchaseNo();

      return () => {
        unsubAcc();
        unsubEntries();
      };
  }, []);

  const openPurchase = (entry: any, type: "purchase") => {
    const payload = {
      ...entry,
      type,
    };

    localStorage.setItem("purchaseData", JSON.stringify(payload));
    window.open("/purchase-preview", "_blank");
  };

  const loadPurchaseNo = async () => {
    const last = await getLastPurchaseNo();
    const prefix = "PUR";
    const num = parseInt(last.replace(prefix, ""), 10) + 1;
    const next = prefix + String(num).padStart(3, "0");
    setPurchaseNo(next);
  };

  const generateNextPurchaseNo = () => {
    setPurchaseNo((prev) => {
      const prefix = "PUR";
      const number = parseInt(prev.replace(prefix, ""), 10) + 1;
      return `${prefix}${String(number).padStart(3, "0")}`;
    });
  };

  const saveEntry = async (data: any) => {
    const payload = {
      account_id: data.account_id,
      account_name: data.account_name,
      supplier: data.supplier,
      bags_qty: Number(data.bags_qty) || 0,
      weight_per_bag: Number(data.weight_per_bag) || 0,
      weight_unit: data.weight_unit || "kg",
      rate_per_kg: Number(data.rate_per_kg) || 0,
      total_weight: totalWeight,
      amount: finalAmount,
      vehicle_numbers: data.vehicle_numbers,
      grn_no: data.grn_no,
      entry_date: data.entry_date,
      purchase_no: purchaseNo,
    };

    await createPurchaseEntry({
      ...payload,
      created_by: userName,
    });

    generateNextPurchaseNo();

    form.reset({
      account_id: "",
      account_name: "",
      supplier: "",
      bags_qty: 0,
      weight_per_bag: 0,
      rate_per_kg: 0,
      vehicle_numbers: "",
      weight_unit: "kg",
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
    form.setValue("weight_per_bag", entry.weight_per_bag || 0);
    form.setValue("weight_unit", entry.weight_unit || "kg");
    form.setValue("rate_per_kg", entry.rate_per_kg);
    form.setValue("vehicle_numbers", entry.vehicle_numbers);
    form.setValue("grn_no", entry.grn_no);
    
    const dateValue = entry.entry_date?.toDate 
      ? format(entry.entry_date.toDate(), "yyyy-MM-dd")
      : format(new Date(entry.entry_date), "yyyy-MM-dd");
    form.setValue("entry_date", dateValue);
  };

  const updateEntry = async (id: string, data: any) => {
    const payload = {
      account_id: data.account_id,
      account_name: data.account_name,
      supplier: data.supplier,
      bags_qty: Number(data.bags_qty) || 0,
      weight_per_bag: Number(data.weight_per_bag) || 0,
      weight_unit: data.weight_unit || "kg",
      rate_per_kg: Number(data.rate_per_kg) || 0,
      total_weight: totalWeight,
      amount: finalAmount,
      vehicle_numbers: data.vehicle_numbers,
      grn_no: data.grn_no,
      entry_date: data.entry_date,
    };

    await updatePurchaseEntryById(id, {
      ...payload,
      modified_by: userName,
    });

    setEditingId(null);

    form.reset({
      account_id: "",
      account_name: "",
      supplier: "",
      bags_qty: 0,
      weight_per_bag: 0,
      rate_per_kg: 0,
      vehicle_numbers: "",
      weight_unit: "kg",
      grn_no: "",
      entry_date: format(new Date(), "yyyy-MM-dd"),
    });
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await deletePurchaseEntryById(id, userName);
  };

  const filtered = entries.filter(
    (e) =>
      e.account_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.supplier?.toLowerCase().includes(search.toLowerCase()) ||
      e.vehicle_numbers?.toLowerCase().includes(search.toLowerCase()) ||
      e.purchase_no?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 px-2 sm:px-0">

      {/* FORM SECTION */}
      <Card className="w-full bg-gray-300 border border-gray-400 shadow-sm">
        <CardHeader className="py-2 px-3 sm:px-4">
          <CardTitle className="text-lg sm:text-xl font-bold">
            Purchase Entry {editingId ? "(Editing)" : ""}
          </CardTitle>
        </CardHeader>

        <CardContent className="bg-gray-300 py-3 sm:py-4 px-3 sm:px-4 space-y-3">

          {/* First Row */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">

            <div>
              <Label>Purchase Number</Label>
              <Input
                value={purchaseNo}
                readOnly
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-gray-200 text-gray-700 font-semibold cursor-not-allowed"
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
                <SelectTrigger className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
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
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Enter Product"
                {...form.register("supplier")}
              />
            </div>

            <div>
              <Label>Unit Type</Label>
              <select
                className="h-9 w-full px-3 border-2 border-black rounded-md focus:outline-none"
                {...form.register("weight_unit")}
              >
                <option value="kg">KG</option>
                <option value="litre">Litre</option>
                <option value="bags">Bags</option>
              </select>
            </div>

            <div>
              <Label>{unit === "bags" ? "Number of Bags" : `Quantity (${unitLabelMap[unit]})`}</Label>
              <Input
                type="number"
                step="0.01"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("bags_qty", { valueAsNumber: true })}
              />
            </div>

            {unit === "bags" && (
              <div>
                <Label>Weight Per Bag (KG)</Label>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="Enter weight"
                  className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  {...form.register("weight_per_bag", { valueAsNumber: true })}
                />
              </div>
            )}

            <div>
              <Label>Rate</Label>
              <Input
                type="number"
                step="0.01"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("rate_per_kg", { valueAsNumber: true })}
              />
            </div>

          </div>

          {/* Second Row */}
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
                <Label>GRN No</Label>
                <Input
                  className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  {...form.register("grn_no")}
                />
              </div>

              <div className="flex items-end w-full sm:w-1/2">
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

          {/* Summary box */}
          <div className="p-3 bg-white rounded border border-gray-500 space-y-1">
            <div className="flex justify-between font-semibold">
              <span>Total Weight:</span>
              <span>{totalWeight.toFixed(2)} {unit === "bags" ? "KG" : unitLabelMap[unit]}</span>
            </div>

            <div className="flex justify-between font-bold text-lg border-t pt-1">
              <span>Total Amount:</span>
              <span className="text-green-600">Rs. {finalAmount.toFixed(2)}</span>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* TABLE SECTION */}
      <Card className="w-full border border-gray-300 shadow-sm">
        <CardHeader className="py-2 px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <CardTitle className="text-lg sm:text-xl font-bold">Purchase Entries</CardTitle>

              <Input
                type="text"
                placeholder="Search entries..."
                className="h-9 border-2 border-black w-full sm:w-auto"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setSearch("")}>
              <RefreshCw className="h-4 w-4" />
            </Button>

          </div>
        </CardHeader>

        <CardContent className="p-0">

          {/* MOBILE CARD VIEW */}
          <div className="md:hidden max-h-[500px] overflow-y-auto p-3 space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-6 text-gray-500">No records found.</div>
            ) : (
              filtered.map((entry) => (
                <div key={entry.id} className="border border-gray-300 rounded-lg p-3 bg-white shadow-sm">

                  <div className="flex justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Purchase #</p>
                      <p className="font-bold text-sm text-blue-600">{entry.purchase_no}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-semibold text-sm">
                        {format(
                          entry.entry_date?.toDate
                            ? entry.entry_date.toDate()
                            : new Date(entry.entry_date),
                          "dd/MM/yy"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-gray-500">Account</p>
                    <p className="font-semibold text-sm">{entry.account_name}</p>
                  </div>

                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Product</p>
                    <p className="font-medium text-sm">{entry.supplier}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Quantity</p>
                      <p className="font-semibold text-sm">{entry.bags_qty}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Weight</p>
                      <p className="font-semibold text-sm">
                        {entry.total_weight?.toFixed(2)} {entry.weight_unit === "bags" ? "KG" : unitLabelMap[entry.weight_unit || "kg"]}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="font-bold text-base text-green-600">
                      Rs. {entry.amount?.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-2 pt-2 border-t">
                    <Button
                      size="sm"
                      className="flex-1 bg-[#0A2A43] text-white"
                      onClick={() => handleEdit(entry)}
                    >
                      <Pencil size={14} className="mr-1" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      className="bg-blue-700 text-white"
                      onClick={() => openPurchase(entry, "purchase")}
                    >
                      <Printer size={14} />
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteEntry(entry.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                </div>
              ))
            )}
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden md:block max-h-[500px] overflow-y-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="bg-gray-100 border-b border-gray-300">
                  <TableHead className="border-r">Purchase#</TableHead>
                  <TableHead className="border-r">Date</TableHead>
                  <TableHead className="border-r">Account</TableHead>
                  <TableHead className="border-r">Product</TableHead>
                  <TableHead className="border-r text-right">Quantity</TableHead>
                  <TableHead className="border-r text-right">Total Weight</TableHead>
                  <TableHead className="border-r text-right">Amount</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id} className="border-b hover:bg-gray-50">
                    <TableCell>{entry.purchase_no}</TableCell>
                    <TableCell>
                      {format(
                        entry.entry_date?.toDate
                          ? entry.entry_date.toDate()
                          : new Date(entry.entry_date),
                        "dd/MM/yy"
                      )}
                    </TableCell>
                    <TableCell>{entry.account_name}</TableCell>
                    <TableCell>{entry.supplier}</TableCell>
                    <TableCell className="text-right">{entry.bags_qty}</TableCell>
                    <TableCell className="text-right">
                      {entry.total_weight?.toFixed(2)} {entry.weight_unit === "bags" ? "KG" : unitLabelMap[entry.weight_unit || "kg"]}
                    </TableCell>
                    <TableCell className="text-right">{entry.amount?.toLocaleString()}</TableCell>

                    <TableCell className="flex gap-2 justify-center">
                      <Button size="sm" className="bg-[#0A2A43] text-white" onClick={() => handleEdit(entry)}>
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
                        onClick={() => openPurchase(entry, "purchase")}
                      >
                        Print
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}