// Unified State Store for ArafatBoucherieCompta
// Handles both LocalStorage caching/fallback and CRUD triggers.
import { supabase, isSupabaseConfigured } from './client';

export type UserRole = 'admin' | 'vendeur';

const isUuid = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const generateId = (prefix: string): string => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  canManageStock?: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  companyName?: string; // Admin only
  password?: string; // Mocked plain password for demo storage
  status: 'active' | 'pending' | 'rejected';
  createdAt: string;
  avatar?: string;
  canManageStock?: boolean; // Permet à l'admin de donner accès au Stock au Frigo
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unitPrice: number; // FCFA
  quantity: number; // number of pieces / Kg
  supplierId: string;
  supplierName?: string;
  observations: string;
  createdAt: string;
  updatedAt: string;
  active?: boolean;
}

export interface StockHistory {
  id: string;
  productId: string;
  productName: string;
  changeType: 'Entrée' | 'Modification' | 'Sortie' | 'Vente';
  quantityChanged: number;
  quantityAfter: number;
  notes: string;
  userName: string;
  createdAt: string;
}

export interface Output {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  remainingQuantity?: number;
  soldQuantity?: number;
  unitPrice: number;
  totalAmount: number;
  employeeName: string;
  notes: string;
  createdAt: string;
  status: 'en_cours' | 'en_attente_validation' | 'valide';
  paymentMethod?: 'Espèces' | 'Mobile Money' | 'Carte' | 'Autre';
  proposedRemaining?: number;
  proposedPaymentMethod?: 'Espèces' | 'Mobile Money' | 'Carte' | 'Autre';
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: 'Espèces' | 'Mobile Money' | 'Carte' | 'Autre';
  sellerName: string;
  createdAt: string;
  sourceSortieId?: string;
}

export interface StockRestant {
  id: string;
  productId: string;
  productName: string;
  quantity: number; // calculated as totalValue / unitPrice
  totalValue: number; // price total
  paymentMethod: 'Espèces' | 'Mobile Money' | 'Carte' | 'Autre';
  recordedBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string; // Eau, Tomates, Cube, Maggi, Piment, Huile, Oignons, Charbon, Transport, Glace, Salaires, Divers
  description: string;
  recordedBy: string;
  createdAt: string;
  sourceSalaryId?: string;
}

export interface Debt {
  id: string;
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: string;
  status: 'En attente' | 'Partiellement payée' | 'Payée';
  createdAt: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amountPaid: number;
  recordedBy: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  hireDate: string;
  position: string;
  active: boolean;
  workingDays: boolean[]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  createdAt: string;
}

export interface Salary {
  id: string;
  employeeId: string;
  employeeName: string;
  dailyWage: number;
  amountPaid: number;
  status: 'Payé' | 'Non payé';
  notes: string;
  paidAt: string; // YYYY-MM-DD
  createdAt: string;
}

export interface VendorDailyStockItem {
  productId: string;
  productName: string;
  unitPrice: number;
  initialQuantity: number; // Quantité prise au frigo pour la journée
  soldQuantity: number;    // Quantité vendue aujourd'hui
  remainingQuantity: number; // Quantité restante en étal
  outputIds: string[];
  isClosed: boolean;
}

export interface CashRegistry {
  id: string;
  date: string; // YYYY-MM-DD
  vendorName?: string; // Nom du vendeur pour sa caisse quotidienne ('Fatoumata Barry', 'Amadou Diallo', ou 'Générale' pour admin)
  vendorId?: string;
  startingCash: number; // Montant en espèces confié le matin par l'admin
  salesTotal: number; // Total des ventes de ce vendeur
  expensesTotal: number; // Total des dépenses de ce vendeur
  salariesTotal: number; // 0 pour les vendeurs
  endingCash: number; // startingCash + salesTotal - expensesTotal
  status?: 'ouverte' | 'cloturee';
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  userName: string;
  createdAt: string;
}

// Initial mock data to seed the store if localStorage is empty
const MOCK_SUPPLIERS: Supplier[] = [];

const MOCK_PRODUCTS: Product[] = [];

const MOCK_EMPLOYEES: Employee[] = [];

const MOCK_DEBTS: Debt[] = [];

const MOCK_DEBT_PAYMENTS: DebtPayment[] = [];

const MOCK_SALES: Sale[] = [];

const MOCK_EXPENSES: Expense[] = [];

const MOCK_OUTPUTS: Output[] = [];

const MOCK_SALARIES: Salary[] = [];

const MOCK_CASH_REGISTRIES: CashRegistry[] = [];

const MOCK_LOGS: ActivityLog[] = [];

// Clean reset versioning: ensure any client browser clears old mock/demo data
const DB_RESET_VERSION_KEY = 'boucherie_db_clean_reset_v4';
if (typeof window !== 'undefined') {
  try {
    if (!window.localStorage.getItem(DB_RESET_VERSION_KEY)) {
      const keysToClean = [
        'boucherie_products',
        'boucherie_suppliers',
        'boucherie_employees',
        'boucherie_categories',
        'boucherie_cash_registries',
        'boucherie_sales',
        'boucherie_expenses',
        'boucherie_outputs',
        'boucherie_stock_restant',
        'boucherie_debts',
        'boucherie_debt_payments',
        'boucherie_salaries',
        'boucherie_activity_logs'
      ];
      keysToClean.forEach(key => window.localStorage.removeItem(key));
      window.localStorage.setItem(DB_RESET_VERSION_KEY, 'true');
    }
  } catch (e) {
    console.error('Erreur migration reset localStorage:', e);
  }
}

// Helper to initialize local storage
const getLocalStorageData = <T>(key: string, initialData: T): T => {
  if (typeof window === 'undefined') return initialData;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialData;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return initialData;
  }
};

