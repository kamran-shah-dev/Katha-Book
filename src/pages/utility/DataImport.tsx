// import { useState } from 'react';
// import { supabase } from '@/integrations/supabase/client';
// import { useAuth } from '@/hooks/useAuth';
// import { useToast } from '@/hooks/use-toast';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

// interface ImportResult {
//   success: number;
//   failed: number;
//   errors: string[];
// }

// export default function DataImport() {
//   const [importing, setImporting] = useState(false);
//   const [result, setResult] = useState<ImportResult | null>(null);
//   const { user } = useAuth();
//   const { toast } = useToast();

//   const parseCSV = (text: string): string[][] => {
//     const lines = text.split('\n').filter(line => line.trim());
//     return lines.map(line => {
//       const values: string[] = [];
//       let current = '';
//       let inQuotes = false;
      
//       for (const char of line) {
//         if (char === '"') {
//           inQuotes = !inQuotes;
//         } else if (char === ',' && !inQuotes) {
//           values.push(current.trim());
//           current = '';
//         } else {
//           current += char;
//         }
//       }
//       values.push(current.trim());
//       return values;
//     });
//   };

//   const importAccounts = async (file: File) => {
//     if (!user) return;
//     setImporting(true);
//     setResult(null);

//     try {
//       const text = await file.text();
//       const rows = parseCSV(text);
//       const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
//       const data = rows.slice(1);

//       let success = 0;
//       let failed = 0;
//       const errors: string[] = [];

//       for (let i = 0; i < data.length; i++) {
//         const row = data[i];
//         try {
//           const accountName = row[headers.indexOf('account_name')] || row[0];
//           if (!accountName) continue;

//           const subHeadRaw = (row[headers.indexOf('sub_head')] || row[1] || 'PERSONALS').toUpperCase().replace(/\s+/g, '_');
//           const validSubHeads = ['BANKS', 'DOLLAR_LEDGERS', 'EXPORT_PARTIES', 'IMPORT_PARTIES', 'NLC_TAFTAN_EXPENSE_LEDGERS', 'PERSONALS'];
//           const subHead = validSubHeads.includes(subHeadRaw) ? subHeadRaw : 'PERSONALS';

//           const balanceStatusRaw = (row[headers.indexOf('balance_status')] || row[2] || 'DEBIT').toUpperCase();
//           const balanceStatus = balanceStatusRaw === 'CREDIT' ? 'CREDIT' : 'DEBIT';

//           const openingBalance = parseFloat(row[headers.indexOf('opening_balance')] || row[3] || '0') || 0;
//           const address = row[headers.indexOf('address')] || row[4] || null;
//           const cellNo = row[headers.indexOf('cell_no')] || row[5] || null;

//           const { error } = await supabase.from('accounts').insert({
//             user_id: user.id,
//             account_name: accountName,
//             sub_head: subHead as any,
//             balance_status: balanceStatus as any,
//             opening_balance: openingBalance,
//             address,
//             cell_no: cellNo,
//           });

//           if (error) throw error;
//           success++;
//         } catch (err: any) {
//           failed++;
//           errors.push(`Row ${i + 2}: ${err.message}`);
//         }
//       }

//       setResult({ success, failed, errors });
//       toast({ 
//         title: 'Import Complete', 
//         description: `${success} accounts imported, ${failed} failed` 
//       });
//     } catch (error: any) {
//       toast({ title: 'Error', description: error.message, variant: 'destructive' });
//     } finally {
//       setImporting(false);
//     }
//   };

//   const importProducts = async (file: File) => {
//     if (!user) return;
//     setImporting(true);
//     setResult(null);

//     try {
//       const text = await file.text();
//       const rows = parseCSV(text);
//       const data = rows.slice(1);

//       let success = 0;
//       let failed = 0;
//       const errors: string[] = [];

//       for (let i = 0; i < data.length; i++) {
//         const row = data[i];
//         try {
//           const name = row[0];
//           if (!name) continue;

//           const { error } = await supabase.from('products').insert({
//             user_id: user.id,
//             name: name,
//             description: row[1] || null,
//           });

//           if (error) throw error;
//           success++;
//         } catch (err: any) {
//           failed++;
//           errors.push(`Row ${i + 2}: ${err.message}`);
//         }
//       }

//       setResult({ success, failed, errors });
//       toast({ title: 'Import Complete', description: `${success} products imported` });
//     } catch (error: any) {
//       toast({ title: 'Error', description: error.message, variant: 'destructive' });
//     } finally {
//       setImporting(false);
//     }
//   };

//   const importVehicles = async (file: File) => {
//     if (!user) return;
//     setImporting(true);
//     setResult(null);

//     try {
//       const text = await file.text();
//       const rows = parseCSV(text);
//       const data = rows.slice(1);

//       let success = 0;
//       let failed = 0;
//       const errors: string[] = [];

//       for (let i = 0; i < data.length; i++) {
//         const row = data[i];
//         try {
//           const vehicleNo = row[0];
//           if (!vehicleNo) continue;

