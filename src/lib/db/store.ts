// Unified State Store for ArafatBoucherieCompta
// Handles both LocalStorage caching/fallback and CRUD triggers.

export type UserRole = 'admin' | 'vendeur';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
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
  status: 'en_cours' | 'valide';
  paymentMethod?: 'Espèces' | 'Mobile Money' | 'Carte' | 'Autre';
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

export interface CashRegistry {
  id: string;
  date: string; // YYYY-MM-DD
  startingCash: number;
  salesTotal: number;
  expensesTotal: number;
  salariesTotal: number;
  endingCash: number;
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
const MOCK_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'Sani Élevage', phone: '+226 70 00 11 22', address: 'Ouagadougou, Secteur 30', notes: 'Fournisseur principal de viande de boeuf.', createdAt: '2026-07-01T08:00:00Z' },
  { id: 'sup-2', name: 'Ferme des Collines', phone: '+226 76 11 22 33', address: 'Bobo-Dioulasso, Zone Industrielle', notes: 'Fournisseur de porc de qualité.', createdAt: '2026-07-02T09:00:00Z' },
  { id: 'sup-3', name: 'Mamadou & Fils', phone: '+226 78 22 33 44', address: 'Dori', notes: 'Fournisseur de moutons et chèvres.', createdAt: '2026-07-03T10:30:00Z' },
  { id: 'sup-4', name: 'Ferme Avicole Ouedraogo', phone: '+226 75 33 44 55', address: 'Koudougou', notes: 'Fournisseur de volailles et oeufs.', createdAt: '2026-07-04T14:15:00Z' },
  { id: 'sup-5', name: 'Maison Charcutière', phone: '+226 71 44 55 66', address: 'Ouagadougou', notes: 'Saucisses et produits transformés.', createdAt: '2026-07-05T11:00:00Z' }
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'prod-1', name: 'Filet de Boeuf', category: 'Viande de Boeuf', unitPrice: 3500, quantity: 150, supplierId: 'sup-1', observations: 'Excellente qualité, très tendre.', createdAt: '2026-07-05T08:00:00Z', updatedAt: '2026-07-12T18:00:00Z' },
  { id: 'prod-2', name: 'Côtes de Porc', category: 'Viande de Porc', unitPrice: 2800, quantity: 80, supplierId: 'sup-2', observations: 'Garder bien au frais.', createdAt: '2026-07-05T08:15:00Z', updatedAt: '2026-07-12T18:00:00Z' },
  { id: 'prod-3', name: 'Gigot d\'Agneau', category: 'Viande d\'Agneau', unitPrice: 4200, quantity: 45, supplierId: 'sup-3', observations: 'Commande spéciale pour le weekend.', createdAt: '2026-07-06T10:00:00Z', updatedAt: '2026-07-12T18:00:00Z' },
  { id: 'prod-4', name: 'Poulet Entier Local', category: 'Volaille', unitPrice: 2500, quantity: 120, supplierId: 'sup-4', observations: 'Poulets nettoyés et emballés.', createdAt: '2026-07-07T09:30:00Z', updatedAt: '2026-07-12T18:00:00Z' },
  { id: 'prod-5', name: 'Saucisses de Boeuf', category: 'Charcuterie', unitPrice: 3000, quantity: 60, supplierId: 'sup-5', observations: 'Fumées et épicées.', createdAt: '2026-07-07T11:45:00Z', updatedAt: '2026-07-12T18:00:00Z' }
];

const MOCK_EMPLOYEES: Employee[] = [
  { id: 'emp-1', firstName: 'Alassane', lastName: 'Traoré', phone: '+226 72 00 99 88', hireDate: '2025-01-10', position: 'Boucher Principal', active: true, workingDays: [true, true, true, true, true, true, false], createdAt: '2025-01-10T08:00:00Z' },
  { id: 'emp-2', firstName: 'Fatoumata', lastName: 'Barry', phone: '+226 73 11 22 33', hireDate: '2025-03-01', position: 'Caissière / Vendeuse', active: true, workingDays: [true, true, true, true, true, true, true], createdAt: '2025-03-01T08:00:00Z' },
  { id: 'emp-3', firstName: 'Moussa', lastName: 'Sawadogo', phone: '+226 74 22 33 44', hireDate: '2025-05-15', position: 'Assistant Boucher', active: true, workingDays: [true, true, true, true, true, true, false], createdAt: '2025-05-15T08:00:00Z' }
];

const MOCK_DEBTS: Debt[] = [
  { id: 'debt-1', supplierId: 'sup-1', supplierName: 'Sani Élevage', totalAmount: 450000, paidAmount: 150000, remainingAmount: 300000, dueDate: '2026-07-20', status: 'Partiellement payée', createdAt: '2026-07-05T09:00:00Z' },
  { id: 'debt-2', supplierId: 'sup-2', supplierName: 'Ferme des Collines', totalAmount: 120000, paidAmount: 120000, remainingAmount: 0, dueDate: '2026-07-10', status: 'Payée', createdAt: '2026-07-08T10:00:00Z' }
];

const MOCK_DEBT_PAYMENTS: DebtPayment[] = [
  { id: 'pay-1', debtId: 'debt-1', amountPaid: 150000, recordedBy: 'Administrateur', createdAt: '2026-07-05T15:00:00Z' },
  { id: 'pay-2', debtId: 'debt-2', amountPaid: 120000, recordedBy: 'Administrateur', createdAt: '2026-07-10T11:00:00Z' }
];

// Generates historical dates based on current time (which is 2026-07-13)
const MOCK_SALES: Sale[] = [
  { id: 'sale-1', productId: 'prod-1', productName: 'Filet de Boeuf', quantity: 15, unitPrice: 3500, totalAmount: 52500, paymentMethod: 'Espèces', sellerName: 'Fatoumata Barry', createdAt: '2026-07-12T09:15:00Z' },
  { id: 'sale-2', productId: 'prod-2', productName: 'Côtes de Porc', quantity: 10, unitPrice: 2800, totalAmount: 28000, paymentMethod: 'Mobile Money', sellerName: 'Fatoumata Barry', createdAt: '2026-07-12T10:45:00Z' },
  { id: 'sale-3', productId: 'prod-4', productName: 'Poulet Entier Local', quantity: 20, unitPrice: 2500, totalAmount: 50000, paymentMethod: 'Espèces', sellerName: 'Fatoumata Barry', createdAt: '2026-07-12T14:30:00Z' },
  { id: 'sale-4', productId: 'prod-5', productName: 'Saucisses de Boeuf', quantity: 8, unitPrice: 3000, totalAmount: 24000, paymentMethod: 'Carte', sellerName: 'Fatoumata Barry', createdAt: '2026-07-12T17:10:00Z' },
  { id: 'sale-5', productId: 'prod-1', productName: 'Filet de Boeuf', quantity: 22, unitPrice: 3500, totalAmount: 77000, paymentMethod: 'Espèces', sellerName: 'Fatoumata Barry', createdAt: '2026-07-13T08:30:00Z' },
  { id: 'sale-6', productId: 'prod-3', productName: 'Gigot d\'Agneau', quantity: 5, unitPrice: 4200, totalAmount: 21000, paymentMethod: 'Mobile Money', sellerName: 'Fatoumata Barry', createdAt: '2026-07-13T10:00:00Z' },
  { id: 'sale-7', productId: 'prod-4', productName: 'Poulet Entier Local', quantity: 15, unitPrice: 2500, totalAmount: 37500, paymentMethod: 'Espèces', sellerName: 'Fatoumata Barry', createdAt: '2026-07-13T11:20:00Z' },
  { id: 'sale-8', productId: 'prod-2', productName: 'Côtes de Porc', quantity: 12, unitPrice: 2800, totalAmount: 33600, paymentMethod: 'Carte', sellerName: 'Fatoumata Barry', createdAt: '2026-07-13T14:10:00Z' },
  { id: 'sale-9', productId: 'prod-5', productName: 'Saucisses de Boeuf', quantity: 10, unitPrice: 3000, totalAmount: 30000, paymentMethod: 'Espèces', sellerName: 'Fatoumata Barry', createdAt: '2026-07-13T16:00:00Z' }
];

const MOCK_EXPENSES: Expense[] = [
  { id: 'exp-1', amount: 15000, category: 'Charbon', description: '2 sacs de charbon pour le nettoyage/cuisson.', recordedBy: 'Alassane Traoré', createdAt: '2026-07-12T08:30:00Z' },
  { id: 'exp-2', amount: 8000, category: 'Glace', description: 'Glace pour conservation viande agneau.', recordedBy: 'Moussa Sawadogo', createdAt: '2026-07-12T11:00:00Z' },
  { id: 'exp-3', amount: 5000, category: 'Transport', description: 'Livraison urgence poulet.', recordedBy: 'Fatoumata Barry', createdAt: '2026-07-12T15:30:00Z' },
  { id: 'exp-4', amount: 12000, category: 'Eau', description: 'Facture ONEA mensuelle.', recordedBy: 'Administrateur', createdAt: '2026-07-13T09:00:00Z' },
  { id: 'exp-5', amount: 6000, category: 'Oignons', description: '1 sac d\'oignons pour assaisonnement.', recordedBy: 'Alassane Traoré', createdAt: '2026-07-13T10:30:00Z' }
];

const MOCK_OUTPUTS: Output[] = [
  { id: 'out-1', productId: 'prod-1', productName: 'Filet de Boeuf', quantity: 3, remainingQuantity: 0, soldQuantity: 3, unitPrice: 3500, totalAmount: 10500, employeeName: 'Alassane Traoré', notes: 'Viande avariée retirée.', createdAt: '2026-07-12T18:00:00Z', status: 'valide', paymentMethod: 'Espèces' },
  { id: 'out-2', productId: 'prod-4', productName: 'Poulet Entier Local', quantity: 5, remainingQuantity: 0, soldQuantity: 5, unitPrice: 2500, totalAmount: 12500, employeeName: 'Moussa Sawadogo', notes: 'Pertes transport.', createdAt: '2026-07-13T15:00:00Z', status: 'valide', paymentMethod: 'Espèces' }
];

const MOCK_SALARIES: Salary[] = [
  { id: 'sal-1', employeeId: 'emp-1', employeeName: 'Alassane Traoré', dailyWage: 5000, amountPaid: 5000, status: 'Payé', notes: 'Payé à la journée', paidAt: '2026-07-12', createdAt: '2026-07-12T19:00:00Z' },
  { id: 'sal-2', employeeId: 'emp-3', employeeName: 'Moussa Sawadogo', dailyWage: 3000, amountPaid: 3000, status: 'Payé', notes: 'Payé à la journée', paidAt: '2026-07-12', createdAt: '2026-07-12T19:05:00Z' }
];

const MOCK_CASH_REGISTRIES: CashRegistry[] = [
  { id: 'cash-1', date: '2026-07-12', startingCash: 150000, salesTotal: 154500, expensesTotal: 28000, salariesTotal: 8000, endingCash: 268500, createdAt: '2026-07-12T07:00:00Z' },
  { id: 'cash-2', date: '2026-07-13', startingCash: 268500, salesTotal: 192100, expensesTotal: 18000, salariesTotal: 0, endingCash: 442600, createdAt: '2026-07-13T07:00:00Z' }
];

