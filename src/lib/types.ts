export interface Account {
  id: string;
  account_name: string;
  sub_head: string;
  balance_status: "CREDIT" | "DEBIT";
  opening_balance: number;
  current_balance?: number;
  cell_no?: string;
  ntn_number?: string;
  address?: string;
  is_active: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  created_at?: any;
  search_keywords?: string[];
}

export interface CashEntry {
  id: string;
  account_id: string;
  account_name: string;
  payment_details?: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  date: any;
  balance_after?: number;
  remarks?: string;
}

export interface ImportEntry {
  id: string;
  account_id: string;
  account_name: string;
  supplier: string;
  bags_qty: number;
  weight_per_bag: number;
  rate_per_kg: number;
  total_weight: number;
  amount: number;
  vehicle_numbers?: string;
  grn_no?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entry_date: any;
  invoice_no: string;
}

export interface ExportEntry {
  id: string;
  account_id: string;
  account_name: string;
  product: string;
  bags_qty: number;
  weight_per_bag: number;
  rate_per_kg: number;
  total_weight: number;
  amount: number;
  vehicle_numbers?: string;
  gd_no?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entry_date: any;
  invoice_no: string;
}
