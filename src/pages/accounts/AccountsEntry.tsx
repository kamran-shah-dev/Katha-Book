import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Save, RefreshCw, Trash2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Account = Database['public']['Tables']['accounts']['Row'];
type AccountSubHead = Database['public']['Enums']['account_sub_head_type'];
type BalanceStatus = Database['public']['Enums']['balance_status_type'];
type LimitStatus = Database['public']['Enums']['limit_status_type'];

const subHeadOptions: { value: AccountSubHead; label: string }[] = [
  { value: 'BANKS', label: 'BANKS' },
  { value: 'DOLLAR_LEDGERS', label: 'DOLLAR LEDGERS' },
  { value: 'EXPORT_PARTIES', label: 'EXPORT PARTIES' },
  { value: 'IMPORT_PARTIES', label: 'IMPORT PARTIES' },
  { value: 'NLC_TAFTAN_EXPENSE_LEDGERS', label: 'NLC / TAFTAN EXPENSE LEDGERS' },
  { value: 'PERSONALS', label: 'PERSONALS' },
];

const accountSchema = z.object({
  account_name: z.string().min(1, 'Account name is required').max(100),
  sub_head: z.enum(['BANKS', 'DOLLAR_LEDGERS', 'EXPORT_PARTIES', 'IMPORT_PARTIES', 'NLC_TAFTAN_EXPENSE_LEDGERS', 'PERSONALS']),
  balance_status: z.enum(['CREDIT', 'DEBIT']),
  opening_balance: z.coerce.number().min(0),
  ntn_number: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  cell_no: z
  .string()
  .min(11, "Cell number must be 11 digits")
  .max(11, "Cell number cannot be more than 11 digits"),
  is_active: z.boolean(),
});

type AccountFormData = z.infer<typeof accountSchema>;

