
-- Enum types
CREATE TYPE public.account_type AS ENUM ('checking', 'savings', 'investment', 'cash');
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
CREATE TYPE public.investment_type AS ENUM ('fii', 'stock', 'fund', 'fixed_income');
CREATE TYPE public.return_type AS ENUM ('dividend', 'interest', 'rent');
CREATE TYPE public.sale_source AS ENUM ('shopee', 'mp_edgar', 'mp_emerson', 'direct', 'debtor', 'other');
CREATE TYPE public.service_type AS ENUM ('no_repair', 'repaired', 'test', 'pending');
CREATE TYPE public.order_status AS ENUM ('open', 'completed');
CREATE TYPE public.expense_category AS ENUM ('casa', 'still', 'fixas', 'mercado', 'superfluos', 'outras');
CREATE TYPE public.debtor_status AS ENUM ('pending', 'partial', 'paid');
CREATE TYPE public.purchase_status AS ENUM ('pending', 'paid');
CREATE TYPE public.collaborator_status AS ENUM ('pending', 'active', 'inactive');

-- Profiles (replaces users table, linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email VARCHAR(320),
  login_method VARCHAR(64),
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  last_signed_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bank Accounts
CREATE TABLE public.bank_accounts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  account_type public.account_type NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions
CREATE TABLE public.transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id INT NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  type public.transaction_type NOT NULL,
  category VARCHAR(100),
  is_personal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Investments
CREATE TABLE public.investments (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  name TEXT,
  type public.investment_type NOT NULL,
  administrator TEXT,
  shares NUMERIC(15,4) NOT NULL DEFAULT 0,
  purchase_price NUMERIC(15,2) NOT NULL,
  current_price NUMERIC(15,2),
  purchase_date DATE NOT NULL,
  sale_date DATE,
  sale_price NUMERIC(15,2),
  dy_percent NUMERIC(5,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Investment Returns
CREATE TABLE public.investment_returns (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_id INT NOT NULL,
  date DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  type public.return_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales
CREATE TABLE public.sales (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  profit NUMERIC(15,2) NOT NULL DEFAULT 0,
  source public.sale_source NOT NULL,
  product_id INT,
  customer_name VARCHAR(200),
  account_id INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sale Items
CREATE TABLE public.sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT,
  description VARCHAR(200) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL,
  unit_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(15,2) NOT NULL,
  total_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Services
CREATE TABLE public.services (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  serial_number VARCHAR(100),
  amount NUMERIC(15,2) DEFAULT 0,
  cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  profit NUMERIC(15,2) NOT NULL DEFAULT 0,
  customer_name VARCHAR(200),
  os_number VARCHAR(50),
  service_type public.service_type,
  status public.order_status NOT NULL DEFAULT 'open',
  account_id INT,
  storage_location VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service Orders
CREATE TABLE public.service_orders (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  os_number VARCHAR(10) NOT NULL UNIQUE,
  customer_name VARCHAR(200) NOT NULL,
  entry_date DATE NOT NULL,
  expected_delivery_date DATE,
  exit_date TIMESTAMPTZ,
  status public.order_status NOT NULL DEFAULT 'open',
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_profit NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Service Order Items
CREATE TABLE public.service_order_items (
  id SERIAL PRIMARY KEY,
  service_order_id INT NOT NULL,
  item_number INT NOT NULL,
  item_code VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  profit NUMERIC(15,2) NOT NULL DEFAULT 0,
  service_type public.service_type NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expenses
CREATE TABLE public.expenses (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  category public.expense_category NOT NULL,
  account_id INT,
  due_date DATE,
  is_paid BOOLEAN NOT NULL DEFAULT true,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Debtors
CREATE TABLE public.debtors (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL,
  paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(15,2) NOT NULL,
  status public.debtor_status NOT NULL DEFAULT 'pending',
  due_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Debtor Payments
CREATE TABLE public.debtor_payments (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debtor_id INT NOT NULL,
  date DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  account_id INT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products (with category field)
CREATE TABLE public.products (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  cost NUMERIC(15,2) NOT NULL,
  sale_price NUMERIC(15,2) NOT NULL,
  profit NUMERIC(15,2) NOT NULL,
  profit_margin NUMERIC(5,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  minimum_stock INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product Components
CREATE TABLE public.product_components (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  cost NUMERIC(15,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Purchases
CREATE TABLE public.purchases (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  supplier VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  account_id INT,
  status public.purchase_status NOT NULL DEFAULT 'pending',
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Suppliers
CREATE TABLE public.suppliers (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supplier Payments
CREATE TABLE public.supplier_payments (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_name VARCHAR(200) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  account_id INT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product Kits
CREATE TABLE public.product_kits (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  total_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(15,2) NOT NULL,
  profit NUMERIC(15,2) NOT NULL DEFAULT 0,
  profit_margin NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product Kit Items
CREATE TABLE public.product_kit_items (
  id SERIAL PRIMARY KEY,
  kit_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Collaborators
CREATE TABLE public.collaborators (
  id SERIAL PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  email VARCHAR(320) NOT NULL,
  name VARCHAR(200),
  status public.collaborator_status NOT NULL DEFAULT 'pending',
  invite_token VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Collaborator Permissions
CREATE TABLE public.collaborator_permissions (
  id SERIAL PRIMARY KEY,
  collaborator_id INT NOT NULL,
  section VARCHAR(64) NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT true,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debtor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborator_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Bank Accounts
CREATE POLICY "Users manage own bank accounts" ON public.bank_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users manage own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Investments
CREATE POLICY "Users manage own investments" ON public.investments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Investment Returns
CREATE POLICY "Users manage own investment returns" ON public.investment_returns FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sales
CREATE POLICY "Users manage own sales" ON public.sales FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sale Items (access via sale ownership)
CREATE POLICY "Users manage sale items" ON public.sale_items FOR ALL USING (EXISTS (SELECT 1 FROM public.sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid()));

-- Services
CREATE POLICY "Users manage own services" ON public.services FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service Orders
CREATE POLICY "Users manage own service orders" ON public.service_orders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service Order Items (access via service order ownership)
CREATE POLICY "Users manage service order items" ON public.service_order_items FOR ALL USING (EXISTS (SELECT 1 FROM public.service_orders WHERE service_orders.id = service_order_items.service_order_id AND service_orders.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.service_orders WHERE service_orders.id = service_order_items.service_order_id AND service_orders.user_id = auth.uid()));

-- Expenses
CREATE POLICY "Users manage own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Debtors
CREATE POLICY "Users manage own debtors" ON public.debtors FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Debtor Payments
CREATE POLICY "Users manage own debtor payments" ON public.debtor_payments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Products
CREATE POLICY "Users manage own products" ON public.products FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Product Components (access via product ownership)
CREATE POLICY "Users manage product components" ON public.product_components FOR ALL USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_components.product_id AND products.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_components.product_id AND products.user_id = auth.uid()));

-- Purchases
CREATE POLICY "Users manage own purchases" ON public.purchases FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Suppliers
CREATE POLICY "Users manage own suppliers" ON public.suppliers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Supplier Payments
CREATE POLICY "Users manage own supplier payments" ON public.supplier_payments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Product Kits
CREATE POLICY "Users manage own product kits" ON public.product_kits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Product Kit Items (access via kit ownership)
CREATE POLICY "Users manage product kit items" ON public.product_kit_items FOR ALL USING (EXISTS (SELECT 1 FROM public.product_kits WHERE product_kits.id = product_kit_items.kit_id AND product_kits.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.product_kits WHERE product_kits.id = product_kit_items.kit_id AND product_kits.user_id = auth.uid()));

-- Collaborators
CREATE POLICY "Owners manage own collaborators" ON public.collaborators FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Collaborators can view own record" ON public.collaborators FOR SELECT USING (auth.uid() = user_id);

-- Collaborator Permissions
CREATE POLICY "Owners manage collaborator permissions" ON public.collaborator_permissions FOR ALL USING (EXISTS (SELECT 1 FROM public.collaborators WHERE collaborators.id = collaborator_permissions.collaborator_id AND collaborators.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.collaborators WHERE collaborators.id = collaborator_permissions.collaborator_id AND collaborators.owner_id = auth.uid()));
CREATE POLICY "Collaborators can view own permissions" ON public.collaborator_permissions FOR SELECT USING (EXISTS (SELECT 1 FROM public.collaborators WHERE collaborators.id = collaborator_permissions.collaborator_id AND collaborators.user_id = auth.uid()));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
