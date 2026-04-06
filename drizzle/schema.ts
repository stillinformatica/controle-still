import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date, boolean, tinyint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Contas bancárias
 */
export const bankAccounts = mysqlTable("bank_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // C6, Itaú, Inter PF, Inter PJ, Real, Emerson
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("0"),
  accountType: mysqlEnum("accountType", ["checking", "savings", "investment", "cash"]).notNull(),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = typeof bankAccounts.$inferInsert;

/**
 * Transações bancárias
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountId: int("accountId").notNull(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  category: varchar("category", { length: 100 }),
  isPersonal: boolean("isPersonal").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Investimentos
 */
export const investments = mysqlTable("investments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  code: varchar("code", { length: 20 }).notNull(), // Código do ativo (ex: HGLG11)
  name: text("name"),
  type: mysqlEnum("type", ["fii", "stock", "fund", "fixed_income"]).notNull(),
  administrator: text("administrator"),
  shares: decimal("shares", { precision: 15, scale: 4 }).notNull().default("0"),
  purchasePrice: decimal("purchasePrice", { precision: 15, scale: 2 }).notNull(),
  currentPrice: decimal("currentPrice", { precision: 15, scale: 2 }),
  purchaseDate: date("purchaseDate").notNull(),
  saleDate: date("saleDate"),
  salePrice: decimal("salePrice", { precision: 15, scale: 2 }),
  dyPercent: decimal("dyPercent", { precision: 5, scale: 2 }), // Dividend Yield %
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = typeof investments.$inferInsert;

/**
 * Rendimentos de investimentos
 */
export const investmentReturns = mysqlTable("investment_returns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  investmentId: int("investmentId").notNull(),
  date: date("date").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["dividend", "interest", "rent"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvestmentReturn = typeof investmentReturns.$inferSelect;
export type InsertInvestmentReturn = typeof investmentReturns.$inferInsert;

/**
 * Vendas
 */
export const sales = mysqlTable("sales", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 15, scale: 2 }).notNull().default("0"),
  profit: decimal("profit", { precision: 15, scale: 2 }).notNull().default("0"),
  source: mysqlEnum("source", ["shopee", "mp_edgar", "mp_emerson", "direct", "debtor", "other"]).notNull(),
  productId: int("productId"), // Produto vendido
  customerName: varchar("customerName", { length: 200 }), // Nome do cliente
  accountId: int("accountId"), // Conta que recebeu o pagamento
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;

/**
 * Itens de venda (múltiplos produtos por venda)
 */
export const saleItems = mysqlTable("sale_items", {
  id: int("id").autoincrement().primaryKey(),
  saleId: int("saleId").notNull(),
  productId: int("productId"), // Produto selecionado (opcional)
  description: varchar("description", { length: 200 }).notNull(), // Descrição do item
  quantity: int("quantity").notNull().default(1),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }).notNull(),
  unitCost: decimal("unitCost", { precision: 15, scale: 2 }).notNull().default("0"),
  totalPrice: decimal("totalPrice", { precision: 15, scale: 2 }).notNull(),
  totalCost: decimal("totalCost", { precision: 15, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = typeof saleItems.$inferInsert;

/**
 * Serviços prestados
 */
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  serialNumber: varchar("serialNumber", { length: 100 }), // Número de série
  amount: decimal("amount", { precision: 15, scale: 2 }).default("0"), // Valor (preenchido depois)
  cost: decimal("cost", { precision: 15, scale: 2 }).notNull().default("0"),
  profit: decimal("profit", { precision: 15, scale: 2 }).notNull().default("0"),
  customerName: varchar("customerName", { length: 200 }), // Nome do cliente
  osNumber: varchar("osNumber", { length: 50 }), // Número da OS
  serviceType: mysqlEnum("serviceType", ["no_repair", "repaired", "test", "pending"]), // Tipo de serviço (pending = pendente)
  status: mysqlEnum("status", ["open", "completed"]).default("open").notNull(), // Status da OS
  accountId: int("accountId"), // Conta que recebeu o pagamento
  storageLocation: varchar("storageLocation", { length: 200 }), // Local de armazenamento do item
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Ordens de Serviço (OS)
 */
export const serviceOrders = mysqlTable("service_orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  osNumber: varchar("osNumber", { length: 10 }).notNull().unique(), // 00001, 00002...
  customerName: varchar("customerName", { length: 200 }).notNull(),
  entryDate: date("entryDate").notNull(), // Data de entrada (automática)
  expectedDeliveryDate: date("expectedDeliveryDate"), // Entrega prevista
  exitDate: timestamp("exitDate"), // Data de saída (quando concluído)
  status: mysqlEnum("status", ["open", "completed"]).notNull().default("open"),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull().default("0"),
  totalCost: decimal("totalCost", { precision: 15, scale: 2 }).notNull().default("0"),
  totalProfit: decimal("totalProfit", { precision: 15, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type ServiceOrder = typeof serviceOrders.$inferSelect;
export type InsertServiceOrder = typeof serviceOrders.$inferInsert;

/**
 * Itens da Ordem de Serviço
 */
export const serviceOrderItems = mysqlTable("service_order_items", {
  id: int("id").autoincrement().primaryKey(),
  serviceOrderId: int("serviceOrderId").notNull(),
  itemNumber: int("itemNumber").notNull(), // 1, 2, 3...
  itemCode: varchar("itemCode", { length: 20 }).notNull(), // 00001-1, 00001-2...
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 15, scale: 2 }).notNull().default("0"),
  profit: decimal("profit", { precision: 15, scale: 2 }).notNull().default("0"),
  serviceType: mysqlEnum("serviceType", ["no_repair", "repaired", "test"]).notNull(),
  isCompleted: boolean("isCompleted").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServiceOrderItem = typeof serviceOrderItems.$inferSelect;
export type InsertServiceOrderItem = typeof serviceOrderItems.$inferInsert;

/**
 * Despesas
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: mysqlEnum("category", ["casa", "still", "fixas", "mercado", "superfluos", "outras"]).notNull(),
  accountId: int("accountId"), // Conta que pagou
  dueDate: date("dueDate"), // Para contas fixas
  isPaid: boolean("isPaid").notNull().default(true),
  isRecurring: boolean("isRecurring").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Devedores
 */
export const debtors = mysqlTable("debtors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull(),
  paidAmount: decimal("paidAmount", { precision: 15, scale: 2 }).notNull().default("0"),
  remainingAmount: decimal("remainingAmount", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "partial", "paid"]).notNull().default("pending"),
  dueDate: date("dueDate"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Debtor = typeof debtors.$inferSelect;
export type InsertDebtor = typeof debtors.$inferInsert;

/**
 * Pagamentos de devedores
 */
export const debtorPayments = mysqlTable("debtor_payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  debtorId: int("debtorId").notNull(),
  date: date("date").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  accountId: int("accountId"), // Conta que recebeu
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DebtorPayment = typeof debtorPayments.$inferSelect;
export type InsertDebtorPayment = typeof debtorPayments.$inferInsert;

/**
 * Produtos (para tabela de preços)
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  cost: decimal("cost", { precision: 15, scale: 2 }).notNull(),
  salePrice: decimal("salePrice", { precision: 15, scale: 2 }).notNull(),
  profit: decimal("profit", { precision: 15, scale: 2 }).notNull(),
  profitMargin: decimal("profitMargin", { precision: 5, scale: 2 }).notNull(), // Percentual
  quantity: int("quantity").notNull().default(0), // Quantidade em estoque
  minimumStock: int("minimumStock").notNull().default(0), // Estoque mínimo para alerta
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Componentes de produtos (para cálculo detalhado)
 */
export const productComponents = mysqlTable("product_components", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  cost: decimal("cost", { precision: 15, scale: 2 }).notNull(),
  quantity: int("quantity").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductComponent = typeof productComponents.$inferSelect;
export type InsertProductComponent = typeof productComponents.$inferInsert;

/**
 * Compras de fornecedores
 */
export const purchases = mysqlTable("purchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: date("date").notNull(),
  supplier: varchar("supplier", { length: 200 }).notNull(), // Nome do fornecedor
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  accountId: int("accountId"), // Conta que pagou
  status: mysqlEnum("status", ["pending", "paid"]).notNull().default("pending"),
  dueDate: date("dueDate"), // Data de vencimento (para contas a pagar)
  paidDate: date("paidDate"), // Data de pagamento
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

/**
 * Fornecedores
 */
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  address: text("address"), // Endereço completo
  phone: varchar("phone", { length: 20 }), // Telefone/Celular
  email: varchar("email", { length: 200 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * Pagamentos de fornecedores
 */
export const supplierPayments = mysqlTable("supplier_payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  supplierName: varchar("supplierName", { length: 200 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  accountId: int("accountId").notNull(), // Banco usado para pagamento
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupplierPayment = typeof supplierPayments.$inferSelect;
export type InsertSupplierPayment = typeof supplierPayments.$inferInsert;

/**
 * Kits de Produtos
 */
export const productKits = mysqlTable("product_kits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  totalCost: decimal("totalCost", { precision: 15, scale: 2 }).notNull().default("0"),
  salePrice: decimal("salePrice", { precision: 15, scale: 2 }).notNull(),
  profit: decimal("profit", { precision: 15, scale: 2 }).notNull().default("0"),
  profitMargin: decimal("profitMargin", { precision: 5, scale: 2 }).notNull().default("0"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductKit = typeof productKits.$inferSelect;
export type InsertProductKit = typeof productKits.$inferInsert;

/**
 * Itens de Kits de Produtos
 */
export const productKitItems = mysqlTable("product_kit_items", {
  id: int("id").autoincrement().primaryKey(),
  kitId: int("kitId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductKitItem = typeof productKitItems.$inferSelect;
export type InsertProductKitItem = typeof productKitItems.$inferInsert;

/**
 * Colaboradores - usuários convidados pelo dono para acessar o sistema
 * O colaborador faz login com Google (via Manus OAuth) e é vinculado ao dono pelo email
 */
export const collaborators = mysqlTable("collaborators", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(), // ID do dono da conta (users.id)
  userId: int("userId"),             // ID do colaborador após aceitar o convite (users.id)
  email: varchar("email", { length: 320 }).notNull(), // Email Google do colaborador
  name: varchar("name", { length: 200 }),
  status: mysqlEnum("status", ["pending", "active", "inactive"]).notNull().default("pending"),
  inviteToken: varchar("inviteToken", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Collaborator = typeof collaborators.$inferSelect;
export type InsertCollaborator = typeof collaborators.$inferInsert;

/**
 * Permissões dos colaboradores por seção do sistema
 */
export const collaboratorPermissions = mysqlTable("collaborator_permissions", {
  id: int("id").autoincrement().primaryKey(),
  collaboratorId: int("collaboratorId").notNull(),
  section: varchar("section", { length: 64 }).notNull(), // dashboard, sales, services, purchases, suppliers, expenses, debtors, products, reports, bankAccounts, investments
  canView: boolean("canView").notNull().default(true),
  canCreate: boolean("canCreate").notNull().default(false),
  canEdit: boolean("canEdit").notNull().default(false),
  canDelete: boolean("canDelete").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CollaboratorPermission = typeof collaboratorPermissions.$inferSelect;
export type InsertCollaboratorPermission = typeof collaboratorPermissions.$inferInsert;
