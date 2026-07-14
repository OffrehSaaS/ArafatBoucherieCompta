-- Schema pour ArafatBoucherieCompta (Supabase PostgreSQL)

-- 1. Enum types
CREATE TYPE user_role AS ENUM ('admin', 'vendeur');
CREATE TYPE payment_method AS ENUM ('Espèces', 'Mobile Money', 'Carte', 'Autre');
CREATE TYPE debt_status AS ENUM ('En attente', 'Partiellement payée', 'Payée');
CREATE TYPE salary_status AS ENUM ('Payé', 'Non payé');
CREATE TYPE stock_change_type AS ENUM ('Entrée', 'Modification', 'Sortie', 'Vente');

-- 2. Profiles (Rôles Utilisateurs)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'vendeur',
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Fournisseurs
CREATE TABLE suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Produits (Stock Initial)
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Historique des mouvements de Stock
CREATE TABLE stock_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    change_type stock_change_type NOT NULL,
    quantity_changed INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    notes TEXT,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Sorties de Stock
CREATE TABLE outputs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
    total_amount NUMERIC NOT NULL GENERATED ALWAYS AS (quantity * unit_price) STORED,
    employee_name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Ventes
CREATE TABLE sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
    total_amount NUMERIC NOT NULL GENERATED ALWAYS AS (quantity * unit_price) STORED,
    payment_method payment_method NOT NULL DEFAULT 'Espèces',
    seller_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Dépenses
CREATE TABLE expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    category TEXT NOT NULL, -- Eau, Tomates, Cube, Maggi, Piment, Huile, Oignons, Charbon, Transport, Glace, Salaires, Divers
    description TEXT,
    recorded_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Dettes Fournisseurs
CREATE TABLE debts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    remaining_amount NUMERIC NOT NULL DEFAULT 0 CHECK (remaining_amount >= 0),
    due_date DATE,
    status debt_status NOT NULL DEFAULT 'En attente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Historique des paiements de dettes
CREATE TABLE debt_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    debt_id UUID REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
    amount_paid NUMERIC NOT NULL CHECK (amount_paid >= 0),
    recorded_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Employés
CREATE TABLE employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    hire_date DATE NOT NULL,
    position TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    working_days JSONB NOT NULL DEFAULT '[true, true, true, true, true, true, true]'::jsonb, -- Lun, Mar, Mer, Jeu, Ven, Sam, Dim
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. Salaires
CREATE TABLE salaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    daily_wage NUMERIC NOT NULL CHECK (daily_wage >= 0),
    amount_paid NUMERIC NOT NULL CHECK (amount_paid >= 0),
    status salary_status NOT NULL DEFAULT 'Non payé',
    notes TEXT,
    paid_at DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 12. Caisse Journalière
CREATE TABLE cash_registry (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
    starting_cash NUMERIC NOT NULL DEFAULT 0,
    sales_total NUMERIC NOT NULL DEFAULT 0,
    expenses_total NUMERIC NOT NULL DEFAULT 0,
    salaries_total NUMERIC NOT NULL DEFAULT 0,
    ending_cash NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 13. Historique d'activité
CREATE TABLE activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT,
    user_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Triggers de mise à jour automatique pour debts (remaining_amount)
CREATE OR REPLACE FUNCTION update_debt_remaining_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.remaining_amount := NEW.total_amount - NEW.paid_amount;
    IF NEW.remaining_amount <= 0 THEN
        NEW.status := 'Payée';
    ELSIF NEW.paid_amount > 0 THEN
        NEW.status := 'Partiellement payée';
    ELSE
        NEW.status := 'En attente';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_debt_remaining_amount
BEFORE INSERT OR UPDATE ON debts
FOR EACH ROW EXECUTE FUNCTION update_debt_remaining_amount();
