import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { createCashEntry, deleteCashEntry, listenCashEntries, updateCashEntry } from "@/services/cashbook.services";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listenAccounts } from "@/services/accounts.services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Account, CashEntry } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Trash2, RefreshCw, Pencil } from "lucide-react";

// -------- SCHEMA ----------
const cashbookSchema = z.object({
  account_id: z.string().min(1, "Account ID missing"),
  account_name: z.string().min(1, "Account is required"),
  payment_detail: z.string().optional(),
  pay_status: z.enum(["CREDIT", "DEBIT"]),
  amount: z.coerce.number().min(1),
  entry_date: z.string(),
  remarks: z.string().optional(),
});

type CashbookFormData = z.infer<typeof cashbookSchema>;

export default function CashbookEntry() {
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const form = useForm({
    resolver: zodResolver(cashbookSchema),
    defaultValues: {
      account_id: "",
      account_name: "",
      payment_detail: "",
      pay_status: "DEBIT",
      amount: undefined,
      entry_date: new Date().toISOString().split("T")[0],
      remarks: "",
    },
  });

  const cashInHand = entries.reduce((total, e) => {
    return e.type === "CREDIT"
      ? total + Number(e.amount)
      : total - Number(e.amount);
  }, 0);

  useEffect(() => {
    const unsubscribeAccounts = listenAccounts((list) => {
      setAccounts(list);
      setLoadingAccounts(false);
    });

    const unsubscribeCash = listenCashEntries((list) => {
      setEntries(list);
    });

    return () => {
      unsubscribeAccounts();
      unsubscribeCash();
    };
  }, []);

  const saveEntry = async (data: CashbookFormData) => {
    try {
      if (editingId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateCashEntry(editingId, data as any);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createCashEntry(data as any);
      }

      setEditingId(null);

      form.reset({
        account_id: "",
        account_name: "",
        payment_detail: "",
        pay_status: "DEBIT",
        amount: 0,
        entry_date: new Date().toISOString().split("T")[0],
        remarks: "",
      });
    } catch (err) {
      console.error("Error saving entry:", err);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Remove this entry?")) return;
    await deleteCashEntry(id);
  };

  const handleEdit = (entry: CashEntry) => {
    setEditingId(entry.id);

    form.setValue("account_name", entry.account_name);
    form.setValue("payment_detail", entry.payment_details || "");
    form.setValue("pay_status", entry.type);
    form.setValue("amount", entry.amount);
    form.setValue("entry_date", entry.date.toDate().toISOString().split("T")[0]);
    form.setValue("remarks", entry.remarks || "");
  };

  // Filter entries based on search
  const filteredEntries = entries.filter((entry) => {
    const searchLower = search.toLowerCase();
    return (
      entry.account_name?.toLowerCase().includes(searchLower) ||
      entry.payment_details?.toLowerCase().includes(searchLower) ||
      entry.amount?.toString().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 px-2 sm:px-0">

      {/* FORM SECTION */}
      <Card className="w-full bg-gray-300 border border-gray-400 shadow-sm">
        <CardHeader className="py-2 px-3 sm:px-4">
          <CardTitle className="text-lg sm:text-xl font-bold">
            Cashbook Entry {editingId ? "(Editing)" : ""}
          </CardTitle>
        </CardHeader>

        <CardContent className="bg-gray-300 py-3 sm:py-4 px-3 sm:px-4 space-y-3">

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">

            <div className="md:col-span-1">
              <Label>Account Name</Label>
              <Select
                value={form.watch("account_id")}
                onValueChange={(id) => {
                  const acc = accounts.find((a) => a.id === id);
                  form.setValue("account_id", id);
                  form.setValue("account_name", acc?.account_name || "");
                }}
              >
                <SelectTrigger className="h-9 border-2 border-black rounded-md focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
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

            <div className="md:col-span-1">
              <Label>Payment Detail</Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder=""
                {...form.register("payment_detail")}
              />
            </div>

            <div className="md:col-span-1">
              <Label>Type</Label>
              <Select
                value={form.watch("pay_status")}
                onValueChange={(v) => form.setValue("pay_status", v)}
              >
                <SelectTrigger className="h-9 border-2 border-black rounded-md focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT">Credit (In)</SelectItem>
                  <SelectItem value="DEBIT">Debit (Out)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-1">
              <Label>Amount</Label>
              <Input
                type="number"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("amount")}
              />
            </div>

            <div className="md:col-span-1 w-full md:w-[140px]">
              <Label>Date</Label>
              <Input
                type="date"
                max={new Date().toISOString().split("T")[0]}
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("entry_date")}
              />
            </div>

            <div className="flex items-end md:col-span-1">
              <Button
                className="w-full h-10 bg-[#0A2A43] text-white font-semibold"
                onClick={form.handleSubmit(saveEntry)}
              >
                {editingId ? "Update" : "Save Entry"}
              </Button>
            </div>

          </div>

        </CardContent>
      </Card>

      {/* TABLE/CARDS SECTION */}
      <Card className="w-full border border-gray-300 shadow-sm">
        <CardHeader className="py-2 px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <CardTitle className="text-lg sm:text-xl font-bold">Cashbook Entries</CardTitle>

              <Input
                type="text"
                placeholder="Search..."
                className="h-9 border-2 border-black w-full sm:w-60"
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
            {filteredEntries.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No entries found.
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div key={entry.id} className="border border-gray-300 rounded-lg p-3 bg-white shadow-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="font-semibold text-sm">
                          {entry.date?.toDate().toISOString().split("T")[0]}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          entry.type === "CREDIT" 
                            ? "bg-green-200 text-green-800" 
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {entry.type}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Account</p>
                      <p className="font-medium text-sm">{entry.account_name}</p>
                    </div>

                    {entry.payment_details && (
                      <div>
                        <p className="text-xs text-gray-500">Payment Detail</p>
                        <p className="text-sm">{entry.payment_details}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div>
                        <p className="text-xs text-gray-500">
                          {entry.type === "CREDIT" ? "Credit Amount" : "Debit Amount"}
                        </p>
                        <p className={`font-bold text-sm ${
                          entry.type === "CREDIT" ? "text-green-600" : "text-red-600"
                        }`}>
                          {entry.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Balance After</p>
                        <p className="font-medium text-sm">
                          {entry.balance_after?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>

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
                        variant="destructive"
                        size="sm"
                        className="px-4"
                        onClick={() => deleteEntry(entry.id)}
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
                  <TableHead className="border-r">Date</TableHead>
                  <TableHead className="border-r">Account</TableHead>
                  <TableHead className="border-r">Detail</TableHead>
                  <TableHead className="text-right border-r">Credit</TableHead>
                  <TableHead className="text-right border-r">Debit</TableHead>
                  <TableHead className="text-right border-r">Account Balance</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                      No entries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id} className="border-b hover:bg-gray-50">
                      <TableCell className="border-r">
                        {entry.date?.toDate().toISOString().split("T")[0]}
                      </TableCell>
                      <TableCell className="border-r">{entry.account_name}</TableCell>
                      <TableCell className="border-r">{entry.payment_details || "-"}</TableCell>
                      <TableCell className="text-right text-green-600 border-r">
                        {entry.type === "CREDIT" ? entry.amount.toLocaleString() : "-"}
                      </TableCell>
                      <TableCell className="text-right text-red-600 border-r">
                        {entry.type === "DEBIT" ? entry.amount.toLocaleString() : "-"}
                      </TableCell>
                      <TableCell className="text-right border-r">
                        {entry.balance_after?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button 
                            size="sm" 
                            className="bg-[#0A2A43] text-white hover:bg-[#051A28]" 
                            onClick={() => handleEdit(entry)}
                          >
                            <Pencil size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => deleteEntry(entry.id)}
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

        {/* CASH IN HAND FOOTER */}
        <div className="border-t p-3 sm:p-4 bg-gray-100 flex justify-between font-bold text-base sm:text-lg">
          <span>CASH IN HAND:</span>
          <span className={cashInHand >= 0 ? "text-green-600" : "text-red-600"}>
            {cashInHand.toLocaleString()}
          </span>
        </div>

      </Card>

    </div>
  );
}