//           const { error } = await supabase.from('vehicles').insert({
//             user_id: user.id,
//             vehicle_no: vehicleNo,
//             description: row[1] || null,
//           });

//           if (error) throw error;
//           success++;
//         } catch (err: any) {
//           failed++;
//           errors.push(`Row ${i + 2}: ${err.message}`);
//         }
//       }

//       setResult({ success, failed, errors });
//       toast({ title: 'Import Complete', description: `${success} vehicles imported` });
//     } catch (error: any) {
//       toast({ title: 'Error', description: error.message, variant: 'destructive' });
//     } finally {
//       setImporting(false);
//     }
//   };

//   const handleFileChange = (type: 'accounts' | 'products' | 'vehicles') => (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (type === 'accounts') importAccounts(file);
//     else if (type === 'products') importProducts(file);
//     else if (type === 'vehicles') importVehicles(file);
//   };

//   return (
//     <div className="space-y-4">
//       <h1 className="text-2xl font-bold">Data Import</h1>
      
//       <Tabs defaultValue="accounts">
//         <TabsList>
//           <TabsTrigger value="accounts">Accounts</TabsTrigger>
//           <TabsTrigger value="products">Products</TabsTrigger>
//           <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
//         </TabsList>

//         <TabsContent value="accounts">
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <FileSpreadsheet className="h-5 w-5" /> Import Accounts
//               </CardTitle>
//               <CardDescription>
//                 Upload a CSV file with columns: account_name, sub_head, balance_status, opening_balance, address, cell_no
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="border-2 border-dashed rounded-lg p-8 text-center">
//                 <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
//                 <Label htmlFor="accounts-file" className="cursor-pointer">
//                   <span className="text-primary hover:underline">Click to upload</span> or drag and drop
//                   <p className="text-sm text-muted-foreground mt-1">CSV files only</p>
//                 </Label>
//                 <Input 
//                   id="accounts-file" 
//                   type="file" 
//                   accept=".csv"
//                   className="hidden"
//                   onChange={handleFileChange('accounts')}
//                   disabled={importing}
//                 />
//               </div>
//               <div className="text-sm text-muted-foreground">
//                 <p className="font-medium mb-2">Valid Sub Heads:</p>
//                 <p>BANKS, DOLLAR_LEDGERS, EXPORT_PARTIES, IMPORT_PARTIES, NLC_TAFTAN_EXPENSE_LEDGERS, PERSONALS</p>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="products">
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <FileSpreadsheet className="h-5 w-5" /> Import Products
//               </CardTitle>
//               <CardDescription>
//                 Upload a CSV file with columns: name, description
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="border-2 border-dashed rounded-lg p-8 text-center">
//                 <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
//                 <Label htmlFor="products-file" className="cursor-pointer">
//                   <span className="text-primary hover:underline">Click to upload</span>
//                 </Label>
//                 <Input 
//                   id="products-file" 
//                   type="file" 
//                   accept=".csv"
//                   className="hidden"
//                   onChange={handleFileChange('products')}
//                   disabled={importing}
//                 />
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="vehicles">
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <FileSpreadsheet className="h-5 w-5" /> Import Vehicles
//               </CardTitle>
//               <CardDescription>
//                 Upload a CSV file with columns: vehicle_no, description
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="border-2 border-dashed rounded-lg p-8 text-center">
//                 <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
//                 <Label htmlFor="vehicles-file" className="cursor-pointer">
//                   <span className="text-primary hover:underline">Click to upload</span>
//                 </Label>
//                 <Input 
//                   id="vehicles-file" 
//                   type="file" 
//                   accept=".csv"
//                   className="hidden"
//                   onChange={handleFileChange('vehicles')}
//                   disabled={importing}
//                 />
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>

//       {importing && (
//         <Card>
//           <CardContent className="py-6 text-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
//             <p>Importing data...</p>
//           </CardContent>
//         </Card>
//       )}

//       {result && (
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               {result.failed === 0 ? (
//                 <CheckCircle2 className="h-5 w-5 text-green-600" />
//               ) : (
//                 <AlertCircle className="h-5 w-5 text-yellow-600" />
//               )}
//               Import Results
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="flex gap-6 mb-4">
//               <div className="text-center">
//                 <p className="text-3xl font-bold text-green-600">{result.success}</p>
//                 <p className="text-sm text-muted-foreground">Successful</p>
//               </div>
//               <div className="text-center">
//                 <p className="text-3xl font-bold text-red-600">{result.failed}</p>
//                 <p className="text-sm text-muted-foreground">Failed</p>
//               </div>
//             </div>
//             {result.errors.length > 0 && (
//               <div className="bg-destructive/10 p-3 rounded-md max-h-40 overflow-auto">
//                 <p className="font-medium text-sm mb-2">Errors:</p>
//                 {result.errors.map((err, i) => (
//                   <p key={i} className="text-sm text-destructive">{err}</p>
//                 ))}
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }
