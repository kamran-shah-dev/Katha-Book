-- Create account sub heads enum type
CREATE TYPE public.account_sub_head_type AS ENUM (
  'BANKS',
  'DOLLAR_LEDGERS',
  'EXPORT_PARTIES',
  'IMPORT_PARTIES',
  'NLC_TAFTAN_EXPENSE_LEDGERS',
  'PERSONALS'
);

-- Create balance status enum type
CREATE TYPE public.balance_status_type AS ENUM ('CREDIT', 'DEBIT');

-- Create limit status enum type
CREATE TYPE public.limit_status_type AS ENUM ('UNLIMITED', 'LIMITED');

-- Create profiles table for single owner
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create accounts table (Katha accounts)
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  sub_head account_sub_head_type NOT NULL DEFAULT 'PERSONALS',
  balance_status balance_status_type NOT NULL DEFAULT 'DEBIT',
  opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  address TEXT,
  cell_no TEXT,
  limit_status limit_status_type NOT NULL DEFAULT 'UNLIMITED',
  limit_amount DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_no TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cashbook entries table (insert-only accounting)
CREATE TABLE public.cashbook_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_detail TEXT,
  pay_status balance_status_type NOT NULL DEFAULT 'DEBIT',
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  remarks TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create goods received table
CREATE TABLE public.goods_received (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  serial_no SERIAL,
  shipment TEXT DEFAULT 'TAFTAN',
  account_id UUID REFERENCES public.accounts(id),
  product_id UUID REFERENCES public.products(id),
  gd_no TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_weight DECIMAL(15,3) DEFAULT 0,
  net_weight DECIMAL(15,3) DEFAULT 0,
  custom_tax DECIMAL(15,2) DEFAULT 0,
  challan_difference DECIMAL(15,2) DEFAULT 0,
  port_expenses DECIMAL(15,2) DEFAULT 0,
  commission DECIMAL(15,2) DEFAULT 0,
  nlc_difference DECIMAL(15,2) DEFAULT 0,
  taftan_difference DECIMAL(15,2) DEFAULT 0,
  expense_name TEXT,
  expense_amount DECIMAL(15,2) DEFAULT 0,
  vehicle_no TEXT,
  remarks TEXT,
  total_amount DECIMAL(15,2) DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create export entries table
CREATE TABLE public.export_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_no SERIAL,
  account_id UUID REFERENCES public.accounts(id),
  product_id UUID REFERENCES public.products(id),
  vehicle_numbers TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  gd_no TEXT,
  bags_qty INTEGER DEFAULT 0,
  weight_per_bag DECIMAL(10,3) DEFAULT 0,
  total_weight DECIMAL(15,3) DEFAULT 0,
  rate_per_kg DECIMAL(10,2) DEFAULT 0,
  amount DECIMAL(15,2) DEFAULT 0,
  remarks TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_no SERIAL,
  account_id UUID REFERENCES public.accounts(id),
  gd_no TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vehicle_numbers TEXT,
  total_amount DECIMAL(15,2) DEFAULT 0,
  net_pay DECIMAL(15,2) DEFAULT 0,
  remarks TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice items table
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT,
  bags_qty INTEGER DEFAULT 0,
  weight_per_bag DECIMAL(10,3) DEFAULT 0,
  total_weight DECIMAL(15,3) DEFAULT 0,
  rate_per_kg DECIMAL(10,2) DEFAULT 0,
  amount DECIMAL(15,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ledger entries table (for tracking all transactions)
CREATE TABLE public.ledger_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  detail TEXT,
  reference_type TEXT, -- 'CASHBOOK', 'GOODS_RECEIVED', 'EXPORT', 'INVOICE'
  reference_id UUID,
  credit_amount DECIMAL(15,2) DEFAULT 0,
  debit_amount DECIMAL(15,2) DEFAULT 0,
  remarks TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_received ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for accounts
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for products
CREATE POLICY "Users can view own products" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON public.products FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for vehicles
CREATE POLICY "Users can view own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vehicles" ON public.vehicles FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for cashbook_entries
CREATE POLICY "Users can view own cashbook entries" ON public.cashbook_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cashbook entries" ON public.cashbook_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cashbook entries" ON public.cashbook_entries FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for goods_received
CREATE POLICY "Users can view own goods received" ON public.goods_received FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goods received" ON public.goods_received FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goods received" ON public.goods_received FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for export_entries
CREATE POLICY "Users can view own export entries" ON public.export_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own export entries" ON public.export_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own export entries" ON public.export_entries FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for invoices
CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for invoice_items (based on invoice ownership)
CREATE POLICY "Users can view own invoice items" ON public.invoice_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can insert own invoice items" ON public.invoice_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can update own invoice items" ON public.invoice_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can delete own invoice items" ON public.invoice_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));

-- Create RLS policies for ledger_entries
CREATE POLICY "Users can view own ledger entries" ON public.ledger_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ledger entries" ON public.ledger_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ledger entries" ON public.ledger_entries FOR UPDATE USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_goods_received_updated_at BEFORE UPDATE ON public.goods_received FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_export_entries_updated_at BEFORE UPDATE ON public.export_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_sub_head ON public.accounts(sub_head);
CREATE INDEX idx_cashbook_entries_user_id ON public.cashbook_entries(user_id);
CREATE INDEX idx_cashbook_entries_account_id ON public.cashbook_entries(account_id);
CREATE INDEX idx_cashbook_entries_entry_date ON public.cashbook_entries(entry_date);
CREATE INDEX idx_goods_received_user_id ON public.goods_received(user_id);
CREATE INDEX idx_goods_received_gd_no ON public.goods_received(gd_no);
CREATE INDEX idx_export_entries_user_id ON public.export_entries(user_id);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_ledger_entries_account_id ON public.ledger_entries(account_id);
CREATE INDEX idx_ledger_entries_entry_date ON public.ledger_entries(entry_date);