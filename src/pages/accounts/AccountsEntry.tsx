import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

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

import { Trash2, Pencil } from 'lucide-react';


// -----------------------------
// VALIDATION SCHEMA
// -----------------------------
const accountSchema = z.object({
  account_name: z.string().min(1),
  sub_head: z.enum([
    "BANKS",
    "DOLLAR_LEDGERS",
    "EXPORT_PARTIES",
    "IMPORT_PARTIES",
    "NLC_TAFTAN_EXPENSE_LEDGERS",
    "PERSONALS"
  ]),
  balance_status: z.enum(["CREDIT", "DEBIT"]),
  opening_balance: z.coerce.number(),
  ntn_number: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  cell_no: z.string().min(11).max(11),
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
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { toast } = useToast();

  // -----------------------------
  // FORM
  // -----------------------------

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


  // -----------------------------
  // ADD ACCOUNT
  // -----------------------------
  const onSubmit = (data: AccountFormData) => {
    if (editingId) {
      updateAccount(editingId, data);
      return;
    }

    const newAcc = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    setAccounts(prev => [...prev, newAcc]);
    form.reset();

    toast({ title: "Success", description: "Account added (demo mode)" });
  };


  // -----------------------------
  // DELETE ACCOUNT
  // -----------------------------
  const deleteAccount = (id: string) => {
    if (!confirm("Delete this account?")) return;

    setAccounts(prev => prev.filter(acc => acc.id !== id));

    toast({ title: "Removed", description: "Account deleted (demo mode)" });
  };


  // -----------------------------
  // LOAD ACCOUNT INTO FORM (EDIT)
  // -----------------------------
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


  // -----------------------------
  // UPDATE ACCOUNT
  // -----------------------------
  const updateAccount = (id: string, data: AccountFormData) => {
    setAccounts(prev =>
      prev.map(acc =>
        acc.id === id
          ? { ...acc, ...data }
          : acc
      )
    );

    setEditingId(null);
    form.reset();

    toast({ title: "Updated", description: "Account updated (demo mode)" });
  };


  return (
    <div className="space-y-6">

      {/* FORM CARD */}
      <Card className="w-full bg-gray-300 border border-gray-400 shadow-sm">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-xl font-bold">
            {editingId ? "Update Account" : "Create Account"}
          </CardTitle>
        </CardHeader>

        <CardContent className="bg-gray-300 py-4 px-4 space-y-3">

          {/* ROW 1 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

            {/* NAME */}
            <div>
              <Label>
                Account Name <span className="text-red-600">*</span>
              </Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("account_name")}
              />
            </div>

            {/* HEAD */}
            <div>
              <Label>Head <span className="text-red-600">*</span></Label>
              <Select
                value={form.watch("sub_head")}
                onValueChange={(v) => form.setValue("sub_head", v)}
              >
                <SelectTrigger className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subHeadOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* TYPE */}
            <div>
              <Label>Type <span className="text-red-600">*</span></Label>
              <Select
                value={form.watch("balance_status")}
                onValueChange={(v) => form.setValue("balance_status", v)}
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

            {/* OPENING BALANCE */}
            <div>
              <Label>Opening Balance <span className="text-red-600">*</span></Label>
              <Input
                type="number"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("opening_balance")}
              />
            </div>

            {/* CELL NO */}
            <div>
              <Label>Cell No <span className="text-red-600">*</span></Label>
              <Input
                maxLength={11}
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("cell_no")}
              />
            </div>

          </div>

          {/* ROW 2 FIXED */}
          <div className="flex flex-col md:flex-row gap-3 w-full">

            {/* NTN */}
            <div className="flex-1">
              <Label>NTN Number (Optional)</Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("ntn_number")}
              />
            </div>

            {/* STATUS SMALL WIDTH */}
            <div className="w-[120px]">
              <Label>Status</Label>
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

            {/* ADDRESS FLEXES TO FILL SPACE */}
            <div className="flex-1">
              <Label>Address</Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("address")}
              />
            </div>

            {/* BUTTON STAYS IN SAME ROW RIGHT ALIGNED */}
            <div className="flex items-end">
              <Button
                className="h-10 bg-[#0A2A43] text-white font-semibold hover:bg-[#051A28]"
                onClick={editingId ? form.handleSubmit(updateEntry) : form.handleSubmit(onSubmit)}
              >
                {editingId ? "Update" : "Save"}
              </Button>
            </div>

          </div>



        </CardContent>
      </Card>


      {/* TABLE CARD */}
      <Card className="w-full border border-gray-300 shadow-sm">

        <CardHeader className="py-2 px-4">
          <CardTitle className="text-xl font-bold">Account List</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <Table className="w-full text-sm">

              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead>Name</TableHead>
                  <TableHead>Head</TableHead>
                  <TableHead>Opening Balance</TableHead>
                  <TableHead>Cell No</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {accounts.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-4">No accounts</TableCell></TableRow>
                ) : accounts.map(acc => (
                  <TableRow key={acc.id} className="hover:bg-gray-50">

                    <TableCell>{acc.account_name}</TableCell>
                    <TableCell>{acc.sub_head}</TableCell>
                    <TableCell>{acc.opening_balance}</TableCell>
                    <TableCell>{acc.cell_no}</TableCell>

                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        acc.is_active ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                      }`}>
                        {acc.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>

                    <TableCell className="text-center flex justify-center gap-2">

                      <Button
                        size="sm"
                        className="bg-[#0A2A43] text-white"
                        onClick={() => handleEdit(acc)}
                      >
                        <Pencil size={14} />
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteAccount(acc.id)}
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

      </Card>

    </div>
  );
}
