import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  createAccount,
  updateAccount as updateAccountService,
  deleteAccount as deleteAccountService,
  fetchAccounts,
  searchAccounts
} from "@/services/accounts.services";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from '@/components/ui/table';

import { Trash2, Pencil, RefreshCw } from 'lucide-react';


// -----------------------------
// VALIDATION SCHEMA
// -----------------------------
const accountSchema = z.object({
  account_name: z.string().min(1, "Account name is required"),
  sub_head: z.enum([
    "BANKS",
    "DOLLAR_LEDGERS",
    "EXPORT_PARTIES",
    "IMPORT_PARTIES",
    "NLC_TAFTAN_EXPENSE_LEDGERS",
    "PERSONALS"
  ]),
  balance_status: z.enum(["CREDIT", "DEBIT"]),
  opening_balance: z.coerce.number().min(0, "Opening balance required"),
  ntn_number: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  cell_no: z
    .string()
    .min(11, "Cell number must be 11 digits")
    .max(11, "Cell number must be 11 digits"),
  is_active: z.boolean(),
});

type AccountFormData = z.infer<typeof accountSchema>;


const subHeadOptions = [
  { value: "BANKS", label: "BANKS" },
  { value: "DOLLAR_LEDGERS", label: "DOLLAR LEDGERS" },
  { value: "EXPORT_PARTIES", label: "EXPORT PARTIES" },
  { value: "IMPORT_PARTIES", label: "IMPORT PARTIES" },
  { value: "NLC_TAFTAN_EXPENSE_LEDGERS", label: "NLC / TAFTAN EXPENSE LEDGERS" },
  { value: "PERSONALS", label: "PERSONALS" },
];


