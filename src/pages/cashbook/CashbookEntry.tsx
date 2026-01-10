import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Trash2, RefreshCw } from "lucide-react";


// -------- HYBRID DEMO MODE SCHEMA ----------
const cashbookSchema = z.object({
  account_name: z.string().min(1, "Account is required"),
  payment_detail: z.string().optional(),
  pay_status: z.enum(["CREDIT", "DEBIT"]),
  amount: z.coerce.number().min(1),
  entry_date: z.string(),
  remarks: z.string().optional(),
});


export default function CashbookEntry() {

  // STATIC ACCOUNTS FOR DEMO
  const demoAccounts = [
    "AL-HAMD TRADERS",
    "BISMILLAH LOGISTICS",
    "USMAN EXPORTS",
    "AHMED CARGO SERVICES",
  ];

  const [entries, setEntries] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const form = useForm({
    resolver: zodResolver(cashbookSchema),
    defaultValues: {
      account_name: "",
      payment_detail: "",
      pay_status: "DEBIT",
      amount: 0,
      entry_date: new Date().toISOString().split("T")[0],
      remarks: "",
    },
  });

  // CALCULATE CASH IN HAND
  const cashInHand = entries.reduce((total, e) => {
    return e.pay_status === "CREDIT"
      ? total + Number(e.amount)
      : total - Number(e.amount);
  }, 0);


  // HANDLE SAVE ENTRY (LOCAL ONLY)
  const saveEntry = (data: any) => {
    const newEntry = {
      id: Date.now(),
      ...data,
    };

    setEntries([newEntry, ...entries]);
    form.reset({
      account_name: "",
      payment_detail: "",
      pay_status: "DEBIT",
      amount: 0,
      entry_date: new Date().toISOString().split("T")[0],
      remarks: "",
    });
  };


  // DELETE ROW LOCALLY
  const deleteEntry = (id: number) => {
    if (!confirm("Remove this entry?")) return;
    setEntries(entries.filter((e) => e.id !== id));
  };


  return (
    <div className="space-y-6">
      {/* FORM SECTION */}
      <Card className="w-full bg-gray-300 border border-gray-400 shadow-sm">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-xl font-bold">Cashbook Entry</CardTitle>
        </CardHeader>

        <CardContent className="bg-gray-300 py-4 px-4 space-y-3">

          {/* ROW 1 */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">

            {/* ACCOUNT NAME */}
            <div className="md:col-span-1">
              <Label>Account Name</Label>
              <Select
                value={form.watch("account_name")}
                onValueChange={(v) => form.setValue("account_name", v)}
              >
                <SelectTrigger className="h-9 border-2 border-black rounded-md focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {demoAccounts.map((acc) => (
                    <SelectItem key={acc} value={acc}>
                      {acc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* PAYMENT DETAIL */}
            <div className="md:col-span-1">
              <Label>Payment Detail</Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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
                <SelectTrigger className="h-9 border-2 border-black rounded-md focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
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
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("amount")}
              />
            </div>

            {/* DATE - Smaller width */}
            <div className="md:col-span-1 w-[140px]">
              <Label>Date</Label>
              <Input
                type="date"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("entry_date")}
              />
            </div>

            {/* SAVE BUTTON now in SAME ROW */}
            <div className="flex items-end md:col-span-1">
              <Button
                className="w-full h-10 bg-[#0A2A43] text-white font-semibold hover:bg-[#051A28]"
                onClick={form.handleSubmit(saveEntry)}
              >
                Save Entry
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
                  <TableHead className="text-center w-[80px]">Action</TableHead>
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
                      <TableCell>{entry.entry_date}</TableCell>
                      <TableCell className="truncate">{entry.account_name}</TableCell>
                      <TableCell className="truncate">
                        {entry.payment_detail || "-"}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {entry.pay_status === "CREDIT" ? entry.amount : "-"}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {entry.pay_status === "DEBIT" ? entry.amount : "-"}
                      </TableCell>
                      <TableCell className="text-center">
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


        {/* CASH IN HAND FOOTER */}
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