const setLocalStorageData = <T>(key: string, data: T) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing localStorage key "${key}":`, error);
  }
};

export class LocalDbStore {
  // Supabase CRUD Sync helper
  static async syncToSupabase(table: string, action: 'insert' | 'update' | 'delete' | 'upsert', record: any): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      // Map JS camelCase object to Supabase snake_case fields
      const snakeRecord: any = {};
      for (const key of Object.keys(record)) {
        if (key === 'workingDays' && Array.isArray(record[key])) {
          snakeRecord.working_days = record[key];
        } else {
          const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
          snakeRecord[snakeKey] = record[key];
        }
      }

      // Remove frontend-only display fields that do not exist as DB columns
      delete snakeRecord.product_name;
      delete snakeRecord.supplier_name;
      delete snakeRecord.source_salary_id;
      delete snakeRecord.employee_name;

      // Remove GENERATED ALWAYS columns that PostgreSQL rejects on insert/update
      if (table === 'sales' || table === 'outputs') {
        delete snakeRecord.total_amount;
      }

      let res;
      if (action === 'insert') {
        res = await supabase.from(table).insert(snakeRecord);
      } else if (action === 'update') {
        res = await supabase.from(table).update(snakeRecord).eq('id', record.id);
      } else if (action === 'delete') {
        res = await supabase.from(table).delete().eq('id', record.id);
      } else if (action === 'upsert') {
        res = await supabase.from(table).upsert(snakeRecord);
      }

      if (res && res.error) {
        console.error(`Supabase error on ${action} in table "${table}":`, res.error);
      }
    } catch (e) {
      console.error(`Error syncing ${action} to Supabase table ${table}:`, e);
    }
  }
  // Supabase Synchronizer
  static async syncFromSupabase(): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) return;

    try {
      console.log('Synchronisation avec Supabase...');

      const [
        rSuppliers,
        rProducts,
        rSales,
        rExpenses,
        rOutputs,
        rStockRestant,
        rDebts,
        rDebtPayments,
        rEmployees,
        rSalaries,
        rCashRegistries,
        rLogs,
        rProfiles,
        rCategories
      ] = await Promise.all([
        supabase.from('suppliers').select('*'),
        supabase.from('products').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('outputs').select('*'),
        supabase.from('stock_restant').select('*'),
        supabase.from('debts').select('*'),
        supabase.from('debt_payments').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('salaries').select('*'),
        supabase.from('cash_registry').select('*'),
        supabase.from('activity_logs').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('categories').select('*')
      ]);

      // 1. Load basic entities list to resolve names
      let productsList: any[] = [];
      if (rProducts.data) {
        productsList = rProducts.data.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          unitPrice: Number(p.unit_price),
          quantity: Number(p.quantity),
          supplierId: p.supplier_id || '',
          observations: p.observations || '',
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          active: p.active !== null ? p.active : true
        }));
        setLocalStorageData('boucherie_products', productsList);
      } else {
        productsList = getLocalStorageData('boucherie_products', MOCK_PRODUCTS);
      }

      let suppliersList: any[] = [];
      if (rSuppliers.data) {
        suppliersList = rSuppliers.data.map((s) => ({
          id: s.id,
          name: s.name,
          phone: s.phone,
          address: s.address || '',
          notes: s.notes || '',
          createdAt: s.created_at
        }));
        setLocalStorageData('boucherie_suppliers', suppliersList);
      } else {
        suppliersList = getLocalStorageData('boucherie_suppliers', MOCK_SUPPLIERS);
      }

      let employeesList: any[] = [];
      if (rEmployees.data) {
        employeesList = rEmployees.data.map((e) => ({
          id: e.id,
          firstName: e.first_name,
          lastName: e.last_name,
          phone: e.phone,
          hireDate: e.hire_date,
          position: e.position,
          active: e.active,
          workingDays: Array.isArray(e.working_days) ? e.working_days : [true, true, true, true, true, true, true],
          createdAt: e.created_at
        }));
        setLocalStorageData('boucherie_employees', employeesList);
      } else {
        employeesList = getLocalStorageData('boucherie_employees', MOCK_EMPLOYEES);
      }

      // 2. Resolve relationships when mapping transactions
      if (rSales.data) {
        const sales = rSales.data.map((s) => ({
          id: s.id,
          productId: s.product_id,
          productName: productsList.find(p => p.id === s.product_id)?.name || 'Produit Inconnu',
          quantity: Number(s.quantity),
          unitPrice: Number(s.unit_price),
          totalAmount: Number(s.total_amount),
          paymentMethod: s.payment_method,
          sellerName: s.seller_name,
          createdAt: s.created_at,
          sourceSortieId: s.source_sortie_id || undefined
        }));
        setLocalStorageData('boucherie_sales', sales);
      }

      if (rExpenses.data) {
        const expenses = rExpenses.data.map((e) => ({
          id: e.id,
          amount: Number(e.amount),
          category: e.category,
          description: e.description || '',
          recordedBy: e.recorded_by,
          createdAt: e.created_at
        }));
        setLocalStorageData('boucherie_expenses', expenses);
      }

      if (rOutputs.data) {
        const outputs = rOutputs.data.map((o) => ({
          id: o.id,
          productId: o.product_id,
          productName: productsList.find(p => p.id === o.product_id)?.name || 'Produit Inconnu',
          quantity: Number(o.quantity),
          unitPrice: Number(o.unit_price),
          totalAmount: Number(o.total_amount),
          employeeName: o.employee_name,
          notes: o.notes || '',
          createdAt: o.created_at,
          status: o.status || 'en_cours',
          remainingQuantity: o.remaining_quantity !== null ? Number(o.remaining_quantity) : undefined,
          soldQuantity: o.sold_quantity !== null ? Number(o.sold_quantity) : undefined,
          paymentMethod: o.payment_method || undefined
        }));
        setLocalStorageData('boucherie_outputs', outputs);
      }

      if (rStockRestant.data) {
        const restants = rStockRestant.data.map((sr) => ({
          id: sr.id,
          productId: sr.product_id,
          productName: productsList.find(p => p.id === sr.product_id)?.name || 'Produit Inconnu',
          quantity: Number(sr.quantity),
          totalValue: Number(sr.total_value),
          paymentMethod: sr.payment_method,
          recordedBy: sr.recorded_by,
          createdAt: sr.created_at
        }));
        setLocalStorageData('boucherie_stock_restant', restants);
      }

      if (rDebts.data) {
        const debts = rDebts.data.map((d) => ({
          id: d.id,
          supplierId: d.supplier_id,
          supplierName: suppliersList.find(s => s.id === d.supplier_id)?.name || 'Fournisseur Inconnu',
          totalAmount: Number(d.total_amount),
          paidAmount: Number(d.paid_amount),
          remainingAmount: Number(d.remaining_amount),
          dueDate: d.due_date || undefined,
          status: d.status,
          createdAt: d.created_at
        }));
        setLocalStorageData('boucherie_debts', debts);
      }

      if (rDebtPayments.data) {
        const debtPayments = rDebtPayments.data.map((dp) => ({
          id: dp.id,
          debtId: dp.debt_id,
          amountPaid: Number(dp.amount_paid),
          recordedBy: dp.recorded_by,
          createdAt: dp.created_at
        }));
        setLocalStorageData('boucherie_debt_payments', debtPayments);
      }

      if (rSalaries.data) {
        const salaries = rSalaries.data.map((s) => ({
          id: s.id,
          employeeId: s.employee_id,
          employeeName: employeesList.find(e => e.id === s.employee_id)
            ? `${employeesList.find(e => e.id === s.employee_id)?.firstName} ${employeesList.find(e => e.id === s.employee_id)?.lastName}`
            : 'Employé Inconnu',
          dailyWage: Number(s.daily_wage),
          amountPaid: Number(s.amount_paid),
          status: s.status,
          notes: s.notes || '',
          paidAt: s.paid_at,
          createdAt: s.created_at
        }));
        setLocalStorageData('boucherie_salaries', salaries);
      }

      if (rCashRegistries.data) {
        const cashRegistries = rCashRegistries.data.map((cr) => ({
          id: cr.id,
          date: cr.date,
          vendorName: cr.vendor_name || 'Générale',
          startingCash: Number(cr.starting_cash || 0),
          salesTotal: Number(cr.sales_total || 0),
          expensesTotal: Number(cr.expenses_total || 0),
          salariesTotal: Number(cr.salaries_total || 0),
          endingCash: Number(cr.ending_cash || 0),
          status: cr.status || 'ouverte',
          createdAt: cr.created_at
        }));
        setLocalStorageData('boucherie_cash_registries', cashRegistries);
      }

      if (rCategories && rCategories.data) {
        const catNames = rCategories.data.map((c: any) => c.name).filter(Boolean);
        setLocalStorageData('boucherie_categories', catNames);
      }

      if (rLogs.data) {
        const logs = rLogs.data.map((l) => ({
          id: l.id,
          action: l.action,
          details: l.details || '',
          userName: l.user_name,
          createdAt: l.created_at
        }));
        setLocalStorageData('boucherie_activity_logs', logs);
      }

      if (rProfiles.data) {
        const accounts = rProfiles.data.map((p) => ({
          id: p.id,
          email: p.email,
          fullName: p.full_name || '',
          phone: p.phone || '',
          role: p.role,
          companyName: p.company_name || '',
          password: '',
          status: p.status,
          createdAt: p.created_at,
          avatar: p.avatar || undefined,
          canManageStock: p.role === 'admin' ? true : Boolean(p.can_manage_stock)
        }));
        setLocalStorageData('boucherie_accounts', accounts);
      }

      console.log('Synchronisation Supabase terminée avec succès.');
    } catch (error) {
      console.error('Erreur lors de la synchronisation Supabase:', error);
    }
  }


  // Read operations
  static getSuppliers(): Supplier[] {
    return getLocalStorageData('boucherie_suppliers', MOCK_SUPPLIERS);
  }

  static getProducts(): Product[] {
    const products = getLocalStorageData('boucherie_products', MOCK_PRODUCTS);
    const suppliers = this.getSuppliers();
    return products
      .filter(p => p.active !== false)
      .map(p => ({
        ...p,
        supplierName: suppliers.find(s => s.id === p.supplierId)?.name || 'Fournisseur Inconnu'
      }));
  }

  static getStockHistory(): StockHistory[] {
    return getLocalStorageData<StockHistory[]>('boucherie_stock_history', []);
  }

  static clearStockHistory(userName: string) {
    setLocalStorageData('boucherie_stock_history', []);
    if (isSupabaseConfigured() && supabase) {
      supabase.from('stock_history').delete().neq('id', '00000000-0000-0000-0000-000000000000').then(({ error }) => {
        if (error) console.error('Error clearing remote stock history:', error);
      });
    }
    this.addActivityLog('Nettoyage Historique', "Historique des flux de stock vidé par l'administrateur", userName);
  }

  static getOutputs(): Output[] {
    return getLocalStorageData<Output[]>('boucherie_outputs', []);
  }

  static getStockRestants(): StockRestant[] {
    return getLocalStorageData<StockRestant[]>('boucherie_stock_restant', []);
  }

  static getSales(): Sale[] {
    return getLocalStorageData<Sale[]>('boucherie_sales', []);
  }

  static getExpenses(): Expense[] {
    return getLocalStorageData<Expense[]>('boucherie_expenses', []);
  }

  static getDebts(): Debt[] {
    const debts = getLocalStorageData<Debt[]>('boucherie_debts', []);
    const suppliers = this.getSuppliers();
    return debts.map(d => ({
      ...d,
      supplierName: suppliers.find(s => s.id === d.supplierId)?.name || 'Fournisseur Inconnu'
    }));
  }

  static getDebtPayments(): DebtPayment[] {
    return getLocalStorageData<DebtPayment[]>('boucherie_debt_payments', []);
  }

  static getEmployees(): Employee[] {
    return getLocalStorageData('boucherie_employees', MOCK_EMPLOYEES);
  }

  static getSalaries(): Salary[] {
    const salaries = getLocalStorageData<Salary[]>('boucherie_salaries', []);
    const employees = this.getEmployees();
    return salaries.map(s => ({
      ...s,
      employeeName: employees.find(e => e.id === s.employeeId)
        ? `${employees.find(e => e.id === s.employeeId)?.firstName} ${employees.find(e => e.id === s.employeeId)?.lastName}`
        : 'Employé Inconnu'
    }));
  }

  static getCashRegistries(): CashRegistry[] {
    return getLocalStorageData<CashRegistry[]>('boucherie_cash_registries', []);
  }

  static getActivityLogs(): ActivityLog[] {
    return getLocalStorageData<ActivityLog[]>('boucherie_activity_logs', []);
  }

  // Auth context helpers
  static getCurrentUserRole(): UserRole {
    if (typeof window === 'undefined') return 'admin';
    return (window.localStorage.getItem('boucherie_current_role') as UserRole) || 'admin';
  }

  static setCurrentUserRole(role: UserRole) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('boucherie_current_role', role);
    this.addActivityLog('Changement de rôle', `Session basculée sur le rôle ${role}`, role === 'admin' ? 'Administrateur' : 'Vendeur');
  }

  // --- CRUD WRITES WITH TRIGGER INTEGRITY ---

  // 1. Products & Stock
  static addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: string }, userName: string): Product {
    const products = this.getProducts();
    const dateStr = product.createdAt || new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id: generateId('prod'),
      createdAt: dateStr,
      updatedAt: new Date().toISOString()
    };
    products.push(newProduct);
    setLocalStorageData('boucherie_products', products);
    this.syncToSupabase('products', 'insert', newProduct);

    // Record in history
    this.addStockHistory(newProduct.id, 'Entrée', newProduct.quantity, newProduct.quantity, 'Stock Initial créé', userName, dateStr);
    this.addActivityLog('Nouveau produit', `Produit ${newProduct.name} créé avec ${newProduct.quantity} pièces.`, userName);
    this.recalculateCaisseForDate(dateStr.split('T')[0]);
    return newProduct;
  }

  static updateProduct(id: string, updates: Partial<Product> & { createdAt?: string }, userName: string): Product {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Produit non trouvé');

    const original = products[index];
    const dateStr = updates.createdAt || original.createdAt || new Date().toISOString();
    const updated = {
      ...original,
      ...updates,
      createdAt: dateStr,
      updatedAt: new Date().toISOString()
    };
    products[index] = updated;
    setLocalStorageData('boucherie_products', products);
    this.syncToSupabase('products', 'update', updated);

    // If quantity changed, record in history
    if (updates.quantity !== undefined && updates.quantity !== original.quantity) {
      const difference = updates.quantity - original.quantity;
      this.addStockHistory(
        id,
        'Modification',
        difference,
        updated.quantity,
        `Modification manuelle du stock initial par l'admin (de ${original.quantity} à ${updated.quantity})`,
        userName,
        dateStr
      );
    }
    this.addActivityLog('Modification produit', `Produit ${updated.name} mis à jour.`, userName);
    this.recalculateCaisseForDate(dateStr.split('T')[0]);
    return updated;
  }

  // 2. Sales
  static addSale(sale: Omit<Sale, 'id' | 'productName' | 'totalAmount' | 'createdAt'> & { createdAt?: string; sourceSortieId?: string }, userName: string, skipStockUpdate: boolean = false): Sale {
    const products = this.getProducts();
    const productIndex = products.findIndex(p => p.id === sale.productId);
    if (productIndex === -1) throw new Error('Produit non trouvé');
    const product = products[productIndex];

    if (!skipStockUpdate) {
      if (product.quantity < sale.quantity) {
        throw new Error(`Stock insuffisant. Quantité disponible: ${product.quantity}`);
      }

      // Decrease stock
      product.quantity -= sale.quantity;
      product.updatedAt = new Date().toISOString();
      setLocalStorageData('boucherie_products', products);
      this.syncToSupabase('products', 'update', product);

      // Record stock history
      this.addStockHistory(product.id, 'Vente', -sale.quantity, product.quantity, `Vente de ${sale.quantity} pièces`, userName);
    }

    // Save Sale record
    const sales = this.getSales();
    const newSale: Sale = {
      ...sale,
      id: generateId('sale'),
      productName: product.name,
      totalAmount: sale.quantity * sale.unitPrice,
      createdAt: sale.createdAt || new Date().toISOString()
    };
    sales.push(newSale);
    setLocalStorageData('boucherie_sales', sales);
    this.syncToSupabase('sales', 'insert', newSale);

    // Update caisse
    this.addActivityLog('Enregistrement Vente', `Vente de ${sale.quantity} ${product.name} (${newSale.totalAmount} FCFA en ${sale.paymentMethod})`, userName);
    this.recalculateCaisseForDate(newSale.createdAt.split('T')[0]);
    return newSale;
  }

  static updateSale(id: string, updates: Partial<Sale> & { createdAt?: string }, userName: string): Sale {
    const sales = this.getSales();
    const index = sales.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Vente non trouvée');

    const original = sales[index];
    const originalDate = original.createdAt.split('T')[0];
    const newDateStr = updates.createdAt || original.createdAt;
    const newDate = newDateStr.split('T')[0];

    // If it's a direct sale (no sourceSortieId) and quantity/product changed, adjust stock
    if (!original.sourceSortieId && updates.quantity !== undefined && updates.quantity !== original.quantity) {
      const products = this.getProducts();
      const pIndex = products.findIndex(p => p.id === original.productId);
      if (pIndex !== -1) {
        const product = products[pIndex];
        // Revert original quantity
        product.quantity += original.quantity;
        // Check if stock is sufficient for new quantity
        if (product.quantity < updates.quantity) {
          throw new Error(`Stock insuffisant. Disponible : ${product.quantity}`);
        }
        product.quantity -= updates.quantity;
        product.updatedAt = new Date().toISOString();
        setLocalStorageData('boucherie_products', products);
        this.syncToSupabase('products', 'update', product);

        const diff = updates.quantity - original.quantity;
        this.addStockHistory(
          original.productId,
          'Modification',
          -diff,
          product.quantity,
          `Modification de la vente ${id} (de ${original.quantity} à ${updates.quantity})`,
          userName,
          newDateStr
        );
      }
    }

    const updatedSale: Sale = {
      ...original,
      ...updates,
      totalAmount: (updates.quantity !== undefined ? updates.quantity : original.quantity) * (updates.unitPrice !== undefined ? updates.unitPrice : original.unitPrice),
      createdAt: newDateStr
    };

    sales[index] = updatedSale;
    setLocalStorageData('boucherie_sales', sales);
    this.syncToSupabase('sales', 'update', updatedSale);

    this.addActivityLog('Modification Vente', `Vente ${updatedSale.productName} modifiée : ${updatedSale.quantity} pièces (${updatedSale.totalAmount} FCFA)`, userName);
    this.recalculateCaisseForDate(originalDate);
    if (newDate !== originalDate) {
      this.recalculateCaisseForDate(newDate);
    }

    return updatedSale;
  }

  static deleteSale(id: string, userName: string) {
    const sales = this.getSales();
    const sale = sales.find(s => s.id === id);
    if (!sale) throw new Error('Vente non trouvée');

    const dateStr = sale.createdAt.split('T')[0];

    // If it's a direct sale (no sourceSortieId), revert stock
    if (!sale.sourceSortieId) {
      const products = this.getProducts();
      const pIndex = products.findIndex(p => p.id === sale.productId);
      if (pIndex !== -1) {
        products[pIndex].quantity += sale.quantity;
        products[pIndex].updatedAt = new Date().toISOString();
        setLocalStorageData('boucherie_products', products);
        this.syncToSupabase('products', 'update', products[pIndex]);

        this.addStockHistory(
          sale.productId,
          'Modification',
          sale.quantity,
          products[pIndex].quantity,
          `Annulation de la vente ${id} (reversion stock)`,
          userName,
          sale.createdAt
        );
      }
    }

    const updatedSales = sales.filter(s => s.id !== id);
    setLocalStorageData('boucherie_sales', updatedSales);
    this.syncToSupabase('sales', 'delete', { id });

    this.addActivityLog('Suppression Vente', `Vente ${sale.productName} de ${sale.quantity} pièces annulée.`, userName);
    this.recalculateCaisseForDate(dateStr);
  }

  // 3. Outputs (Sorties)
  static addOutput(output: Omit<Output, 'id' | 'productName' | 'totalAmount' | 'createdAt' | 'status' | 'remainingQuantity' | 'soldQuantity' | 'paymentMethod'> & { createdAt?: string }, userName: string): Output {
    const products = this.getProducts();
    const productIndex = products.findIndex(p => p.id === output.productId);
    if (productIndex === -1) throw new Error('Produit non trouvé');
    const product = products[productIndex];

    if (product.quantity < output.quantity) {
      throw new Error(`Stock insuffisant pour effectuer la sortie. Disponible: ${product.quantity}`);
    }

    // Decrease stock
    product.quantity -= output.quantity;
    product.updatedAt = new Date().toISOString();
    setLocalStorageData('boucherie_products', products);
    this.syncToSupabase('products', 'update', product);

    // Record stock history
    this.addStockHistory(product.id, 'Sortie', -output.quantity, product.quantity, `Sortie de stock: ${output.notes || 'Prélèvement pour vente'}`, userName);

    // Save Output record
    const outputs = getLocalStorageData<Output[]>('boucherie_outputs', MOCK_OUTPUTS);
    const newOutput: Output = {
      ...output,
      id: generateId('out'),
      productName: product.name,
      totalAmount: 0,
      createdAt: output.createdAt || new Date().toISOString(),
      status: 'en_cours'
    };
    outputs.push(newOutput);
    setLocalStorageData('boucherie_outputs', outputs);
    this.syncToSupabase('outputs', 'insert', newOutput);

    this.addActivityLog('Enregistrement Sortie', `Sortie de ${output.quantity} ${product.name} (en cours de vente - ${output.notes})`, userName);
    this.recalculateCaisseForDate(newOutput.createdAt.split('T')[0]);
    return newOutput;
  }

  static validateOutput(id: string, remainingQuantity: number, paymentMethod: Sale['paymentMethod'], userName: string, customDate?: string): Output {
    const outputs = getLocalStorageData<Output[]>('boucherie_outputs', MOCK_OUTPUTS);
    const index = outputs.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Sortie introuvable.');

    const output = outputs[index];
    if (output.status === 'valide') {
      throw new Error('Cette sortie a déjà été clôturée.');
    }

    if (remainingQuantity > output.quantity) {
      throw new Error(`Le restant (${remainingQuantity}) ne peut pas dépasser la quantité sortie (${output.quantity}).`);
    }

    const soldQty = output.quantity - remainingQuantity;
    const dateStr = customDate || output.createdAt;

    // 1. Add remaining quantity back to fridge stock
    const products = getLocalStorageData('boucherie_products', MOCK_PRODUCTS);
    const pIndex = products.findIndex(p => p.id === output.productId);
    if (pIndex !== -1) {
      products[pIndex].quantity += remainingQuantity;
      products[pIndex].updatedAt = new Date().toISOString();
      setLocalStorageData('boucherie_products', products);

      // Record stock history
      this.addStockHistory(output.productId, 'Entrée', remainingQuantity, products[pIndex].quantity, `Retour de stock restant au frigo (Sortie ID: ${id})`, userName);
      this.syncToSupabase('products', 'update', products[pIndex]);

      // Auto-register in stock_restant (invendus fin de journée)
      if (remainingQuantity > 0) {
        const restants = this.getStockRestants();
        const newRestant: StockRestant = {
          id: generateId('sr'),
          productId: output.productId,
          productName: output.productName,
          quantity: remainingQuantity,
          totalValue: remainingQuantity * output.unitPrice,
          paymentMethod: paymentMethod,
          recordedBy: userName,
          createdAt: dateStr
        };
        restants.push(newRestant);
        setLocalStorageData('boucherie_stock_restant', restants);
        this.syncToSupabase('stock_restant', 'insert', newRestant);
      }
    }

    // 2. Automatically register Sale if soldQty > 0
    if (soldQty > 0) {
      this.addSale({
        productId: output.productId,
        quantity: soldQty,
        unitPrice: output.unitPrice,
        paymentMethod: paymentMethod,
        sellerName: userName,
        createdAt: dateStr,
        sourceSortieId: id
      }, userName, true); // skipStockUpdate = true (since stock was already reduced when output was created)
    }

    // 3. Update Output record
    output.status = 'valide';
    output.remainingQuantity = remainingQuantity;
    output.soldQuantity = soldQty;
    output.totalAmount = soldQty * output.unitPrice;
    output.paymentMethod = paymentMethod;
    output.proposedRemaining = undefined;
    output.proposedPaymentMethod = undefined;
    if (customDate) {
      output.createdAt = customDate;
    }

    setLocalStorageData('boucherie_outputs', outputs);
    this.syncToSupabase('outputs', 'update', output);
    this.addActivityLog('Clôture Sortie', `Sortie ${output.productName} clôturée : ${soldQty} vendus, ${remainingQuantity} retournés au frigo.`, userName);
    this.recalculateCaisseForDate(output.createdAt.split('T')[0]);

    return output;
  }

  static submitOutputReturn(id: string, proposedRemaining: number, paymentMethod: Sale['paymentMethod'], userName: string): Output {
    const outputs = getLocalStorageData<Output[]>('boucherie_outputs', MOCK_OUTPUTS);
    const index = outputs.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Sortie introuvable.');

    const output = outputs[index];
    if (output.status !== 'en_cours') {
      throw new Error("Cette sortie ne peut pas être retournée car elle n'est plus en cours.");
    }

    if (proposedRemaining > output.quantity) {
      throw new Error(`La quantité retournée (${proposedRemaining}) ne peut pas dépasser la quantité initiale (${output.quantity}).`);
    }

    output.status = 'en_attente_validation';
    output.proposedRemaining = proposedRemaining;
    output.proposedPaymentMethod = paymentMethod;

    setLocalStorageData('boucherie_outputs', outputs);
    this.syncToSupabase('outputs', 'update', output);
    this.addActivityLog('Retour Soumis', `Retour de ${proposedRemaining} ${output.productName} soumis par ${userName} (en attente de validation).`, userName);

    return output;
  }

  static rejectOutputReturn(id: string, userName: string): Output {
    const outputs = getLocalStorageData<Output[]>('boucherie_outputs', MOCK_OUTPUTS);
    const index = outputs.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Sortie introuvable.');

    const output = outputs[index];
    if (output.status !== 'en_attente_validation') {
      throw new Error("Cette sortie n'est pas en attente de validation.");
    }

    output.status = 'en_cours';
    output.proposedRemaining = undefined;
    output.proposedPaymentMethod = undefined;

    setLocalStorageData('boucherie_outputs', outputs);
    this.syncToSupabase('outputs', 'update', output);
    this.addActivityLog('Retour Rejeté', `Demande de retour pour la sortie ${output.productName} rejetée par ${userName}.`, userName);

    return output;
  }

  static deleteOutput(id: string, userName: string) {
    const outputs = getLocalStorageData<Output[]>('boucherie_outputs', MOCK_OUTPUTS);
    const output = outputs.find(o => o.id === id);
    if (!output) throw new Error('Sortie introuvable.');

    const dateStr = output.createdAt.split('T')[0];

    // 1. Revert stock quantity
    const products = getLocalStorageData('boucherie_products', MOCK_PRODUCTS);
    const pIndex = products.findIndex(p => p.id === output.productId);
    if (pIndex !== -1) {
      if (output.status === 'valide') {
        // If validated, remainingQuantity was already added back. We only need to add back the soldQuantity
        // so the net change is returning the full quantity.
        const soldQty = output.soldQuantity || 0;
        products[pIndex].quantity += soldQty;
      } else {
        // If en_cours, the full quantity was subtracted, so we add the full quantity back
        products[pIndex].quantity += output.quantity;
      }
      products[pIndex].updatedAt = new Date().toISOString();
      setLocalStorageData('boucherie_products', products);

      // Log stock history revert
      const revertQty = output.status === 'valide' ? (output.soldQuantity || 0) : output.quantity;
      this.addStockHistory(output.productId, 'Modification', revertQty, products[pIndex].quantity, `Annulation de la sortie (reversion stock): ${output.notes || ''}`, userName);
    }

    // 2. Delete associated sale if validated
    if (output.status === 'valide') {
      const sales = getLocalStorageData<Sale[]>('boucherie_sales', []);
      const updatedSales = sales.filter(s => s.sourceSortieId !== id);
      setLocalStorageData('boucherie_sales', updatedSales);
    }

    // 3. Remove output record
    const updatedOutputs = outputs.filter(o => o.id !== id);
    setLocalStorageData('boucherie_outputs', updatedOutputs);
    this.syncToSupabase('outputs', 'delete', { id });

    this.addActivityLog('Annulation Sortie', `Sortie de ${output.quantity} ${output.productName} annulée.`, userName);
    this.recalculateCaisseForDate(dateStr);
  }

  static updateOutput(id: string, newQty: number, notes: string, userName: string, newRemainingQty?: number, paymentMethod?: Sale['paymentMethod'], employeeName?: string) {
    const outputs = getLocalStorageData<Output[]>('boucherie_outputs', MOCK_OUTPUTS);
    const index = outputs.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Sortie introuvable.');

    const output = outputs[index];
    const dateStr = output.createdAt.split('T')[0];

    // 1. If it was validated, temporarily revert the validation stock & sales
    if (output.status === 'valide') {
      const products = getLocalStorageData('boucherie_products', MOCK_PRODUCTS);
      const pIndex = products.findIndex(p => p.id === output.productId);
      if (pIndex !== -1) {
        // Subtract remainingQuantity that was added back
        products[pIndex].quantity -= (output.remainingQuantity || 0);
        // Re-add the quantity that was initially subtracted
        products[pIndex].quantity += output.quantity;
        products[pIndex].updatedAt = new Date().toISOString();
        setLocalStorageData('boucherie_products', products);
      }

      // Delete associated sale
      const sales = getLocalStorageData<Sale[]>('boucherie_sales', []);
      const updatedSales = sales.filter(s => s.sourceSortieId !== id);
      setLocalStorageData('boucherie_sales', updatedSales);
    } else {
      // If it was en_cours, just revert the initial subtraction
      const products = getLocalStorageData('boucherie_products', MOCK_PRODUCTS);
      const pIndex = products.findIndex(p => p.id === output.productId);
      if (pIndex !== -1) {
        products[pIndex].quantity += output.quantity;
        products[pIndex].updatedAt = new Date().toISOString();
        setLocalStorageData('boucherie_products', products);
      }
    }

    // 2. Now apply the new output quantity
    const products = getLocalStorageData('boucherie_products', MOCK_PRODUCTS);
    const pIndex = products.findIndex(p => p.id === output.productId);
    if (pIndex !== -1) {
      const product = products[pIndex];
      if (product.quantity < newQty) {
        // Revert changes we made above before throwing error to keep db consistent
        setLocalStorageData('boucherie_products', getLocalStorageData('boucherie_products', MOCK_PRODUCTS));
        throw new Error(`Stock insuffisant. Disponible: ${product.quantity}`);
      }
      product.quantity -= newQty;
      product.updatedAt = new Date().toISOString();
      setLocalStorageData('boucherie_products', products);

      this.addStockHistory(output.productId, 'Modification', -newQty, product.quantity, `Modif. quantité sortie de stock (ID: ${id})`, userName);
    }

    // Update basic info
    output.quantity = newQty;
    output.notes = notes;
    if (employeeName) {
      output.employeeName = employeeName;
    }

    // 3. If remaining quantity is provided, re-validate
    if (newRemainingQty !== undefined) {
      if (newRemainingQty > newQty) {
        throw new Error(`Le restant (${newRemainingQty}) ne peut pas dépasser la quantité sortie (${newQty}).`);
      }
      const soldQty = newQty - newRemainingQty;
      
      // Add remaining back to stock
      const products = getLocalStorageData('boucherie_products', MOCK_PRODUCTS);
      const pIndex = products.findIndex(p => p.id === output.productId);
      if (pIndex !== -1) {
        products[pIndex].quantity += newRemainingQty;
        products[pIndex].updatedAt = new Date().toISOString();
        setLocalStorageData('boucherie_products', products);
        this.addStockHistory(output.productId, 'Entrée', newRemainingQty, products[pIndex].quantity, `Retour restant au frigo (Modif. Sortie ID: ${id})`, userName);
      }

      output.status = 'valide';
      output.remainingQuantity = newRemainingQty;
      output.soldQuantity = soldQty;
      output.totalAmount = soldQty * output.unitPrice;
      if (paymentMethod) {
        output.paymentMethod = paymentMethod;
      }

      // Create new sale if soldQty > 0
      if (soldQty > 0) {
        const method = paymentMethod || output.paymentMethod || 'Espèces';
        this.addSale({
          productId: output.productId,
          quantity: soldQty,
          unitPrice: output.unitPrice,
          paymentMethod: method,
          sellerName: userName,
          createdAt: output.createdAt,
          sourceSortieId: id
        }, userName, true); // skipStockUpdate = true
      }
    } else {
      // If no remaining quantity provided, it becomes en_cours
      output.status = 'en_cours';
      output.remainingQuantity = undefined;
      output.soldQuantity = undefined;
      output.totalAmount = 0;
      output.paymentMethod = undefined;
    }

    setLocalStorageData('boucherie_outputs', outputs);
    this.syncToSupabase('outputs', 'update', output);
    this.addActivityLog('Modification Sortie', `Sortie ID ${id} modifiée par ${userName}.`, userName);
    this.recalculateCaisseForDate(dateStr);
  }

  static addStockRestant(entry: Omit<StockRestant, 'id' | 'productName' | 'quantity'>, userName: string): StockRestant {
    const products = this.getProducts();
    const productIndex = products.findIndex(p => p.id === entry.productId);
    if (productIndex === -1) throw new Error('Produit non trouvé');
    const product = products[productIndex];

    const quantity = entry.totalValue / product.unitPrice;
    
    // Save StockRestant record
    const restants = this.getStockRestants();
    const newRestant: StockRestant = {
      ...entry,
      id: generateId('sr'),
      productName: product.name,
      quantity
    };
    restants.push(newRestant);
    setLocalStorageData('boucherie_stock_restant', restants);
    this.syncToSupabase('stock_restant', 'insert', newRestant);

    // 1. Add remaining quantity back to fridge stock
    const dbProducts = getLocalStorageData('boucherie_products', MOCK_PRODUCTS);
    const dbPIndex = dbProducts.findIndex(p => p.id === entry.productId);
    if (dbPIndex !== -1) {
      dbProducts[dbPIndex].quantity += quantity;
      dbProducts[dbPIndex].updatedAt = new Date().toISOString();
      setLocalStorageData('boucherie_products', dbProducts);

      // Record stock history
      this.addStockHistory(
        entry.productId,
        'Entrée',
        quantity,
        dbProducts[dbPIndex].quantity,
        `Retour de stock restant fin de journée au frigo (Stock Restant ID: ${newRestant.id})`,
        userName,
        entry.createdAt
      );
    }

    // 2. Automatically register Sale if there are salidas (sorties) of this product for this date
    const dateStr = entry.createdAt.split('T')[0];
    const outputs = getLocalStorageData<Output[]>('boucherie_outputs', MOCK_OUTPUTS);
    
    // Find outputs of this product on this date with status 'en_cours'
    const todayOutputs = outputs.filter(o => o.productId === entry.productId && o.createdAt.startsWith(dateStr) && o.status === 'en_cours');
    
    if (todayOutputs.length > 0) {
      const totalOutputsQty = todayOutputs.reduce((acc, o) => acc + o.quantity, 0);
      const soldQty = Math.max(0, totalOutputsQty - quantity);

      // Save Sale record if soldQty > 0
      if (soldQty > 0) {
        // Link to the first output of the day
        const mainOutputId = todayOutputs[0].id;
        this.addSale({
          productId: entry.productId,
          quantity: soldQty,
          unitPrice: product.unitPrice,
          paymentMethod: entry.paymentMethod,
          sellerName: userName,
          createdAt: entry.createdAt,
          sourceSortieId: mainOutputId
        }, userName, true); // skipStockUpdate = true (stock already subtracted when output was created)
      }

      // Mark the sorties as validated and save values
      // Distribute the remainingQty across the sorties
      let remainingToDistribute = quantity;
      todayOutputs.forEach((o) => {
        o.status = 'valide';
        o.paymentMethod = entry.paymentMethod;
        o.createdAt = entry.createdAt; // sync date if custom date was selected
        
        const currentRemaining = Math.min(o.quantity, remainingToDistribute);
        o.remainingQuantity = currentRemaining;
        o.soldQuantity = o.quantity - currentRemaining;
        o.totalAmount = o.soldQuantity * o.unitPrice;
        
        remainingToDistribute -= currentRemaining;
      });
      setLocalStorageData('boucherie_outputs', outputs);
    }

    this.addActivityLog('Saisie Stock Restant', `Stock restant de ${quantity} ${product.name} enregistré pour la fin de journée.`, userName);
    this.recalculateCaisseForDate(dateStr);
    return newRestant;
  }

  static deleteStockRestant(id: string, userName: string) {
    const restants = this.getStockRestants();
    const entryIndex = restants.findIndex(r => r.id === id);
    if (entryIndex === -1) throw new Error('Enregistrement stock restant introuvable.');

    const entry = restants[entryIndex];
    const dateStr = entry.createdAt.split('T')[0];

    // 1. Subtract the remaining quantity from the fridge stock
    const dbProducts = getLocalStorageData('boucherie_products', MOCK_PRODUCTS);
    const dbPIndex = dbProducts.findIndex(p => p.id === entry.productId);
    if (dbPIndex !== -1) {
      dbProducts[dbPIndex].quantity -= entry.quantity;
      dbProducts[dbPIndex].updatedAt = new Date().toISOString();
      setLocalStorageData('boucherie_products', dbProducts);

      // Log stock history revert
      this.addStockHistory(
        entry.productId,
        'Modification',
        -entry.quantity,
        dbProducts[dbPIndex].quantity,
        `Annulation du stock restant fin de journée (Stock Restant ID: ${id})`,
        userName,
        entry.createdAt
      );
    }

    // 2. Find and revert outputs of this product on this date
    const outputs = getLocalStorageData<Output[]>('boucherie_outputs', MOCK_OUTPUTS);
    const todayOutputs = outputs.filter(o => o.productId === entry.productId && o.createdAt.startsWith(dateStr) && o.status === 'valide');
    
    if (todayOutputs.length > 0) {
      // Revert associated sales
      const sales = getLocalStorageData<Sale[]>('boucherie_sales', []);
      const outputIds = todayOutputs.map(o => o.id);
      const updatedSales = sales.filter(s => !s.sourceSortieId || !outputIds.includes(s.sourceSortieId));
      setLocalStorageData('boucherie_sales', updatedSales);

      // Revert outputs back to 'en_cours'
      todayOutputs.forEach(o => {
        o.status = 'en_cours';
        o.remainingQuantity = undefined;
        o.soldQuantity = undefined;
        o.totalAmount = 0;
        o.paymentMethod = undefined;
      });
      setLocalStorageData('boucherie_outputs', outputs);
    }

    // 3. Remove the stock restant entry
    const updatedRestants = restants.filter(r => r.id !== id);
    setLocalStorageData('boucherie_stock_restant', updatedRestants);
    this.syncToSupabase('stock_restant', 'delete', { id });

    this.addActivityLog('Suppression Stock Restant', `Enregistrement stock restant pour ${entry.productName} supprimé.`, userName);
    this.recalculateCaisseForDate(dateStr);
  }

  static updateStockRestant(id: string, updates: Partial<StockRestant> & { createdAt?: string }, userName: string): StockRestant {
    const restants = this.getStockRestants();
    const original = restants.find(r => r.id === id);
    if (!original) throw new Error('Stock restant introuvable.');

    // Delete the old one (which reverts stock, sales, and sorties)
    this.deleteStockRestant(id, userName);

    // Re-create with updates
    const newPayload = {
      productId: updates.productId || original.productId,
      totalValue: updates.totalValue !== undefined ? updates.totalValue : original.totalValue,
      paymentMethod: updates.paymentMethod || original.paymentMethod,
      recordedBy: userName,
      createdAt: updates.createdAt || original.createdAt
    };

    return this.addStockRestant(newPayload, userName);
  }

  // 4. Expenses
  static addExpense(expense: Omit<Expense, 'id' | 'createdAt'> & { createdAt?: string }, userName: string): Expense {
    const expenses = this.getExpenses();
    const newExpense: Expense = {
      ...expense,
      id: generateId('exp'),
      createdAt: expense.createdAt || new Date().toISOString()
    };
    expenses.push(newExpense);
    setLocalStorageData('boucherie_expenses', expenses);
    this.syncToSupabase('expenses', 'insert', newExpense);

    this.addActivityLog('Enregistrement Dépense', `Dépense enregistrée : ${expense.category} - ${expense.amount} FCFA (${expense.description})`, userName);
    this.recalculateCaisseForDate(newExpense.createdAt.split('T')[0]);
    return newExpense;
  }

  static updateExpense(id: string, updates: Partial<Expense> & { createdAt?: string }, userName: string): Expense {
    const expenses = this.getExpenses();
    const index = expenses.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Dépense non trouvée');

    const original = expenses[index];
    const originalDate = original.createdAt.split('T')[0];
    const newDateStr = updates.createdAt || original.createdAt;
    const newDate = newDateStr.split('T')[0];

    const updatedExpense: Expense = {
      ...original,
      ...updates,
      createdAt: newDateStr
    };

    expenses[index] = updatedExpense;
    setLocalStorageData('boucherie_expenses', expenses);
    this.syncToSupabase('expenses', 'update', updatedExpense);

    this.addActivityLog('Modification Dépense', `Dépense ${updatedExpense.category} modifiée : ${updatedExpense.amount} FCFA`, userName);
    this.recalculateCaisseForDate(originalDate);
    if (newDate !== originalDate) {
      this.recalculateCaisseForDate(newDate);
    }

    return updatedExpense;
  }

  static deleteExpense(id: string, userName: string) {
    const expenses = this.getExpenses();
    const expense = expenses.find(e => e.id === id);
    if (!expense) throw new Error('Dépense non trouvée');

    const dateStr = expense.createdAt.split('T')[0];

    const updatedExpenses = expenses.filter(e => e.id !== id);
    setLocalStorageData('boucherie_expenses', updatedExpenses);
    this.syncToSupabase('expenses', 'delete', { id });

    this.addActivityLog('Suppression Dépense', `Dépense ${expense.category} de ${expense.amount} FCFA supprimée.`, userName);
    this.recalculateCaisseForDate(dateStr);
  }

  // 5. Suppliers
  static addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>, userName: string): Supplier {
    const suppliers = this.getSuppliers();
    const newSupplier: Supplier = {
      ...supplier,
      id: generateId('sup'),
      createdAt: new Date().toISOString()
    };
    suppliers.push(newSupplier);
    setLocalStorageData('boucherie_suppliers', suppliers);
    this.syncToSupabase('suppliers', 'insert', newSupplier);
    this.addActivityLog('Nouveau Fournisseur', `Fournisseur ${supplier.name} ajouté.`, userName);
    return newSupplier;
  }

  static updateSupplier(id: string, updates: Partial<Supplier>, userName: string): Supplier {
    const suppliers = this.getSuppliers();
    const index = suppliers.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Fournisseur non trouvé');

    const updated = {
      ...suppliers[index],
      ...updates
    };
    suppliers[index] = updated;
    setLocalStorageData('boucherie_suppliers', suppliers);
    this.syncToSupabase('suppliers', 'update', updated);
    this.addActivityLog('Modif. Fournisseur', `Fournisseur ${updated.name} mis à jour.`, userName);
    return updated;
  }

  // 6. Debts
  static addDebt(debt: Omit<Debt, 'id' | 'supplierName' | 'remainingAmount' | 'status' | 'createdAt'>, userName: string): Debt {
    const suppliers = this.getSuppliers();
    const supplier = suppliers.find(s => s.id === debt.supplierId);
    if (!supplier) throw new Error('Fournisseur non trouvé');

    const debts = this.getDebts();
    const newDebt: Debt = {
      ...debt,
      id: generateId('debt'),
      supplierName: supplier.name,
      remainingAmount: debt.totalAmount - debt.paidAmount,
      status: debt.paidAmount === 0 ? 'En attente' : (debt.paidAmount >= debt.totalAmount ? 'Payée' : 'Partiellement payée'),
      createdAt: new Date().toISOString()
    };
    debts.push(newDebt);
    setLocalStorageData('boucherie_debts', debts);
    this.syncToSupabase('debts', 'insert', newDebt);
    this.addActivityLog('Nouvelle Dette', `Dette enregistrée pour ${supplier.name} : ${debt.totalAmount} FCFA.`, userName);
    return newDebt;
  }

  static addDebtPayment(payment: { debtId: string; amountPaid: number; recordedBy: string }, userName: string): DebtPayment {
    const debts = this.getDebts();
    const debtIndex = debts.findIndex(d => d.id === payment.debtId);
    if (debtIndex === -1) throw new Error('Dette non trouvée');
    const debt = debts[debtIndex];

    if (debt.remainingAmount < payment.amountPaid) {
      throw new Error(`Le versement dépasse le reste à payer (${debt.remainingAmount} FCFA)`);
    }

    // Update debt paid amount
    debt.paidAmount += payment.amountPaid;
    debt.remainingAmount = debt.totalAmount - debt.paidAmount;
    debt.status = debt.remainingAmount <= 0 ? 'Payée' : 'Partiellement payée';
    setLocalStorageData('boucherie_debts', debts);

    // Save payment record
    const payments = this.getDebtPayments();
    const newPayment: DebtPayment = {
      id: generateId('pay'),
      debtId: payment.debtId,
      amountPaid: payment.amountPaid,
      recordedBy: payment.recordedBy,
      createdAt: new Date().toISOString()
    };
    payments.push(newPayment);
    setLocalStorageData('boucherie_debt_payments', payments);
    this.syncToSupabase('debt_payments', 'insert', newPayment);
    this.syncToSupabase('debts', 'update', debt);

    // Register as a cash expense to track ending balance correctly
    this.addExpense({
      amount: payment.amountPaid,
      category: 'Divers',
      description: `Règlement partiel dette ${debt.supplierName}`,
      recordedBy: payment.recordedBy
    }, userName);

    this.addActivityLog('Paiement Dette', `Versement de ${payment.amountPaid} FCFA payé à ${debt.supplierName}`, userName);
    this.recalculateCaisseForToday();
    return newPayment;
  }

  static updateDebt(id: string, updates: Partial<Debt>, userName: string): Debt {
    const debts = this.getDebts();
    const index = debts.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Dette non trouvée');

    const original = debts[index];
    const updatedDebt = {
      ...original,
      ...updates
    };

    // Recalculate remaining amount and status
    updatedDebt.remainingAmount = updatedDebt.totalAmount - updatedDebt.paidAmount;
    updatedDebt.status = updatedDebt.paidAmount === 0 
      ? 'En attente' 
      : (updatedDebt.paidAmount >= updatedDebt.totalAmount ? 'Payée' : 'Partiellement payée');

    debts[index] = updatedDebt;
    setLocalStorageData('boucherie_debts', debts);
    this.syncToSupabase('debts', 'update', updatedDebt);

    this.addActivityLog('Modification Dette', `Dette de ${updatedDebt.supplierName} modifiée : ${updatedDebt.totalAmount} FCFA.`, userName);
    return updatedDebt;
  }

  static deleteDebt(id: string, userName: string) {
    const debts = this.getDebts();
    const debt = debts.find(d => d.id === id);
    if (!debt) throw new Error('Dette non trouvée');

    const updated = debts.filter(d => d.id !== id);
    setLocalStorageData('boucherie_debts', updated);
    this.syncToSupabase('debts', 'delete', { id });

    this.addActivityLog('Suppression Dette', `Dette de ${debt.supplierName} de ${debt.totalAmount} FCFA supprimée.`, userName);
  }

  // 7. Employees
  static addEmployee(employee: Omit<Employee, 'id' | 'createdAt'>, userName: string): Employee {
    const employees = this.getEmployees();
    const newEmployee: Employee = {
      ...employee,
      id: generateId('emp'),
      createdAt: new Date().toISOString()
    };
    employees.push(newEmployee);
    setLocalStorageData('boucherie_employees', employees);
    this.syncToSupabase('employees', 'insert', newEmployee);
    this.addActivityLog('Nouvel Employé', `Employé ${employee.firstName} ${employee.lastName} ajouté.`, userName);
    return newEmployee;
  }

  static updateEmployee(id: string, updates: Partial<Employee>, userName: string): Employee {
    const employees = this.getEmployees();
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Employé non trouvé');

    const updated = {
      ...employees[index],
      ...updates
    };
    employees[index] = updated;
    setLocalStorageData('boucherie_employees', employees);
    this.syncToSupabase('employees', 'update', updated);
    this.addActivityLog('Modif. Employé', `Fiche de ${updated.firstName} ${updated.lastName} mise à jour.`, userName);
    return updated;
  }

  static deleteEmployee(id: string, userName: string) {
    let employees = this.getEmployees();
    const employee = employees.find(e => e.id === id);
    if (!employee) throw new Error('Employé non trouvé');

    employees = employees.filter(e => e.id !== id);
    setLocalStorageData('boucherie_employees', employees);
    this.syncToSupabase('employees', 'delete', { id });
    this.addActivityLog('Suppression Employé', `Employé ${employee.firstName} ${employee.lastName} supprimé.`, userName);
  }

  // 8. Salaries
  static paySalary(salary: Omit<Salary, 'id' | 'employeeName' | 'createdAt'>, userName: string): Salary {
    const employees = this.getEmployees();
    const employee = employees.find(e => e.id === salary.employeeId);
    if (!employee) throw new Error('Employé non trouvé');

    const salaries = this.getSalaries();
    const newSalary: Salary = {
      ...salary,
      id: generateId('sal'),
      employeeName: `${employee.firstName} ${employee.lastName}`,
      createdAt: new Date().toISOString()
    };
    salaries.push(newSalary);
    setLocalStorageData('boucherie_salaries', salaries);
    this.syncToSupabase('salaries', 'insert', newSalary);

    // Link directly to expenses
    this.addExpense({
      amount: salary.amountPaid,
      category: 'Salaires',
      description: `Salaire journalier payé à ${employee.firstName} ${employee.lastName} (${salary.paidAt})`,
      recordedBy: userName,
      sourceSalaryId: newSalary.id
    }, userName);

    this.addActivityLog('Paiement Salaire', `Salaire journalier de ${salary.amountPaid} FCFA payé à ${employee.firstName} ${employee.lastName}`, userName);
    this.recalculateCaisseForToday();
    return newSalary;
  }

  static updateSalary(id: string, updates: Partial<Salary>, userName: string): Salary {
    const salaries = this.getSalaries();
    const index = salaries.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Salaire non trouvé');

    const original = salaries[index];
    const employees = this.getEmployees();
    const employee = employees.find(e => e.id === (updates.employeeId || original.employeeId));
    const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : original.employeeName;

    const updatedSalary: Salary = {
      ...original,
      ...updates,
      employeeName
    };
    salaries[index] = updatedSalary;
    setLocalStorageData('boucherie_salaries', salaries);
    this.syncToSupabase('salaries', 'update', updatedSalary);

    // Update the associated expense
    const expenses = this.getExpenses();
    const expIndex = expenses.findIndex(e => e.sourceSalaryId === id);
    if (expIndex !== -1) {
      const exp = expenses[expIndex];
      const updatedExpense = {
        ...exp,
        amount: updatedSalary.amountPaid,
        description: `Salaire journalier payé à ${employeeName} (${updatedSalary.paidAt})`,
        createdAt: updatedSalary.paidAt ? new Date(updatedSalary.paidAt + 'T12:00:00Z').toISOString() : exp.createdAt
      };
      expenses[expIndex] = updatedExpense;
      setLocalStorageData('boucherie_expenses', expenses);
      this.syncToSupabase('expenses', 'update', updatedExpense);
      this.recalculateCaisseForDate(updatedExpense.createdAt.split('T')[0]);
    }

    this.addActivityLog('Modification Salaire', `Paiement de salaire de ${original.employeeName} modifié par l'administrateur.`, userName);
    this.recalculateCaisseForToday();
    return updatedSalary;
  }

  static deleteSalary(id: string, userName: string) {
    let salaries = this.getSalaries();
    const salary = salaries.find(s => s.id === id);
    if (!salary) throw new Error('Salaire non trouvé');

    salaries = salaries.filter(s => s.id !== id);
    setLocalStorageData('boucherie_salaries', salaries);
    this.syncToSupabase('salaries', 'delete', { id });

    // Delete the associated expense
    let expenses = this.getExpenses();
    const exp = expenses.find(e => e.sourceSalaryId === id);
    if (exp) {
      expenses = expenses.filter(e => e.sourceSalaryId !== id);
      setLocalStorageData('boucherie_expenses', expenses);
      this.syncToSupabase('expenses', 'delete', { id: exp.id });
      this.recalculateCaisseForDate(exp.createdAt.split('T')[0]);
    }

    this.addActivityLog('Suppression Salaire', `Paiement de salaire de ${salary.employeeName} (${salary.amountPaid} FCFA) supprimé.`, userName);
    this.recalculateCaisseForToday();
  }

  // Helper records
  private static addStockHistory(productId: string, changeType: StockHistory['changeType'], quantityChanged: number, quantityAfter: number, notes: string, userName: string, customDate?: string) {
    const history = this.getStockHistory();
    const products = getLocalStorageData('boucherie_products', MOCK_PRODUCTS);
    const product = products.find(p => p.id === productId);
    const newHistory: StockHistory = {
      id: generateId('st-hist'),
      productId,
      productName: product ? product.name : 'Produit inconnu',
      changeType,
      quantityChanged,
      quantityAfter,
      notes,
      userName,
      createdAt: customDate || new Date().toISOString()
    };
    history.push(newHistory);
    setLocalStorageData('boucherie_stock_history', history);
    
    const accounts = this.getAccounts();
    const account = accounts.find(acc => acc.fullName.toLowerCase() === userName.toLowerCase() || acc.email.toLowerCase() === userName.toLowerCase());
    const userId = account && isUuid(account.id) ? account.id : null;
    this.syncToSupabase('stock_history', 'insert', {
      id: newHistory.id,
      productId: newHistory.productId,
      changeType: newHistory.changeType,
      quantityChanged: newHistory.quantityChanged,
      quantityAfter: newHistory.quantityAfter,
      notes: newHistory.notes,
      userId,
      createdAt: newHistory.createdAt
    });
  }

  private static addActivityLog(action: string, details: string, userName: string) {
    const logs = this.getActivityLogs();
    const newLog: ActivityLog = {
      id: generateId('log'),
      action,
      details,
      userName,
      createdAt: new Date().toISOString()
    };
    logs.unshift(newLog);
    // Limit to 50 logs in history
    setLocalStorageData('boucherie_activity_logs', logs.slice(0, 50));
  }

  // 9. Caisse recalculation logic
  // Triggered after each Sale, Expense, Salary Payment
  static recalculateCaisseForToday() {
    this.recalculateCaisseForDate(new Date().toISOString().split('T')[0]);
  }

  static recalculateCaisseForDate(dateStr: string) {
    const registries = this.getCashRegistries();
    const accounts = this.getAccounts();
    const sales = this.getSales().filter(s => s.createdAt.startsWith(dateStr));
    const dayExpensesRaw = this.getExpenses().filter(e => e.createdAt.startsWith(dateStr));
    const salaries = this.getSalaries().filter(s => s.paidAt === dateStr);

    // 1. Recalculate each vendor's individual caisse
    const vendorNamesSet = new Set<string>();
    accounts.filter(a => a.role === 'vendeur').forEach(a => vendorNamesSet.add(a.fullName));
    sales.forEach(s => { if (s.sellerName) vendorNamesSet.add(s.sellerName); });
    registries.filter(r => r.date === dateStr && r.vendorName && r.vendorName !== 'Générale').forEach(r => vendorNamesSet.add(r.vendorName!));

    vendorNamesSet.forEach(vName => {
      const vSales = sales.filter(s => s.sellerName === vName);
      const vSalesTotal = vSales.reduce((acc, s) => acc + s.totalAmount, 0);
      const vExpenses = dayExpensesRaw.filter(e => e.recordedBy === vName && e.category !== 'Salaires' && e.category !== 'Pertes');
      const vExpensesTotal = vExpenses.reduce((acc, e) => acc + e.amount, 0);

      const vRegIndex = registries.findIndex(r => r.date === dateStr && r.vendorName === vName);
      if (vRegIndex === -1) {
        const newVReg: CashRegistry = {
          id: generateId('cash-v'),
          date: dateStr,
          vendorName: vName,
          startingCash: 0,
          salesTotal: vSalesTotal,
          expensesTotal: vExpensesTotal,
          salariesTotal: 0, // Vendors do NOT see or have salaries in their personal cash drawer
          endingCash: vSalesTotal - vExpensesTotal,
          status: 'ouverte',
          createdAt: new Date().toISOString()
        };
        registries.push(newVReg);
      } else {
        const vReg = registries[vRegIndex];
        vReg.salesTotal = vSalesTotal;
        vReg.expensesTotal = vExpensesTotal;
        vReg.salariesTotal = 0; // Strictly 0 for vendor personal cash drawer
        vReg.endingCash = (vReg.startingCash || 0) + vSalesTotal - vExpensesTotal;
      }
    });

    // 2. Recalculate general / admin caisse
    const totalSales = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalExpenses = dayExpensesRaw.filter(e => e.category !== 'Salaires' && e.category !== 'Pertes').reduce((acc, e) => acc + e.amount, 0);
    const totalSalaries = salaries.reduce((acc, s) => acc + s.amountPaid, 0);

    let genIndex = registries.findIndex(r => r.date === dateStr && (r.vendorName === 'Générale' || !r.vendorName));
    if (genIndex === -1) {
      const vendorRegs = registries.filter(r => r.date === dateStr && r.vendorName && r.vendorName !== 'Générale');
      const sumStarting = vendorRegs.reduce((acc, r) => acc + (r.startingCash || 0), 0);
      const newGenReg: CashRegistry = {
        id: generateId('cash-gen'),
        date: dateStr,
        vendorName: 'Générale',
        startingCash: sumStarting,
        salesTotal: totalSales,
        expensesTotal: totalExpenses,
        salariesTotal: totalSalaries,
        endingCash: sumStarting + totalSales - totalExpenses - totalSalaries,
        status: 'ouverte',
        createdAt: new Date().toISOString()
      };
      registries.push(newGenReg);
    } else {
      const genReg = registries[genIndex];
      genReg.salesTotal = totalSales;
      genReg.expensesTotal = totalExpenses;
      genReg.salariesTotal = totalSalaries;
      genReg.endingCash = (genReg.startingCash || 0) + totalSales - totalExpenses - totalSalaries;
    }

    setLocalStorageData('boucherie_cash_registries', registries);
    for (const reg of registries.filter(r => r.date === dateStr)) {
      this.syncToSupabase('cash_registry', 'upsert', reg);
    }
  }

  static assignVendorStartingCash(date: string, vendorName: string, amount: number, adminName: string): CashRegistry {
    const registries = this.getCashRegistries();
    let reg = registries.find(r => r.date === date && r.vendorName === vendorName);

    const sales = this.getSales().filter(s => s.createdAt.startsWith(date) && s.sellerName === vendorName);
    const salesTotal = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const expenses = this.getExpenses().filter(e => e.createdAt.startsWith(date) && e.recordedBy === vendorName && e.category !== 'Salaires' && e.category !== 'Pertes');
    const expensesTotal = expenses.reduce((acc, e) => acc + e.amount, 0);

    if (!reg) {
      reg = {
        id: generateId('cash-v'),
        date,
        vendorName,
        startingCash: amount,
        salesTotal,
        expensesTotal,
        salariesTotal: 0,
        endingCash: amount + salesTotal - expensesTotal,
        status: 'ouverte',
        createdAt: new Date().toISOString()
      };
      registries.push(reg);
    } else {
      reg.startingCash = amount;
      reg.salesTotal = salesTotal;
      reg.expensesTotal = expensesTotal;
      reg.endingCash = amount + salesTotal - expensesTotal;
    }

    setLocalStorageData('boucherie_cash_registries', registries);
    this.syncToSupabase('cash_registry', 'upsert', reg);
    this.addActivityLog('Attribution Caisse', `Caisse de départ de ${amount} FCFA attribuée à ${vendorName} pour le ${date}`, adminName);

    // Update general caisse starting sum
    const vendorRegs = registries.filter(r => r.date === date && r.vendorName && r.vendorName !== 'Générale');
    const sumStarting = vendorRegs.reduce((acc, r) => acc + (r.startingCash || 0), 0);
    let genReg = registries.find(r => r.date === date && (r.vendorName === 'Générale' || !r.vendorName));
    if (genReg) {
      genReg.startingCash = sumStarting;
      genReg.endingCash = sumStarting + genReg.salesTotal - genReg.expensesTotal - genReg.salariesTotal;
      setLocalStorageData('boucherie_cash_registries', registries);
      this.syncToSupabase('cash_registry', 'upsert', genReg);
    }

    this.recalculateCaisseForDate(date);
    return reg;
  }

  static updateStartingCash(date: string, amount: number, userName: string, vendorName?: string) {
    if (vendorName && vendorName !== 'Générale') {
      return this.assignVendorStartingCash(date, vendorName, amount, userName);
    }
    const registries = this.getCashRegistries();
    const index = registries.findIndex(r => r.date === date && (r.vendorName === 'Générale' || !r.vendorName));
    let targetReg: CashRegistry;
    if (index === -1) {
      targetReg = {
        id: generateId('cash'),
        date,
        vendorName: 'Générale',
        startingCash: amount,
        salesTotal: 0,
        expensesTotal: 0,
        salariesTotal: 0,
        endingCash: amount,
        status: 'ouverte',
        createdAt: new Date().toISOString()
      };
      registries.push(targetReg);
    } else {
      targetReg = registries[index];
      targetReg.startingCash = amount;
      targetReg.endingCash = amount + targetReg.salesTotal - targetReg.expensesTotal - targetReg.salariesTotal;
    }
    setLocalStorageData('boucherie_cash_registries', registries);
    this.syncToSupabase('cash_registry', 'upsert', targetReg);
    this.addActivityLog('Caisse Départ', `Caisse de départ générale du ${date} modifiée à ${amount} FCFA par l'admin.`, userName);
    this.recalculateCaisseForToday();
    return targetReg;
  }

  // 10. Vendor Daily Stock helper
  static getVendorDailyStock(vendorName: string, dateStr: string): VendorDailyStockItem[] {
    const outputs = this.getOutputs().filter(o => o.employeeName === vendorName && o.createdAt.startsWith(dateStr));
    const sales = this.getSales().filter(s => s.sellerName === vendorName && s.createdAt.startsWith(dateStr));

    const map: { [productId: string]: VendorDailyStockItem } = {};

    for (const out of outputs) {
      if (!map[out.productId]) {
        map[out.productId] = {
          productId: out.productId,
          productName: out.productName,
          unitPrice: out.unitPrice,
          initialQuantity: 0,
          soldQuantity: 0,
          remainingQuantity: 0,
          outputIds: [],
          isClosed: out.status === 'valide'
        };
      }
      map[out.productId].initialQuantity += out.quantity;
      map[out.productId].outputIds.push(out.id);
      if (out.status === 'valide') {
        map[out.productId].soldQuantity += (out.soldQuantity || 0);
        map[out.productId].remainingQuantity += (out.remainingQuantity || 0);
      }
    }

    // For open stock, count sales
    for (const pId of Object.keys(map)) {
      const item = map[pId];
      if (!item.isClosed) {
        const prodSales = sales.filter(s => s.productId === pId);
        const totalSold = prodSales.reduce((acc, s) => acc + s.quantity, 0);
        item.soldQuantity = totalSold;
        item.remainingQuantity = Math.max(0, item.initialQuantity - totalSold);
      }
    }

    return Object.values(map);
  }

  static deleteCashRegistry(id: string, userName: string) {
    const registries = this.getCashRegistries();
    const reg = registries.find(r => r.id === id);
    if (!reg) throw new Error('Caisse introuvable.');

    const updated = registries.filter(r => r.id !== id);
    setLocalStorageData('boucherie_cash_registries', updated);
    this.syncToSupabase('cash_registry', 'delete', { id });
    this.addActivityLog('Suppression Caisse', `Clôture de caisse du ${reg.date} supprimée par ${userName}.`, userName);
  }

  static deleteProduct(id: string, userName: string) {
    const products = getLocalStorageData('boucherie_products', MOCK_PRODUCTS);
    const updated = products.map(p => p.id === id ? { ...p, active: false } : p);
    setLocalStorageData('boucherie_products', updated);
    this.syncToSupabase('products', 'update', { id, active: false });
    
    // Find name for activity log
    const pName = products.find(p => p.id === id)?.name || 'Produit';
    this.addActivityLog('Suppression Catalogue', `Produit ${pName} supprimé du catalogue.`, userName);
  }

  static addStockIncoming(productId: string, quantityAdded: number, supplierId: string, notes: string, userName: string, customDate?: string, newUnitPrice?: number): Product {
    const products = getLocalStorageData('boucherie_products', MOCK_PRODUCTS);
    const index = products.findIndex(p => p.id === productId);
    if (index === -1) throw new Error('Produit non trouvé dans le stock.');

    const product = products[index];
    product.quantity += quantityAdded;
    if (supplierId) {
      product.supplierId = supplierId;
    }
    if (newUnitPrice && newUnitPrice > 0) {
      product.unitPrice = newUnitPrice;
    }
    const dateStr = customDate || new Date().toISOString();
    product.updatedAt = new Date().toISOString();
    setLocalStorageData('boucherie_products', products);
    this.syncToSupabase('products', 'update', product);

    // Record stock history
    this.addStockHistory(
      productId,
      'Entrée',
      quantityAdded,
      product.quantity,
      notes || `Entrée de stock (+${quantityAdded} pièces)`,
      userName,
      dateStr
    );

    this.addActivityLog('Entrée de Stock', `Arrivage de +${quantityAdded} ${product.name} par ${userName}`, userName);
    this.recalculateCaisseForDate(dateStr.split('T')[0]);
    return product;
  }

  static getCategories(): string[] {
    return getLocalStorageData('boucherie_categories', []);
  }

  static addCategory(name: string, userName: string): string[] {
    const categories = this.getCategories();
    if (categories.some(c => c.toLowerCase() === name.toLowerCase())) {
      throw new Error('Cette catégorie existe déjà.');
    }
    categories.push(name);
    setLocalStorageData('boucherie_categories', categories);
    this.addActivityLog('Nouvelle Catégorie', `Catégorie ${name} ajoutée.`, userName);
    return categories;
  }

  static updateCategory(oldName: string, newName: string, userName: string): string[] {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c === oldName);
    if (index === -1) throw new Error('Catégorie introuvable.');
    if (categories.some(c => c.toLowerCase() === newName.toLowerCase() && c !== oldName)) {
      throw new Error('Une autre catégorie porte déjà ce nom.');
    }
    categories[index] = newName;
    setLocalStorageData('boucherie_categories', categories);

    // Update products using the old category name
    const products = getLocalStorageData('boucherie_products', MOCK_PRODUCTS);
    let updatedCount = 0;
    const updatedProducts = products.map(p => {
      if (p.category === oldName) {
        updatedCount++;
        return { ...p, category: newName };
      }
      return p;
    });
    if (updatedCount > 0) {
      setLocalStorageData('boucherie_products', updatedProducts);
    }

    this.addActivityLog('Catégorie modifiée', `Catégorie ${oldName} renommée en ${newName} (${updatedCount} produits impactés).`, userName);
    return categories;
  }

  static deleteCategory(name: string, userName: string): string[] {
    let categories = this.getCategories();
    categories = categories.filter(c => c !== name);
    setLocalStorageData('boucherie_categories', categories);

    // Change category to 'Divers' for products using deleted category
    const products = getLocalStorageData('boucherie_products', MOCK_PRODUCTS);
    let updatedCount = 0;
    const updatedProducts = products.map(p => {
      if (p.category === name) {
        updatedCount++;
        return { ...p, category: 'Divers' };
      }
      return p;
    });
    if (updatedCount > 0) {
      setLocalStorageData('boucherie_products', updatedProducts);
      if (!categories.includes('Divers')) {
        categories.push('Divers');
        setLocalStorageData('boucherie_categories', categories);
      }
    }

    this.addActivityLog('Catégorie supprimée', `Catégorie ${name} supprimée (${updatedCount} produits passés en Divers).`, userName);
    return categories;
  }

  // User Account Management
  static getAccounts(): UserAccount[] {
    const DEFAULT_ACCOUNTS: UserAccount[] = [
      { id: 'acc-admin-new', email: 'directeur@arafat.com', fullName: 'Directeur Général', phone: '+226 70 12 34 56', role: 'admin', companyName: 'Boucherie Arafat', password: 'Admin2026!', status: 'active', createdAt: '2026-08-01T08:00:00Z', canManageStock: true }
    ];
    let stored = getLocalStorageData<UserAccount[]>('boucherie_accounts', DEFAULT_ACCOUNTS);
    let hasChanges = false;

    // Filter out old deleted test accounts
    const obsoleteEmails = ['superadmin@arafat.com', 'admin@arafat.com', 'admin@dinerexpress.tg', 'vendeur@arafat.com', 'amadou@arafat.com', 'moussa@arafat.com'];
    const filteredStored = stored.filter(acc => !obsoleteEmails.includes(acc.email.toLowerCase()));
    if (filteredStored.length !== stored.length) {
      stored = filteredStored;
      hasChanges = true;
    }

    DEFAULT_ACCOUNTS.forEach(defaultAcc => {
      const exists = stored.some(acc => acc.email.toLowerCase() === defaultAcc.email.toLowerCase());
      if (!exists) {
        stored.push(defaultAcc);
        hasChanges = true;
      }
    });
    stored.forEach(acc => {
      if (acc.canManageStock === undefined) {
        acc.canManageStock = acc.role === 'admin';
        hasChanges = true;
      }
    });
    if (hasChanges && typeof window !== 'undefined') {
      setLocalStorageData('boucherie_accounts', stored);
    }
    return stored;
  }

  static registerAccount(account: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount {
    const accounts = this.getAccounts();
    if (accounts.some(acc => acc.email.toLowerCase() === account.email.toLowerCase())) {
      throw new Error('Un compte avec cette adresse email existe déjà.');
    }

    const newAccount: UserAccount = {
      ...account,
      id: generateId('acc'),
      createdAt: new Date().toISOString(),
      canManageStock: account.role === 'admin' ? true : Boolean(account.canManageStock)
    };
    accounts.push(newAccount);
    setLocalStorageData('boucherie_accounts', accounts);
    
    this.addActivityLog(
      'Inscription',
      `Nouveau compte ${account.role} créé pour ${account.fullName} (${account.status})`,
      account.fullName
    );
    return newAccount;
  }

  static updateAccountStatus(id: string, status: 'active' | 'rejected', userName: string): UserAccount {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(acc => acc.id === id);
    if (index === -1) throw new Error('Compte introuvable.');

    const account = accounts[index];
    account.status = status;
    setLocalStorageData('boucherie_accounts', accounts);
    this.syncToSupabase('profiles', 'update', { id, status });

    this.addActivityLog(
      'Statut Compte',
      `Le compte de ${account.fullName} a été ${status === 'active' ? 'activé/approuvé' : 'rejeté'} par ${userName}`,
      userName
    );
    return account;
  }

  static toggleAccountActive(id: string, userName: string): UserAccount {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(acc => acc.id === id);
    if (index === -1) throw new Error('Compte introuvable.');

    const account = accounts[index];
    const originalStatus = account.status;
    account.status = originalStatus === 'active' ? 'rejected' : 'active';
    setLocalStorageData('boucherie_accounts', accounts);
    this.syncToSupabase('profiles', 'update', { id, status: account.status });

    this.addActivityLog(
      'Activation Compte',
      `Le compte de ${account.fullName} a été ${account.status === 'active' ? 'activé' : 'désactivé'} par ${userName}`,
      userName
    );
    return account;
  }

  static toggleAccountStockAccess(id: string, userName: string): UserAccount {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(acc => acc.id === id);
    if (index === -1) throw new Error('Compte introuvable.');

    const account = accounts[index];
    account.canManageStock = !account.canManageStock;
    setLocalStorageData('boucherie_accounts', accounts);
    this.syncToSupabase('profiles', 'update', { id, can_manage_stock: account.canManageStock });

    // Update active user in localStorage if matching
    if (typeof window !== 'undefined') {
      const savedUserStr = window.localStorage.getItem('boucherie_user');
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser.email?.toLowerCase() === account.email.toLowerCase()) {
            savedUser.canManageStock = account.canManageStock;
            window.localStorage.setItem('boucherie_user', JSON.stringify(savedUser));
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    this.addActivityLog(
      'Contrôle Stock Frigo',
      `Le contrôle du Stock au Frigo a été ${account.canManageStock ? 'accordé à' : 'retiré pour'} ${account.fullName} par ${userName}`,
      userName
    );
    return account;
  }

  static updateAccountRole(id: string, role: 'admin' | 'vendeur', userName: string): UserAccount {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(acc => acc.id === id);
    if (index === -1) throw new Error('Compte introuvable.');

    const account = accounts[index];
    account.role = role;
    account.canManageStock = role === 'admin';
    setLocalStorageData('boucherie_accounts', accounts);
    this.syncToSupabase('profiles', 'update', { id, role, can_manage_stock: account.canManageStock });

    // Update active user in localStorage if matching
    if (typeof window !== 'undefined') {
      const savedUserStr = window.localStorage.getItem('boucherie_user');
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser.email?.toLowerCase() === account.email.toLowerCase()) {
            savedUser.role = role;
            savedUser.canManageStock = account.canManageStock;
            window.localStorage.setItem('boucherie_user', JSON.stringify(savedUser));
            this.setCurrentUserRole(role);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    this.addActivityLog(
      'Rôle Compte',
      `Le rôle de ${account.fullName} a été changé en ${role === 'admin' ? 'Administrateur (accès frigo accordé)' : 'Vendeur (stock individuel)'} par ${userName}`,
      userName
    );
    return account;
  }

  static deleteAccount(id: string, userName: string) {
    let accounts = this.getAccounts();
    const account = accounts.find(acc => acc.id === id);
    if (!account) throw new Error('Compte introuvable.');

    accounts = accounts.filter(acc => acc.id !== id);
    setLocalStorageData('boucherie_accounts', accounts);
    this.syncToSupabase('profiles', 'delete', { id });

    this.addActivityLog(
      'Suppression Compte',
      `Le compte de ${account.fullName} a été supprimé par ${userName}`,
      userName
    );
  }

  static resetAccountPassword(id: string, newPassword: string, userName: string) {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(acc => acc.id === id);
    if (index === -1) throw new Error('Compte introuvable.');

    const account = accounts[index];
    account.password = newPassword;
    setLocalStorageData('boucherie_accounts', accounts);

    this.addActivityLog(
      'Réinit. MDP',
      `Le mot de passe de ${account.fullName} a été réinitialisé par ${userName}`,
      userName
    );
  }
}

function MOCK_SALALES_CLEANED(): Sale[] {
  return MOCK_SALES;
}