export default function AccountsEntry() {

  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);


  // Load Accounts from Firestore
  const loadAccounts = async () => {
    const data = await fetchAccounts();
    setAccounts(data);
  };

  useEffect(() => {
    loadAccounts();
  }, []);


  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      account_name: "",
      sub_head: "PERSONALS",
      balance_status: "DEBIT",
      opening_balance: 0,
      address: "",
      cell_no: "",
      ntn_number: "",
      is_active: true
    },
  });


  // -------------------------------------
  // SAVE OR UPDATE ACCOUNT
  // -------------------------------------
  const onSubmit = async (data: AccountFormData) => {
    try {
      if (editingId) {
        await updateAccountService(editingId, data);
      } else {
        await createAccount(data);
      }

      form.reset();
      setEditingId(null);
      loadAccounts();
    } catch (error) {
      console.error("Error saving account:", error);
    }
  };


  // -------------------------------------
  // DELETE ACCOUNT
  // -------------------------------------
  const deleteAccount = async (id: string) => {
    if (!confirm("Delete this account?")) return;

    await deleteAccountService(id);
    loadAccounts();
  };


  // -------------------------------------
  // EDIT ACCOUNT
  // -------------------------------------
  const handleEdit = (acc: any) => {
    setEditingId(acc.id);

    form.setValue("account_name", acc.account_name);
    form.setValue("sub_head", acc.sub_head);
    form.setValue("balance_status", acc.balance_status);
    form.setValue("opening_balance", acc.opening_balance);
    form.setValue("cell_no", acc.cell_no);
    form.setValue("ntn_number", acc.ntn_number || "");
    form.setValue("address", acc.address || "");
    form.setValue("is_active", acc.is_active);
  };


  // -------------------------------------
  // SEARCH ACCOUNTS IN FIRESTORE
  // -------------------------------------
  const handleSearch = async (value: string) => {
    setSearch(value);

    if (value.trim().length === 0) {
      loadAccounts();
      return;
    }

    const results = await searchAccounts(value);
    setAccounts(results);
  };


  return (
    <div className="space-y-6 px-2 sm:px-0">

      {/* FORM */}
      <Card className="w-full bg-gray-300 border border-gray-400 shadow-sm">
        <CardHeader className="py-2 px-3 sm:px-4">
          <CardTitle className="text-lg sm:text-xl font-bold">
            {editingId ? "Update Account" : "Create Account"}
          </CardTitle>
        </CardHeader>

        <CardContent className="bg-gray-300 py-3 sm:py-4 px-3 sm:px-4 space-y-3">

          {/* ROW 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">

            <div>
              <Label className="text-sm">Account Name *</Label>
              <Input
                placeholder="Enter account name"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("account_name")}
              />
            </div>

            <div>
              <Label className="text-sm">Head *</Label>
              <Select
                value={form.watch("sub_head")}
                onValueChange={(v) => form.setValue("sub_head", v as AccountFormData["sub_head"])}
              >
                <SelectTrigger className="h-9 border-2 border-black">
                  <SelectValue placeholder="Select head" />
                </SelectTrigger>
                <SelectContent>
                  {subHeadOptions.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Type *</Label>
              <Select
                value={form.watch("balance_status")}
                onValueChange={(v) => form.setValue("balance_status", v as "CREDIT" | "DEBIT")}
              >
                <SelectTrigger className="h-9 border-2 border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT">Credit</SelectItem>
                  <SelectItem value="DEBIT">Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Opening Balance *</Label>
              <Input
                type="number"
                placeholder="0"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("opening_balance")}
              />
            </div>

            <div>
              <Label className="text-sm">Cell No *</Label>
              <Input
                placeholder="03123456789"
                maxLength={11}
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("cell_no")}
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 11);
                }}
              />
            </div>

          </div>

          {/* ROW 2 */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">

            <div className="w-full sm:w-[200px]">
              <Label className="text-sm">NTN Number</Label>
              <Input
                placeholder="Optional"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("ntn_number")}
              />
            </div>

            <div className="w-full sm:w-[120px]">
              <Label className="text-sm">Status</Label>
              <Select
                value={form.watch("is_active") ? "true" : "false"}
                onValueChange={(v) => form.setValue("is_active", v === "true")}
              >
                <SelectTrigger className="h-9 border-2 border-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label className="text-sm">Address</Label>
              <Input
                placeholder="Enter address"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("address")}
              />
            </div>

            <div className="flex items-end w-full sm:w-[200px]">
              <Button
                className="w-full h-10 bg-[#0A2A43] text-white font-semibold"
                onClick={form.handleSubmit(onSubmit)}
              >
                {editingId ? "Update" : "Save"}
              </Button>
            </div>

          </div>

        </CardContent>
      </Card>

      {/* TABLE */}
      <Card className="w-full border border-gray-300 shadow-sm">
        <CardHeader className="py-2 px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

            {/* Title + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <CardTitle className="text-lg sm:text-xl font-bold">Account List</CardTitle>

              <Input
                type="text"
                placeholder="Search accounts..."
                className="h-9 border-2 border-black w-full sm:w-auto"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {/* Refresh */}
            <Button variant="outline" size="sm" onClick={() => loadAccounts()} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4" />
            </Button>

          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-x-auto overflow-y-auto">
            <Table className="w-full text-sm">

              <TableHeader>
                <TableRow className="bg-gray-100 border-b border-gray-300">
                  <TableHead className="border-r w-40 min-w-[120px]">Account Name</TableHead>
                  <TableHead className="border-r w-32 min-w-[100px] hidden sm:table-cell">Head</TableHead>
                  <TableHead className="border-r w-28 min-w-[80px] text-right hidden md:table-cell">Opening</TableHead>
                  <TableHead className="border-r w-28 min-w-[100px] text-right">Cell</TableHead>
                  <TableHead className="border-r w-24 min-w-[80px] text-center hidden lg:table-cell">Status</TableHead>
                  <TableHead className="text-center w-28 min-w-[120px]">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                      No accounts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.map((acc: any) => (
                    <TableRow key={acc.id} className="border-b hover:bg-gray-50">

                      <TableCell className="border-r">{acc.account_name}</TableCell>
                      <TableCell className="border-r hidden sm:table-cell">{acc.sub_head}</TableCell>
                      <TableCell className="border-r text-right hidden md:table-cell">{acc.opening_balance.toLocaleString()}</TableCell>
                      <TableCell className="border-r text-right">{acc.cell_no}</TableCell>

                      <TableCell className="border-r text-center hidden lg:table-cell">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            acc.is_active ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                          }`}
                        >
                          {acc.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex gap-1 sm:gap-2 justify-center">
                          <Button
                            size="sm"
                            className="bg-[#0A2A43] text-white font-semibold hover:bg-[#051A28] text-xs sm:text-sm px-2 sm:px-3"
                            onClick={() => handleEdit(acc)}
                          >
                            <Pencil size={14} className="sm:mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            className="px-2 sm:px-3"
                            onClick={() => deleteAccount(acc.id)}
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