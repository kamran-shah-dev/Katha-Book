import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  createAccount,
  updateAccount as updateAccountService,
  deleteAccount as deleteAccountService,
  listenAccounts,
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


const normalizeName = (v: string) => v.trim().toLowerCase();

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
    "Company"
  ]),
  balance_status: z.enum(["CREDIT", "DEBIT"]),
  opening_balance: z.coerce.number().min(0, "Opening balance required"),
  ntn_number: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  cell_no: z
  .string()
  .optional()
  .refine(
    v => !v || /^[0-9]{10}$/.test(v),
    "Enter 10 digit Pakistani number"
  ),
  is_active: z.boolean(),
});

type AccountFormData = z.infer<typeof accountSchema>;


const subHeadOptions = [
  { value: "BANKS", label: "BANKS" },
  { value: "DOLLAR_LEDGERS", label: "DOLLAR LEDGERS" },
  { value: "EXPORT_PARTIES", label: "EXPORT PARTIES" },
  { value: "IMPORT_PARTIES", label: "IMPORT PARTIES" },
  { value: "NLC_TAFTAN_EXPENSE_LEDGERS", label: "NLC / TAFTAN EXPENSE LEDGERS" },
  { value: "Company", label: "COMPANY" },
];


export default function AccountsEntry() {

  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);


 useEffect(() => {
  const unsubscribe = listenAccounts(setAccounts);
  return () => unsubscribe();
}, []);


  

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      account_name: "",
      sub_head: "Company",
      balance_status: "DEBIT",
      opening_balance: undefined,
      address: "",
      cell_no: "",
      ntn_number: "",
      is_active: true
    },
  });

  const { errors } = form.formState;

  // -------------------------------------
  // SAVE OR UPDATE ACCOUNT
  // -------------------------------------
  const onSubmit = async (data: AccountFormData) => {
    // 🔒 UNIQUE NAME CHECK
    const alreadyExists = accounts.some(acc =>
      normalizeName(acc.account_name) === normalizeName(data.account_name) &&
      acc.id !== editingId
    );

    if (alreadyExists) {
      form.setError("account_name", {
        type: "manual",
        message: "Account name already exists",
      });
      return;
    }

    try {
      if (editingId) {
        await updateAccountService(editingId, data);
      } else {
        await createAccount(data);
      }

      form.reset();
      setEditingId(null);
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
              <Label className="text-sm">Head *</Label>
              <Select
                value={form.watch("sub_head")}
                onValueChange={(v) => form.setValue("sub_head", v as AccountFormData["sub_head"])}
              >
                <SelectTrigger className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
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
              <Label className="text-sm">Account Name *</Label>
              <Input
                placeholder="Enter account name"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("account_name")}
              />
              {/* 🔴 SMALL ERROR MESSAGE */}
                {errors.account_name && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.account_name.message}
                  </p>
                )}
            </div>

            

            <div>
              <Label className="text-sm">Type *</Label>
              <Select
                value={form.watch("balance_status")}
                onValueChange={(v) => form.setValue("balance_status", v as "CREDIT" | "DEBIT")}
              >
                <SelectTrigger className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
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
                placeholder=""
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("opening_balance")}
              />
            </div>

            <div>
              <Label className="text-sm">Cell No</Label>

              <div className="flex h-9 border-2 border-black rounded-md overflow-hidden">
                
                {/* Fixed country code */}
                <div className="flex items-center px-3 bg-gray-200 text-sm font-semibold">
                  +92
                </div>

                {/* User input */}
                <input
                  type="text"
                  placeholder="3012345678"
                  className="flex-1 px-3 outline-none text-sm"
                  maxLength={10}
                  {...form.register("cell_no")}
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                  }}
                />
              </div>
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

            <div className="flex-1">
              <Label className="text-sm">Address</Label>
              <Input
                placeholder="Enter address"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("address")}
              />
            </div>

            <div className="w-full sm:w-[120px]">
              <Label className="text-sm">Status</Label>
              <Select
                value={form.watch("is_active") ? "true" : "false"}
                onValueChange={(v) => form.setValue("is_active", v === "true")}
              >
                <SelectTrigger className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
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

      {/* TABLE/CARDS SECTION */}
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
            <Button variant="outline" size="sm" onClick={() => setSearch("")} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4" />
            </Button>

          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* MOBILE CARD VIEW (hidden on md and up) */}
          <div className="md:hidden max-h-[500px] overflow-y-auto p-3 space-y-3">
            {accounts.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No accounts found.
              </div>
            ) : (
              accounts.map((acc: any) => (
                <div key={acc.id} className="border border-gray-300 rounded-lg p-3 bg-white shadow-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Account Name</p>
                        <p className="font-semibold text-sm">{acc.account_name}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          acc.is_active ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                        }`}
                      >
                        {acc.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Head</p>
                        <p className="font-medium">{acc.sub_head}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="font-medium">{acc.balance_status}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Opening Balance</p>
                        <p className="font-medium">{acc.opening_balance.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cell</p>
                        <p className="font-medium">{acc.cell_no}</p>
                      </div>
                    </div>

                    {acc.ntn_number && (
                      <div>
                        <p className="text-xs text-gray-500">NTN Number</p>
                        <p className="text-sm font-medium">{acc.ntn_number}</p>
                      </div>
                    )}

                    {acc.address && (
                      <div>
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="text-sm">{acc.address}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        className="flex-1 bg-[#0A2A43] text-white font-semibold hover:bg-[#051A28]"
                        onClick={() => handleEdit(acc)}
                      >
                        <Pencil size={14} className="mr-1" />
                        Edit
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        className="px-4"
                        onClick={() => deleteAccount(acc.id)}
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
                  <TableHead className="border-r">Account Name</TableHead>
                  <TableHead className="border-r">Head</TableHead>
                  <TableHead className="border-r text-right">Opening</TableHead>
                  <TableHead className="border-r text-right">Cell</TableHead>
                  <TableHead className="border-r text-center">Status</TableHead>
                  <TableHead className="text-center">Action</TableHead>
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
                      <TableCell className="border-r">{acc.sub_head}</TableCell>
                      <TableCell className="border-r text-right">{acc.opening_balance.toLocaleString()}</TableCell>
                      <TableCell className="border-r text-right">{acc.cell_no}</TableCell>

                      <TableCell className="border-r text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            acc.is_active ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                          }`}
                        >
                          {acc.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            className="bg-[#0A2A43] text-white font-semibold hover:bg-[#051A28]"
                            onClick={() => handleEdit(acc)}
                          >
                            <Pencil size={14} className="mr-1" />
                            Edit
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
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