const MOCK_LOGS: ActivityLog[] = [
  { id: 'log-1', action: 'Initialisation', details: 'Système démarré avec les données par défaut.', userName: 'Système', createdAt: '2026-07-12T07:00:00Z' },
  { id: 'log-2', action: 'Ajout de stock', details: 'Ajout de 150 unités de Filet de Boeuf', userName: 'Administrateur', createdAt: '2026-07-12T08:00:00Z' },
  { id: 'log-3', action: 'Enregistrement Vente', details: 'Vente de 15 unités de Filet de Boeuf', userName: 'Fatoumata Barry', createdAt: '2026-07-12T09:15:00Z' }
];

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
      id: 'prod-' + Date.now(),
      createdAt: dateStr,
      updatedAt: new Date().toISOString()
    };
    products.push(newProduct);
    setLocalStorageData('boucherie_products', products);

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

      // Record stock history
      this.addStockHistory(product.id, 'Vente', -sale.quantity, product.quantity, `Vente de ${sale.quantity} pièces`, userName);
    }

    // Save Sale record
    const sales = this.getSales();
    const newSale: Sale = {
      ...sale,
      id: 'sale-' + Date.now(),
      productName: product.name,
      totalAmount: sale.quantity * sale.unitPrice,
      createdAt: sale.createdAt || new Date().toISOString()
    };
    sales.push(newSale);
    setLocalStorageData('boucherie_sales', sales);

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

    // Record stock history
    this.addStockHistory(product.id, 'Sortie', -output.quantity, product.quantity, `Sortie de stock: ${output.notes || 'Prélèvement pour vente'}`, userName);

    // Save Output record
    const outputs = getLocalStorageData<Output[]>('boucherie_outputs', MOCK_OUTPUTS);
    const newOutput: Output = {
      ...output,
      id: 'out-' + Date.now(),
      productName: product.name,
      totalAmount: 0,
      createdAt: output.createdAt || new Date().toISOString(),
      status: 'en_cours'
    };
    outputs.push(newOutput);
    setLocalStorageData('boucherie_outputs', outputs);

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
    if (customDate) {
      output.createdAt = customDate;
    }

    setLocalStorageData('boucherie_outputs', outputs);
    this.addActivityLog('Clôture Sortie', `Sortie ${output.productName} clôturée : ${soldQty} vendus, ${remainingQuantity} retournés au frigo.`, userName);
    this.recalculateCaisseForDate(output.createdAt.split('T')[0]);

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

    this.addActivityLog('Annulation Sortie', `Sortie de ${output.quantity} ${output.productName} annulée.`, userName);
    this.recalculateCaisseForDate(dateStr);
  }

  static updateOutput(id: string, newQty: number, notes: string, userName: string, newRemainingQty?: number, paymentMethod?: Sale['paymentMethod']) {
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
      id: 'sr-' + Date.now(),
      productName: product.name,
      quantity
    };
    restants.push(newRestant);
    setLocalStorageData('boucherie_stock_restant', restants);

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
      id: 'exp-' + Date.now(),
      createdAt: expense.createdAt || new Date().toISOString()
    };
    expenses.push(newExpense);
    setLocalStorageData('boucherie_expenses', expenses);

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

    this.addActivityLog('Suppression Dépense', `Dépense ${expense.category} de ${expense.amount} FCFA supprimée.`, userName);
    this.recalculateCaisseForDate(dateStr);
  }

  // 5. Suppliers
  static addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>, userName: string): Supplier {
    const suppliers = this.getSuppliers();
    const newSupplier: Supplier = {
      ...supplier,
      id: 'sup-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    suppliers.push(newSupplier);
    setLocalStorageData('boucherie_suppliers', suppliers);
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
      id: 'debt-' + Date.now(),
      supplierName: supplier.name,
      remainingAmount: debt.totalAmount - debt.paidAmount,
      status: debt.paidAmount === 0 ? 'En attente' : (debt.paidAmount >= debt.totalAmount ? 'Payée' : 'Partiellement payée'),
      createdAt: new Date().toISOString()
    };
    debts.push(newDebt);
    setLocalStorageData('boucherie_debts', debts);
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
      id: 'pay-' + Date.now(),
      debtId: payment.debtId,
      amountPaid: payment.amountPaid,
      recordedBy: payment.recordedBy,
      createdAt: new Date().toISOString()
    };
    payments.push(newPayment);
    setLocalStorageData('boucherie_debt_payments', payments);

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

  // 7. Employees
  static addEmployee(employee: Omit<Employee, 'id' | 'createdAt'>, userName: string): Employee {
    const employees = this.getEmployees();
    const newEmployee: Employee = {
      ...employee,
      id: 'emp-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    employees.push(newEmployee);
    setLocalStorageData('boucherie_employees', employees);
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
    this.addActivityLog('Modif. Employé', `Fiche de ${updated.firstName} ${updated.lastName} mise à jour.`, userName);
    return updated;
  }

  static deleteEmployee(id: string, userName: string) {
    let employees = this.getEmployees();
    const employee = employees.find(e => e.id === id);
    if (!employee) throw new Error('Employé non trouvé');

    employees = employees.filter(e => e.id !== id);
    setLocalStorageData('boucherie_employees', employees);
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
      id: 'sal-' + Date.now(),
      employeeName: `${employee.firstName} ${employee.lastName}`,
      createdAt: new Date().toISOString()
    };
    salaries.push(newSalary);
    setLocalStorageData('boucherie_salaries', salaries);

    // Link directly to expenses
    this.addExpense({
      amount: salary.amountPaid,
      category: 'Salaires',
      description: `Salaire journalier payé à ${employee.firstName} ${employee.lastName} (${salary.paidAt})`,
      recordedBy: userName
    }, userName);

    this.addActivityLog('Paiement Salaire', `Salaire journalier de ${salary.amountPaid} FCFA payé à ${employee.firstName} ${employee.lastName}`, userName);
    this.recalculateCaisseForToday();
    return newSalary;
  }

  // Helper records
  private static addStockHistory(productId: string, changeType: StockHistory['changeType'], quantityChanged: number, quantityAfter: number, notes: string, userName: string, customDate?: string) {
    const history = this.getStockHistory();
    const products = getLocalStorageData('boucherie_products', MOCK_PRODUCTS);
    const product = products.find(p => p.id === productId);
    const newHistory: StockHistory = {
      id: 'st-hist-' + Date.now(),
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
  }

  private static addActivityLog(action: string, details: string, userName: string) {
    const logs = this.getActivityLogs();
    const newLog: ActivityLog = {
      id: 'log-' + Date.now(),
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
    let index = registries.findIndex(r => r.date === dateStr);

    const sales = this.getSales().filter(s => s.createdAt.startsWith(dateStr));
    const expenses = this.getExpenses().filter(e => e.createdAt.startsWith(dateStr) && e.category !== 'Salaires');
    const salaries = this.getSalaries().filter(s => s.paidAt === dateStr);

    const salesTotal = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const expensesTotal = expenses.reduce((acc, e) => acc + e.amount, 0);
    const salariesTotal = salaries.reduce((acc, s) => acc + s.amountPaid, 0);

    let startingCash = 0;
    if (index === -1) {
      // Find the most recent day before dateStr
      const sortedRegs = [...registries]
        .filter(r => r.date < dateStr)
        .sort((a, b) => b.date.localeCompare(a.date));
      if (sortedRegs.length > 0) {
        startingCash = sortedRegs[0].endingCash;
      } else {
        startingCash = 150000; // default starting cash if first day ever
      }

      const newReg: CashRegistry = {
        id: 'cash-' + Date.now(),
        date: dateStr,
        startingCash,
        salesTotal,
        expensesTotal,
        salariesTotal,
        endingCash: startingCash + salesTotal - expensesTotal - salariesTotal,
        createdAt: new Date().toISOString()
      };
      registries.push(newReg);
    } else {
      const reg = registries[index];
      reg.salesTotal = salesTotal;
      reg.expensesTotal = expensesTotal;
      reg.salariesTotal = salariesTotal;
      reg.endingCash = reg.startingCash + salesTotal - expensesTotal - salariesTotal;
    }

    // Sort registries chronologically and cascade ending balance to next day's starting balance
    const sortedRegs = [...registries].sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 0; i < sortedRegs.length; i++) {
      if (i > 0) {
        sortedRegs[i].startingCash = sortedRegs[i - 1].endingCash;
      }
      sortedRegs[i].endingCash = sortedRegs[i].startingCash + sortedRegs[i].salesTotal - sortedRegs[i].expensesTotal - sortedRegs[i].salariesTotal;
    }

    setLocalStorageData('boucherie_cash_registries', sortedRegs);
  }

  static updateStartingCash(date: string, amount: number, userName: string) {
    const registries = this.getCashRegistries();
    const index = registries.findIndex(r => r.date === date);
    if (index === -1) {
      const newReg: CashRegistry = {
        id: 'cash-' + Date.now(),
        date,
        startingCash: amount,
        salesTotal: 0,
        expensesTotal: 0,
        salariesTotal: 0,
        endingCash: amount,
        createdAt: new Date().toISOString()
      };
      registries.push(newReg);
    } else {
      const reg = registries[index];
      reg.startingCash = amount;
      reg.endingCash = amount + reg.salesTotal - reg.expensesTotal - reg.salariesTotal;
    }
    setLocalStorageData('boucherie_cash_registries', registries);
    this.addActivityLog('Caisse Départ', `Caisse de départ du ${date} modifiée à ${amount} FCFA par l'admin.`, userName);
  }

  static deleteProduct(id: string, userName: string) {
    const products = getLocalStorageData('boucherie_products', MOCK_PRODUCTS);
    const updated = products.map(p => p.id === id ? { ...p, active: false } : p);
    setLocalStorageData('boucherie_products', updated);
    
    // Find name for activity log
    const pName = products.find(p => p.id === id)?.name || 'Produit';
    this.addActivityLog('Suppression Catalogue', `Produit ${pName} supprimé du catalogue.`, userName);
  }

  static addStockIncoming(productId: string, quantityAdded: number, supplierId: string, notes: string, userName: string, customDate?: string): Product {
    const products = getLocalStorageData('boucherie_products', MOCK_PRODUCTS);
    const index = products.findIndex(p => p.id === productId);
    if (index === -1) throw new Error('Produit non trouvé dans le stock.');

    const product = products[index];
    product.quantity += quantityAdded;
    if (supplierId) {
      product.supplierId = supplierId;
    }
    const dateStr = customDate || new Date().toISOString();
    product.updatedAt = new Date().toISOString();
    setLocalStorageData('boucherie_products', products);

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
    return getLocalStorageData('boucherie_categories', ['Viande de Boeuf', 'Viande de Porc', 'Viande d\'Agneau', 'Volaille', 'Charcuterie']);
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
      { id: 'acc-1', email: 'admin@arafat.com', fullName: 'Brahim Ould', phone: '+226 70 00 11 22', role: 'admin', companyName: 'Boucherie Arafat', password: 'admin', status: 'active', createdAt: '2026-07-01T08:00:00Z' },
      { id: 'acc-2', email: 'vendeur@arafat.com', fullName: 'Fatoumata Barry', phone: '+226 73 11 22 33', role: 'vendeur', password: 'vendeur', status: 'active', createdAt: '2026-07-02T09:00:00Z' },
      { id: 'acc-3', email: 'moussa@arafat.com', fullName: 'Moussa Sawadogo', phone: '+226 74 22 33 44', role: 'vendeur', password: 'moussa', status: 'pending', createdAt: '2026-07-12T17:30:00Z' }
    ];
    return getLocalStorageData('boucherie_accounts', DEFAULT_ACCOUNTS);
  }

  static registerAccount(account: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount {
    const accounts = this.getAccounts();
    if (accounts.some(acc => acc.email.toLowerCase() === account.email.toLowerCase())) {
      throw new Error('Un compte avec cette adresse email existe déjà.');
    }

    const newAccount: UserAccount = {
      ...account,
      id: 'acc-' + Date.now(),
      createdAt: new Date().toISOString()
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

    this.addActivityLog(
      'Activation Compte',
      `Le compte de ${account.fullName} a été ${account.status === 'active' ? 'activé' : 'désactivé'} par ${userName}`,
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
