import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============= DASHBOARD =============
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getDashboardStats(ctx.user.id);
    }),
  }),

  // ============= BANK ACCOUNTS =============
  bankAccounts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getBankAccounts(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getBankAccountById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        balance: z.string(),
        accountType: z.enum(["checking", "savings", "investment", "cash"]),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createBankAccount({ ...input, userId: ctx.user.id });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        balance: z.string().optional(),
        accountType: z.enum(["checking", "savings", "investment", "cash"]).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateBankAccount(id, ctx.user.id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteBankAccount(input.id, ctx.user.id);
      }),
  }),

  // ============= TRANSACTIONS =============
  transactions: router({
    list: protectedProcedure
      .input(z.object({
        accountId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getTransactions(ctx.user.id, input.accountId, input.startDate, input.endDate);
      }),
    
    create: protectedProcedure
      .input(z.object({
        accountId: z.number(),
        date: z.string(),
        description: z.string().min(1),
        amount: z.string(),
        type: z.enum(["income", "expense"]),
        category: z.string().optional(),
        isPersonal: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createTransaction({ ...input, date: input.date as any, userId: ctx.user.id, isPersonal: input.isPersonal ?? false });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteTransaction(input.id, ctx.user.id);
      }),
  }),

  // ============= INVESTMENTS =============
  investments: router({
    list: protectedProcedure
      .input(z.object({ isActive: z.boolean().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getInvestments(ctx.user.id, input.isActive);
      }),
    
    create: protectedProcedure
      .input(z.object({
        code: z.string().min(1),
        name: z.string().optional(),
        type: z.enum(["fii", "stock", "fund", "fixed_income"]),
        administrator: z.string().optional(),
        shares: z.string(),
        purchasePrice: z.string(),
        currentPrice: z.string().optional(),
        purchaseDate: z.string(),
        dyPercent: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createInvestment({ ...input, purchaseDate: new Date(input.purchaseDate), userId: ctx.user.id, isActive: true });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        code: z.string().optional(),
        name: z.string().optional(),
        type: z.enum(["fii", "stock", "fund", "fixed_income"]).optional(),
        administrator: z.string().optional(),
        shares: z.string().optional(),
        purchasePrice: z.string().optional(),
        currentPrice: z.string().optional(),
        purchaseDate: z.string().optional(),
        saleDate: z.string().optional(),
        salePrice: z.string().optional(),
        dyPercent: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, purchaseDate, saleDate, ...data } = input;
        const updateData: any = { ...data };
        if (purchaseDate) updateData.purchaseDate = new Date(purchaseDate);
        if (saleDate) updateData.saleDate = new Date(saleDate);
        return db.updateInvestment(id, ctx.user.id, updateData);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteInvestment(input.id, ctx.user.id);
      }),
  }),

  // ============= INVESTMENT RETURNS =============
  investmentReturns: router({
    list: protectedProcedure
      .input(z.object({ investmentId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getInvestmentReturns(ctx.user.id, input.investmentId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        investmentId: z.number(),
        date: z.string(),
        amount: z.string(),
        type: z.enum(["dividend", "interest", "rent"]),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createInvestmentReturn({ ...input, date: input.date as any, userId: ctx.user.id });
      }),
  }),

  // ============= SALES =============
  sales: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getSales(ctx.user.id, input.startDate, input.endDate);
      }),
    
    create: protectedProcedure
      .input(z.object({
        date: z.string(),
        description: z.string(),
        amount: z.string().optional(),
        cost: z.string().optional(),
        source: z.string(),
        productId: z.number().optional(),
        customerName: z.string().optional(),
        accountId: z.number().optional(),
        items: z.array(z.object({
          productId: z.number().optional(),
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          unitCost: z.number(),
          isKit: z.boolean().optional(), // Flag para indicar se é kit
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { items, ...saleData } = input;
        // Se não tem items, amount e cost são obrigatórios
        if (!items || items.length === 0) {
          if (!input.amount || !input.cost) {
            throw new Error("Amount e cost são obrigatórios quando não há itens");
          }
        }
        // Passar data como string diretamente para o Drizzle (formato YYYY-MM-DD)
        // O Drizzle converte automaticamente para o tipo DATE do MySQL sem ajustes de timezone
        return db.createSale(
          { ...saleData, date: input.date as any, userId: ctx.user.id, profit: input.amount && input.cost ? String(Number(input.amount) - Number(input.cost)) : "0", amount: input.amount || "0", cost: input.cost || "0", source: input.source as any },
          items
        );
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        date: z.string().optional(),
        description: z.string().optional(),
        amount: z.string().optional(),
        cost: z.string().optional(),
        source: z.enum(["shopee", "mp_edgar", "mp_emerson", "direct", "debtor", "other"]).optional(),
        productId: z.number().optional(),
        customerName: z.string().optional(),
        accountId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, date, ...data } = input;
        const updateData: any = { ...data };
        if (date) updateData.date = new Date(date);
        return db.updateSale(id, ctx.user.id, updateData);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteSale(input.id, ctx.user.id);
      }),
    
    getItems: protectedProcedure
      .input(z.object({ saleId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getSaleItems(input.saleId);
      }),
  }),

  // ============= SERVICES =============
  services: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getServices(ctx.user.id, input.startDate, input.endDate);
      }),
    
    create: protectedProcedure
      .input(z.object({
        date: z.string(),
        description: z.string().min(1),
        serialNumber: z.string().optional(),
        amount: z.string().optional(),
        cost: z.string().optional(),
        customerName: z.string().optional(),
        osNumber: z.string().optional(),
        serviceType: z.enum(["no_repair", "repaired", "test", "pending"]).optional(),
        accountId: z.number().optional(),
        storageLocation: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createService({ ...input, date: input.date as any, userId: ctx.user.id, profit: "0" });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        date: z.string().optional(),
        description: z.string().optional(),
        serialNumber: z.string().optional(),
        amount: z.string().optional(),
        cost: z.string().optional(),
        customerName: z.string().optional(),
        osNumber: z.string().optional(),
        serviceType: z.enum(["no_repair", "repaired", "test", "pending"]).optional(),
        accountId: z.number().optional(),
        storageLocation: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, date, ...data } = input;
        const updateData: any = { ...data };
        if (date) updateData.date = new Date(date);
        return db.updateService(id, ctx.user.id, updateData);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteService(input.id, ctx.user.id);
      }),
    
    complete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.completeService(input.id, ctx.user.id);
      }),
    
    getNextOSNumber: protectedProcedure
      .query(async ({ ctx }) => {
        return { osNumber: await db.getNextOSNumber(ctx.user.id) };
      }),

    getByOS: protectedProcedure
      .input(z.object({ osNumber: z.string() }))
      .query(async ({ ctx, input }) => {
        const allServices = await db.getServices(ctx.user.id);
        return allServices.filter(s => s.osNumber === input.osNumber);
      }),

    getByCustomer: protectedProcedure
      .input(z.object({ customerName: z.string() }))
      .query(async ({ ctx, input }) => {
        const allServices = await db.getServices(ctx.user.id);
        return allServices.filter(s => s.customerName === input.customerName);
      }),
  }),

  // ============= EXPENSES =============
  expenses: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        category: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getExpenses(ctx.user.id, input.startDate, input.endDate, input.category);
      }),
    
    create: protectedProcedure
      .input(z.object({
        date: z.string(),
        description: z.string().min(1),
        amount: z.string(),
        category: z.enum(["casa", "still", "fixas", "mercado", "superfluos", "outras"]),
        accountId: z.number().optional(),
        dueDate: z.string().optional(),
        isPaid: z.boolean().default(true),
        isRecurring: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createExpense({ ...input, date: input.date as any, dueDate: input.dueDate as any, userId: ctx.user.id });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        date: z.string().optional(),
        description: z.string().optional(),
        amount: z.string().optional(),
        category: z.enum(["casa", "still", "fixas", "mercado", "superfluos", "outras"]).optional(),
        accountId: z.number().optional(),
        dueDate: z.string().optional(),
        isPaid: z.boolean().optional(),
        isRecurring: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, date, dueDate, ...data } = input;
        const updateData: any = { ...data };
        if (date) updateData.date = new Date(date);
        if (dueDate) updateData.dueDate = new Date(dueDate);
        return db.updateExpense(id, ctx.user.id, updateData);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteExpense(input.id, ctx.user.id);
      }),
  }),

  // ============= DEBTORS =============
  debtors: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getDebtors(ctx.user.id, input.status);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        totalAmount: z.string(),
        paidAmount: z.string().default("0"),
        dueDate: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createDebtor({ ...input, dueDate: input.dueDate ? new Date(input.dueDate) : undefined, userId: ctx.user.id, remainingAmount: "0", status: "pending" });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        totalAmount: z.string().optional(),
        paidAmount: z.string().optional(),
        dueDate: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["pending", "partial", "paid"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, dueDate, ...data } = input;
        const updateData: any = { ...data };
        if (dueDate) updateData.dueDate = new Date(dueDate);
        return db.updateDebtor(id, ctx.user.id, updateData);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteDebtor(input.id, ctx.user.id);
      }),
  }),

  // ============= DEBTOR PAYMENTS =============
  debtorPayments: router({
    list: protectedProcedure
      .input(z.object({ debtorId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getDebtorPayments(ctx.user.id, input.debtorId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        debtorId: z.number(),
        date: z.string(),
        amount: z.string(),
        accountId: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createDebtorPayment({ ...input, date: input.date as any, userId: ctx.user.id });
      }),
  }),

  // ============= PRODUCTS =============
  products: router({
    list: protectedProcedure
      .input(z.object({ isActive: z.boolean().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getProducts(ctx.user.id, input.isActive);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getProductById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        cost: z.string(),
        salePrice: z.string(),
        quantity: z.string().optional(),
        minimumStock: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createProduct({ 
          ...input, 
          userId: ctx.user.id, 
          profit: "0", 
          profitMargin: "0",
          quantity: input.quantity ? parseInt(input.quantity) : 0,
          minimumStock: input.minimumStock ?? 0,
          isActive: true 
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        cost: z.string().optional(),
        salePrice: z.string().optional(),
        quantity: z.string().optional(),
        minimumStock: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, quantity, ...data } = input;
        const updateData: any = { ...data };
        if (quantity !== undefined) {
          updateData.quantity = parseInt(quantity);
        }
        return db.updateProduct(id, ctx.user.id, updateData);
      }),
    
    getLowStock: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getLowStockProducts(ctx.user.id);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteProduct(input.id, ctx.user.id);
      }),
  }),

  // ============= SERVICE ORDERS (OS) =============
  // ============= PURCHASES =============
  purchases: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getPurchases(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getPurchaseById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        date: z.string(),
        supplier: z.string().min(1),
        description: z.string().min(1),
        amount: z.string(),
        accountId: z.number().optional(),
        status: z.enum(["pending", "paid"]).default("pending"),
        dueDate: z.string().optional(),
        paidDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { date, dueDate, paidDate, ...rest } = input;
        return db.createPurchase({ 
          ...rest, 
          userId: ctx.user.id,
          date: date as any,
          dueDate: dueDate as any,
          paidDate: paidDate as any,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        date: z.string().optional(),
        supplier: z.string().optional(),
        description: z.string().optional(),
        amount: z.string().optional(),
        accountId: z.number().optional(),
        status: z.enum(["pending", "paid"]).optional(),
        dueDate: z.string().optional(),
        paidDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, date, dueDate, paidDate, ...rest } = input;
        const data: any = { ...rest };
        if (date) data.date = new Date(date);
        if (dueDate) data.dueDate = new Date(dueDate);
        if (paidDate) data.paidDate = new Date(paidDate);
        return db.updatePurchase(id, ctx.user.id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deletePurchase(input.id, ctx.user.id);
      }),
  }),

  // ============= BANK TRANSFERS =============
  bankTransfers: router({
    transfer: protectedProcedure
      .input(z.object({
        fromAccountId: z.number(),
        toAccountId: z.number(),
        amount: z.string(),
        description: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.transferBetweenAccounts(
          ctx.user.id,
          input.fromAccountId,
          input.toAccountId,
          input.amount,
          input.description
        );
      }),
  }),

  // ============= SUPPLIERS =============
  suppliers: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getSuppliers(ctx.user.id);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getSupplierById(input.id, ctx.user.id);
      }),
    
    getPurchases: protectedProcedure
      .input(z.object({ supplierName: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.getSupplierPurchases(input.supplierName, ctx.user.id);
      }),
    
    getStats: protectedProcedure
      .input(z.object({ supplierName: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.getSupplierStats(input.supplierName, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createSupplier({ ...input, userId: ctx.user.id });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateSupplier(id, ctx.user.id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteSupplier(input.id, ctx.user.id);
      }),
    
    // Pagamentos de fornecedores
    getPayments: protectedProcedure
      .input(z.object({ supplierName: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.getSupplierPayments(input.supplierName, ctx.user.id);
      }),
    
    createPayment: protectedProcedure
      .input(z.object({
        supplierName: z.string().min(1),
        amount: z.string(),
        accountId: z.number(),
        date: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { date, ...rest } = input;
        return db.createSupplierPayment({ 
          ...rest, 
          userId: ctx.user.id,
          date: date as any,
        });
      }),
    
    deletePayment: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteSupplierPayment(input.id, ctx.user.id);
      }),
  }),

  // ============= PRODUCT COMPONENTS =============
  productComponents: router({
    list: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getProductComponents(input.productId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        productId: z.number(),
        name: z.string().min(1),
        cost: z.string(),
        quantity: z.number().default(1),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createProductComponent(input);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteProductComponent(input.id);
      }),
   }),

  // ============= PRODUCT KITS =============
  productKits: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return db.listProductKits(ctx.user.id);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getProductKitById(input.id, ctx.user.id);
      }),
    
    getItems: protectedProcedure
      .input(z.object({ kitId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getProductKitItems(input.kitId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        salePrice: z.string(),
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const { items, ...kitData } = input;
        
        // Calcular custo total do kit
        let totalCost = 0;
        for (const item of items) {
          const product = await db.getProductById(item.productId, ctx.user.id);
          if (product) {
            totalCost += parseFloat(product.cost) * item.quantity;
          }
        }
        
        const salePrice = parseFloat(input.salePrice);
        const profit = salePrice - totalCost;
        const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;
        
        // Criar kit
        const kit = await db.createProductKit({
          ...kitData,
          userId: ctx.user.id,
          totalCost: totalCost.toFixed(2),
          profit: profit.toFixed(2),
          profitMargin: profitMargin.toFixed(2),
          isActive: true,
        });
        
        // Criar itens do kit
        if (kit) {
          for (const item of items) {
            await db.createProductKitItem({
              kitId: kit.id,
              productId: item.productId,
              quantity: item.quantity,
            });
          }
        }
        
        return kit;
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        salePrice: z.string().optional(),
        isActive: z.boolean().optional(),
        // Componentes do kit (opcional - se fornecido, substitui todos os itens)
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number().min(1),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, items, ...baseData } = input;
        const extraData: Record<string, string> = {};
        
        // Se items foi fornecido, recalcular custo e atualizar componentes
        if (items !== undefined) {
          let totalCost = 0;
          for (const item of items) {
            const product = await db.getProductById(item.productId, ctx.user.id);
            if (product) {
              totalCost += parseFloat(product.cost) * item.quantity;
            }
          }
          
          const salePrice = baseData.salePrice ? parseFloat(baseData.salePrice) : null;
          if (salePrice !== null) {
            const profit = salePrice - totalCost;
            const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;
            extraData.totalCost = totalCost.toFixed(2);
            extraData.profit = profit.toFixed(2);
            extraData.profitMargin = profitMargin.toFixed(2);
          } else {
            // Buscar salePrice atual do kit
            const currentKit = await db.getProductKitById(id, ctx.user.id);
            if (currentKit) {
              const currentSalePrice = parseFloat(currentKit.salePrice || "0");
              const profit = currentSalePrice - totalCost;
              const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;
              extraData.totalCost = totalCost.toFixed(2);
              extraData.profit = profit.toFixed(2);
              extraData.profitMargin = profitMargin.toFixed(2);
            }
          }
          
          // Substituir todos os itens do kit: deletar existentes e criar novos
          const dbInstance = await (db as any).getDb?.() || null;
          // Usar funções existentes: deletar itens antigos e criar novos
          const currentItems = await db.getProductKitItems(id);
          for (const ci of currentItems) {
            await db.deleteProductKitItem(ci.id);
          }
          for (const item of items) {
            await db.createProductKitItem({ kitId: id, productId: item.productId, quantity: item.quantity });
          }
        } else if (baseData.salePrice) {
          // Se apenas o preço mudou, recalcular lucro
          const currentKit = await db.getProductKitById(id, ctx.user.id);
          if (currentKit) {
            const salePrice = parseFloat(baseData.salePrice);
            const totalCost = parseFloat(currentKit.totalCost || "0");
            const profit = salePrice - totalCost;
            const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;
            extraData.profit = profit.toFixed(2);
            extraData.profitMargin = profitMargin.toFixed(2);
          }
        }
        
        return db.updateProductKit(id, ctx.user.id, { ...baseData, ...extraData });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteProductKit(input.id, ctx.user.id);
      }),
    
    deleteItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteProductKitItem(input.id);
      }),
    
    checkStock: protectedProcedure
      .input(z.object({ kitId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.checkKitStock(input.kitId);
      }),
    
    sellKit: protectedProcedure
      .input(z.object({
        kitId: z.number(),
        quantity: z.number().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar estoque
        const stockCheck = await db.checkKitStock(input.kitId);
        if (!stockCheck.hasStock) {
          throw new Error(`Estoque insuficiente: ${stockCheck.insufficientItems.map(i => `${i.productName} (disponível: ${i.available}, necessário: ${i.required})`).join(', ')}`);
        }
        
        // Baixar estoque dos produtos do kit
        await db.decreaseKitStock(input.kitId, ctx.user.id, input.quantity);
        
        return { success: true };
      }),
  }),

  // ============= SALES REPORTS =============
  reports: router({
    topSellingProducts: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getTopSellingProducts(ctx.user.id, input.startDate, input.endDate);
      }),
    
    salesByDay: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getSalesByDay(ctx.user.id, input.startDate, input.endDate);
      }),
    
    salesSummary: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getSalesSummary(ctx.user.id, input.startDate, input.endDate);
      }),

    productDetail: protectedProcedure
      .input(z.object({
        productId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getSalesByProductAndDay(ctx.user.id, input.productId, input.startDate, input.endDate);
      }),
  }),

  // ============= COLABORADORES =============
  collaborators: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return db.listCollaborators(ctx.user.id);
      }),

    invite: protectedProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se já existe
        const existing = await db.getCollaboratorByEmail(ctx.user.id, input.email);
        if (existing) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Este email já foi convidado.' });
        }
        // Gerar token único
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const collab = await db.createCollaborator({
          ownerId: ctx.user.id,
          email: input.email,
          name: input.name,
          inviteToken: token,
        });
        // Criar permissões padrão (somente visualização no dashboard)
        await db.saveCollaboratorPermissions(collab!.id, [
          { section: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
        ]);
        return { collaborator: collab, inviteToken: token };
      }),

    updatePermissions: protectedProcedure
      .input(z.object({
        collaboratorId: z.number(),
        permissions: z.array(z.object({
          section: z.string(),
          canView: z.boolean(),
          canCreate: z.boolean(),
          canEdit: z.boolean(),
          canDelete: z.boolean(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar que o colaborador pertence ao dono
        const collabs = await db.listCollaborators(ctx.user.id);
        const collab = collabs.find(c => c.id === input.collaboratorId);
        if (!collab) throw new TRPCError({ code: 'NOT_FOUND', message: 'Colaborador não encontrado.' });
        await db.saveCollaboratorPermissions(input.collaboratorId, input.permissions);
        return { success: true };
      }),

    getPermissions: protectedProcedure
      .input(z.object({ collaboratorId: z.number() }))
      .query(async ({ ctx, input }) => {
        const collabs = await db.listCollaborators(ctx.user.id);
        const collab = collabs.find(c => c.id === input.collaboratorId);
        if (!collab) throw new TRPCError({ code: 'NOT_FOUND', message: 'Colaborador não encontrado.' });
        return db.getCollaboratorPermissions(input.collaboratorId);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        collaboratorId: z.number(),
        status: z.enum(['active', 'inactive']),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.updateCollaboratorStatus(input.collaboratorId, ctx.user.id, input.status);
      }),

    delete: protectedProcedure
      .input(z.object({ collaboratorId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteCollaborator(input.collaboratorId, ctx.user.id);
      }),

    // Rota para o colaborador aceitar o convite e ativar a conta
    acceptInvite: protectedProcedure
      .input(z.object({ inviteToken: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        let collab = null;
        
        // Tentar ativar pelo token
        if (input.inviteToken) {
          collab = await db.activateCollaborator(input.inviteToken, ctx.user.id, ctx.user.name || undefined);
        }
        
        // Fallback: ativar pelo email do usuário logado (caso o token tenha sido perdido)
        if (!collab && ctx.user.email) {
          collab = await db.activateCollaboratorByEmail(ctx.user.email, ctx.user.id, ctx.user.name || undefined);
        }
        
        if (!collab) throw new TRPCError({ code: 'NOT_FOUND', message: 'Convite inválido, expirado ou não encontrado para este email.' });
        return collab;
      }),

    // Rota para o colaborador aceitar convite pendente pelo email (sem precisar do token)
    acceptPendingInvite: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user.email) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email não encontrado.' });
        const collab = await db.activateCollaboratorByEmail(ctx.user.email, ctx.user.id, ctx.user.name || undefined);
        if (!collab) throw new TRPCError({ code: 'NOT_FOUND', message: 'Nenhum convite pendente encontrado para este email.' });
        return collab;
      }),

    // Rota para verificar se o usuário logado é colaborador de alguém
    myCollaboratorInfo: protectedProcedure
      .query(async ({ ctx }) => {
        const collab = await db.getCollaboratorByUserId(ctx.user.id);
        if (!collab) return null;
        const permissions = await db.getCollaboratorPermissions(collab.id);
        return { collaborator: collab, permissions };
      }),
  }),
});
export type AppRouter = typeof appRouter;