export default function AccountsEntry() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      account_name: "",
      sub_head: "PERSONALS",
      balance_status: "DEBIT",
      opening_balance: 0,
      address: "",
      cell_no: "",
      ntn_number: "", 
      is_active: true,
    },
  });

  /** FETCH ACCOUNTS */
  const fetchAccounts = () => {
  // DEMO: start empty
  setAccounts([]);
  setLoading(false);
};



  useEffect(() => {
  fetchAccounts();
}, []);

  /** SAVE HANDLER */
  const onSubmit = (data: any) => {
  const newAcc = {
    ...data,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };

  setAccounts(prev => [...prev, newAcc]);
  form.reset();

  toast({
    title: "Success",
    description: "Account added (demo mode)",
  });
};



  /** DELETE HANDLER */
  const deleteAccount = (id: string) => {
  if (!confirm("Delete this account?")) return;

  setAccounts(prev => prev.filter(acc => acc.id !== id));

  toast({
    title: "Removed",
    description: "Account deleted (demo mode)",
  });
};



  return (
    <div className="space-y-6">

      {/* FORM SECTION */}
      <Card className="w-full bg-gray-300 border border-gray-400 shadow-sm">

        <CardHeader className="py-2 px-4">
          <CardTitle className="text-xl font-bold">Create Account</CardTitle>
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
                placeholder="Enter account name"
                {...form.register("account_name", { required: "Account name is required" })}
              />

              {form.formState.errors.account_name && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.account_name.message}
                </p>
              )}
            </div>


            {/* SUB HEAD */}
            <div>
              <Label>
                Sub Head <span className="text-red-600">*</span>
              </Label>

              <Select
                value={form.watch("sub_head")}
                onValueChange={(v) => form.setValue("sub_head", v, { shouldValidate: true })}
              >
                <SelectTrigger className="h-9 border-2 border-black rounded-md focus:border-black focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subHeadOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {form.formState.errors.sub_head && (
                <p className="text-sm text-red-600">Sub head is required</p>
              )}
            </div>


            {/* TYPE */}
            <div>
              <Label>
                Type <span className="text-red-600">*</span>
              </Label>

              <Select
                value={form.watch("balance_status")}
                onValueChange={(v) => form.setValue("balance_status", v, { shouldValidate: true })}
              >
                <SelectTrigger className="h-9 border-2 border-black rounded-md focus:border-black focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT">Credit</SelectItem>
                  <SelectItem value="DEBIT">Debit</SelectItem>
                </SelectContent>
              </Select>

              {form.formState.errors.balance_status && (
                <p className="text-sm text-red-600">Type is required</p>
              )}
            </div>


            {/* BALANCE */}
            <div>
              <Label>
                Opening Balance <span className="text-red-600">*</span>
              </Label>

              <Input
                type="number"
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("opening_balance", { required: "Opening balance is required" })}
              />

              {form.formState.errors.opening_balance && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.opening_balance.message}
                </p>
              )}
            </div>


            {/* CELL NO */}
            <div>
              <Label>
                Cell No <span className="text-red-600">*</span>
              </Label>

              <Input
                placeholder="0312xxxxxxx"
                maxLength={11}
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 11);
                }}
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...form.register("cell_no")}
              />


              {form.formState.errors.cell_no && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.cell_no.message}
                </p>
              )}
            </div>


          </div>

          {/* ROW 2 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

            

            {/* NTNT NUMBER - 20% */}
            <div>
              <Label>NTN Number (Optional)</Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Enter NTN"
                {...form.register("ntn_number")}
              />
            </div>

            {/* ADDRESS - 65% */}
            <div className="md:col-span-2">
              <Label>Address</Label>
              <Input
                className="h-9 border-2 border-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Enter address"
                {...form.register("address")}
              />
            </div>

            {/* SAVE BUTTON - 15% */}
            <div className="flex items-end">
              <Button
                className="w-full h-10 bg-[#0A2A43] text-white font-semibold hover:bg-[#051A28]"
                onClick={form.handleSubmit(onSubmit)}
              >
                Save Account
              </Button>
            </div>

          </div>


        </CardContent>

      </Card>


      {/* TABLE SECTION */}
      <Card className="w-full border border-gray-300 shadow-sm">
        <CardHeader className="py-2 px-4"> 
          <div className="flex justify-between items-center">

            {/* Left side: Title + Search */}
            <div className="flex items-center gap-4">
              <CardTitle className="text-xl font-bold">Account List</CardTitle>

              {/* SEARCH BAR (UI Only) */}
              <Input
                type="text"
                placeholder="Search accounts..."
                className="h-9 w-60 border border-gray-400"
              />
            </div>

            {/* Right side: Refresh */}
            <Button variant="outline" size="sm" onClick={fetchAccounts}>
              Refresh
            </Button>

          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="bg-gray-100 border-b border-gray-300">
                  <TableHead className="border-r w-[220px]">Name</TableHead>
                  <TableHead className="border-r w-[160px]">Sub Head</TableHead>
                  <TableHead className="border-r text-center w-[140px]">
                    Opening (Cr/Dr)
                  </TableHead>
                  <TableHead className="border-r text-center w-[160px]">
                    Current Balance
                  </TableHead>
                  <TableHead className="border-r w-[150px]">Cell</TableHead>
                  <TableHead className="border-r text-center w-[120px]">Status</TableHead>
                  <TableHead className="text-center w-[80px]">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                      No accounts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.map((acc) => {
                    const opening = Number(acc.opening_balance).toLocaleString();
                    const type = acc.balance_status === "CREDIT" ? "PKR" : "PKR";
                    const currentBalance = opening + " " + type;

                    return (
                      <TableRow
                        key={acc.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition"
                      >
                        <TableCell className="border-r truncate max-w-[200px]">
                          {acc.account_name}
                        </TableCell>

                        <TableCell className="border-r truncate max-w-[140px]">
                          {acc.sub_head}
                        </TableCell>

                        <TableCell className="border-r text-center font-semibold text-blue-800">
                          {opening} {type}
                        </TableCell>

                        <TableCell className="border-r text-center font-semibold text-green-700">
                          {currentBalance}
                        </TableCell>

                        <TableCell className="border-r truncate max-w-[140px]">
                          {acc.cell_no || "-"}
                        </TableCell>

                        <TableCell className="border-r text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              acc.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {acc.is_active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>

                        <TableCell className="text-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteAccount(acc.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>




    </div>
  );

}

