import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { createCashEntry, deleteCashEntry, fetchCashEntries, updateCashEntry } from "@/services/cashbook.services";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchAccounts } from "@/services/accounts.services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

export default function CashbookEntry() {
  const [entries, setEntries] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const form = useForm({
    resolver: zodResolver(cashbookSchema),
    defaultValues: {
      account_id: "",
      account_name: "",
      payment_detail: "",
      pay_status: "DEBIT",
      amount: 0,
      entry_date: new Date().toISOString().split("T")[0],
      remarks: "",
    },
  });

  const cashInHand = entries.reduce((total, e) => {
    return e.type === "CREDIT"
      ? total + Number(e.amount)
      : total - Number(e.amount);
  }, 0);

  const loadAccounts = async () => {
    try {
      const list = await fetchAccounts();
      setAccounts(list);
    } catch (err) {
      console.error("Error loading accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    loadAccounts();
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const list = await fetchCashEntries();
    setEntries(list);
  };

  // SAVE NEW ENTRY
  const saveEntry = async (data: any) => {
    try {
      if (editingId) {
        await updateCashEntry(editingId, data);
      } else {
        await createCashEntry(data);
      }

      await loadEntries();
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

  // DELETE ENTRY
  const deleteEntry = async (id: string) => {
    if (!confirm("Remove this entry?")) return;

    await deleteCashEntry(id);
    loadEntries();
  };

  // LOAD ENTRY INTO FORM FOR EDITING
  const handleEdit = (entry: any) => {
  setEditingId(entry.id);

  form.setValue("account_name", entry.account_name);
  form.setValue("payment_detail", entry.payment_details || "");
  form.setValue("pay_status", entry.type);
  form.setValue("amount", entry.amount);
  form.setValue("entry_date", entry.date.toDate().toISOString().split("T")[0]);
  form.setValue("remarks", entry.remarks || "");
};

  return (
    <div className="space-y-6">
      {/* FORM SECTION */}
      <Card className="w-full bg-gray-300 border border-gray-400 shadow-sm">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-xl font-bold">
            Cashbook Entry {editingId ? "(Editing)" : ""}
          </CardTitle>
        </CardHeader>

        <CardContent className="bg-gray-300 py-4 px-4 space-y-3">
          {/* ROW 1 */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            {/* ACCOUNT NAME */}
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
                <SelectTrigger className="h-9 border-2 border-black rounded-md focus:outline-none focus:ring-0">
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

            {/* PAYMENT DETAIL */}
            <div className="md:col-span-1">
              <Label>Payment Detail</Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                placeholder="Invoice or GD No."
                {...form.register("payment_detail")}
              />
            </div>

            {/* TYPE */}
            <div className="md:col-span-1">
              <Label>Type</Label>
              <Select
                value={form.watch("pay_status")}
                onValueChange={(v) => form.setValue("pay_status", v)}
              >
                <SelectTrigger className="h-9 border-2 border-black rounded-md focus:outline-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT">Credit (In)</SelectItem>
                  <SelectItem value="DEBIT">Debit (Out)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* AMOUNT */}
            <div className="md:col-span-1">
              <Label>Amount</Label>
              <Input
                type="number"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                {...form.register("amount")}
              />
            </div>

            {/* DATE */}
            <div className="md:col-span-1 w-[140px]">
              <Label>Date</Label>
              <Input
                type="date"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
                {...form.register("entry_date")}
              />
            </div>

            {/* SAVE / UPDATE BUTTON */}
            <div className="flex items-end md:col-span-1">
              <Button
                className="w-full h-10 bg-[#0A2A43] text-white font-semibold hover:bg-[#051A28]"
                onClick={form.handleSubmit(saveEntry)}
              >
                {editingId ? "Update" : "Save Entry"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABLE SECTION */}
      <Card className="w-full border border-gray-300 shadow-sm">
        <CardHeader className="py-2 px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <CardTitle className="text-xl font-bold">Cashbook Entries</CardTitle>

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
                  <TableHead className="w-[150px] border-r">Date</TableHead>
                  <TableHead className="w-[220px] border-r">Account</TableHead>
                  <TableHead className="w-[200px] border-r">Detail</TableHead>
                  <TableHead className="text-right w-[130px] border-r">Credit</TableHead>
                  <TableHead className="text-right w-[130px] border-r">Debit</TableHead>
                  <TableHead className="text-right w-[150px] border-r">Account Balance</TableHead>
                  <TableHead className="text-center w-[120px]">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {entries
                  .filter((e) =>
                    e.account_name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <TableCell>
                        {entry.date?.toDate().toISOString().split("T")[0]}
                      </TableCell>

                      <TableCell className="truncate">{entry.account_name}</TableCell>

                      <TableCell className="truncate">
                        {entry.payment_details || "-"}
                      </TableCell>

                      <TableCell className="text-right text-green-600">
                        {entry.type === "CREDIT" ? entry.amount : "-"}
                      </TableCell>

                      <TableCell className="text-right text-red-600">
                        {entry.type === "DEBIT" ? entry.amount : "-"}
                      </TableCell>

                      <TableCell className="text-right">
                      {entry.balance_after?.toLocaleString() || 0}
                    </TableCell>


                      <TableCell className="text-center flex justify-center gap-2">
                        <Button
                          size="sm"
                          className="bg-[#0A2A43] text-white"
                          onClick={() => handleEdit(entry)}
                        >
                          <Pencil size={14} />
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteEntry(entry.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* FOOTER TOTAL */}
        <div className="border-t p-4 bg-gray-100 flex justify-between font-bold text-lg">
          <span>CASH IN HAND:</span>
          <span className={cashInHand >= 0 ? "text-green-600" : "text-red-600"}>
            {cashInHand}
          </span>
        </div>
      </Card>
    </div>
  );
}
