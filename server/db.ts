import { eq, and, desc, gte, lte, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  bankAccounts, InsertBankAccount,
  transactions, InsertTransaction,
  investments, InsertInvestment,
  investmentReturns, InsertInvestmentReturn,
  sales, InsertSale,
  saleItems, InsertSaleItem,
  services, InsertService,
  serviceOrders, InsertServiceOrder,
  serviceOrderItems, InsertServiceOrderItem,
  expenses, InsertExpense,
  debtors, InsertDebtor,
  debtorPayments, InsertDebtorPayment,
  products, InsertProduct,
  productComponents, InsertProductComponent,
  purchases, InsertPurchase,
  suppliers, InsertSupplier,
  supplierPayments, InsertSupplierPayment,
  productKits, InsertProductKit,
  productKitItems, InsertProductKitItem,
  collaborators, InsertCollaborator,
  collaboratorPermissions, InsertCollaboratorPermission
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= USERS =============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============= BANK ACCOUNTS =============
export async function getBankAccounts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId)).orderBy(bankAccounts.name);
}

export async function getBankAccountById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bankAccounts).where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId))).limit(1);
  return result[0];
}

export async function createBankAccount(account: InsertBankAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bankAccounts).values(account);
  return result;
}

export async function updateBankAccount(id: number, userId: number, data: Partial<InsertBankAccount>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(bankAccounts).set(data).where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)));
}

export async function deleteBankAccount(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(bankAccounts).where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)));
}

// ============= TRANSACTIONS =============
export async function getTransactions(userId: number, accountId?: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions = [eq(transactions.userId, userId)];
  if (accountId) conditions.push(eq(transactions.accountId, accountId));
  if (startDate) conditions.push(sql`${transactions.date} >= ${startDate}`);
  if (endDate) conditions.push(sql`${transactions.date} <= ${endDate}`);
  
  return db.select().from(transactions).where(and(...conditions)).orderBy(desc(transactions.date), desc(transactions.createdAt));
}

export async function createTransaction(transaction: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Atualizar saldo da conta
  const account = await getBankAccountById(transaction.accountId, transaction.userId);
  if (account) {
    const amount = parseFloat(transaction.amount.toString());
    const newBalance = parseFloat(account.balance.toString()) + (transaction.type === 'income' ? amount : -amount);
    await updateBankAccount(transaction.accountId, transaction.userId, { balance: newBalance.toString() });
  }
  
  return db.insert(transactions).values(transaction);
}

export async function deleteTransaction(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Reverter saldo da conta
  const transaction = await db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId))).limit(1);
  if (transaction[0]) {
    const account = await getBankAccountById(transaction[0].accountId, userId);
    if (account) {
      const amount = parseFloat(transaction[0].amount.toString());
      const newBalance = parseFloat(account.balance.toString()) - (transaction[0].type === 'income' ? amount : -amount);
      await updateBankAccount(transaction[0].accountId, userId, { balance: newBalance.toString() });
    }
  }
  
  return db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}

// ============= INVESTMENTS =============
export async function getInvestments(userId: number, isActive?: boolean) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions = [eq(investments.userId, userId)];
  if (isActive !== undefined) conditions.push(eq(investments.isActive, isActive));
  
  return db.select().from(investments).where(and(...conditions)).orderBy(investments.code);
}

export async function createInvestment(investment: InsertInvestment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(investments).values(investment);
}

export async function updateInvestment(id: number, userId: number, data: Partial<InsertInvestment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(investments).set(data).where(and(eq(investments.id, id), eq(investments.userId, userId)));
}

export async function deleteInvestment(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(investments).where(and(eq(investments.id, id), eq(investments.userId, userId)));
}

// ============= INVESTMENT RETURNS =============
export async function getInvestmentReturns(userId: number, investmentId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions = [eq(investmentReturns.userId, userId)];
  if (investmentId) conditions.push(eq(investmentReturns.investmentId, investmentId));
  
  return db.select().from(investmentReturns).where(and(...conditions)).orderBy(desc(investmentReturns.date));
}

export async function createInvestmentReturn(investmentReturn: InsertInvestmentReturn) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(investmentReturns).values(investmentReturn);
}

// ============= SALES =============
export async function getSales(userId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions = [eq(sales.userId, userId)];
  if (startDate) conditions.push(sql`${sales.date} >= ${startDate}`);
  if (endDate) conditions.push(sql`${sales.date} <= ${endDate}`);
  
  return db.select().from(sales).where(and(...conditions)).orderBy(desc(sales.date));
}

export async function createSale(sale: InsertSale, items?: Array<{
  productId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  isKit?: boolean; // Flag para indicar se é kit
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Se items foi fornecido, calcular totais a partir dos itens
  let amount: number;
  let cost: number;
  let profit: number;
  
  if (items && items.length > 0) {
    amount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    cost = items.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);
    profit = amount - cost;
  } else {
    // Modo legado: calcular a partir de amount/cost diretos
    amount = parseFloat(sale.amount.toString());
    cost = parseFloat((sale.cost || 0).toString());
    profit = amount - cost;
  }
  
  // Inserir venda
  const result = await db.insert(sales).values({ 
    ...sale, 
    amount: amount.toString(),
    cost: cost.toString(),
    profit: profit.toString() 
  });
  
  const saleId = Number(result[0].insertId);
  
  // Se items foi fornecido, inserir itens e abater estoque
  if (items && items.length > 0) {
    for (const item of items) {
      const totalPrice = item.unitPrice * item.quantity;
      const totalCost = item.unitCost * item.quantity;
      
      // Inserir item
      await db.insert(saleItems).values({
        saleId,
        productId: item.productId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        unitCost: item.unitCost.toString(),
        totalPrice: totalPrice.toString(),
        totalCost: totalCost.toString()
      });
      
      // Se productId foi fornecido, verificar se é kit ou produto
      if (item.productId) {
        if (item.isKit) {
          // É um kit: buscar componentes e abater estoque de cada um
          const kitItems = await db.select().from(productKitItems).where(
            eq(productKitItems.kitId, item.productId)
          );
          
          // Abater estoque de cada produto do kit
          for (const kitItem of kitItems) {
            const product = await db.select().from(products).where(
              and(eq(products.id, kitItem.productId), eq(products.userId, sale.userId))
            ).limit(1);
            
            if (product[0]) {
              const currentQuantity = product[0].quantity || 0;
              const quantityToDeduct = kitItem.quantity * item.quantity; // quantidade do kit * quantidade vendida
              if (currentQuantity >= quantityToDeduct) {
                await db.update(products)
                  .set({ quantity: currentQuantity - quantityToDeduct, updatedAt: new Date() })
                  .where(eq(products.id, kitItem.productId));
              }
            }
          }
        } else {
          // É um produto individual
          const product = await db.select().from(products).where(
            and(eq(products.id, item.productId), eq(products.userId, sale.userId))
          ).limit(1);
          
          if (product[0]) {
            const currentQuantity = product[0].quantity || 0;
            if (currentQuantity >= item.quantity) {
              await db.update(products)
                .set({ quantity: currentQuantity - item.quantity, updatedAt: new Date() })
                .where(eq(products.id, item.productId));
            }
          }
        }
      }
    }
  }
  // Modo legado: Se productId foi fornecido diretamente na venda, abater quantidade do estoque
  else if (sale.productId) {
    const product = await db.select().from(products).where(
      and(eq(products.id, sale.productId), eq(products.userId, sale.userId))
    ).limit(1);
    
    if (product[0]) {
      const currentQuantity = product[0].quantity || 0;
      if (currentQuantity > 0) {
        await db.update(products)
          .set({ quantity: currentQuantity - 1, updatedAt: new Date() })
          .where(eq(products.id, sale.productId));
      }
    }
  }
  
  // Se source = debtor, criar/atualizar devedor (somente se amount > 0)
  if (sale.source === "debtor" && sale.customerName && amount > 0) {
    // Verificar se já existe devedor com esse nome
    const existingDebtor = await db.select().from(debtors).where(
      and(eq(debtors.userId, sale.userId), eq(debtors.name, sale.customerName))
    ).limit(1);
    
    if (existingDebtor[0]) {
      // Atualizar devedor existente
      const newTotal = (parseFloat(existingDebtor[0].totalAmount) + amount).toFixed(2);
      const newRemaining = (parseFloat(existingDebtor[0].remainingAmount) + amount).toFixed(2);
      await db.update(debtors)
        .set({ 
          totalAmount: newTotal,
          remainingAmount: newRemaining,
          status: "pending"
        })
        .where(eq(debtors.id, existingDebtor[0].id));
    } else {
      // Criar novo devedor
      await db.insert(debtors).values({
        userId: sale.userId,
        name: sale.customerName,
        totalAmount: amount.toFixed(2),
        paidAmount: "0",
        remainingAmount: amount.toFixed(2),
        status: "pending",
        description: sale.description
      });
    }
  }
  
  // Atualizar saldo da conta bancária se especificada (apenas se não for devedor)
  if (sale.accountId && sale.source !== "debtor") {
    const account = await db.select().from(bankAccounts).where(
      and(eq(bankAccounts.id, sale.accountId), eq(bankAccounts.userId, sale.userId))
    ).limit(1);
    
    if (account[0]) {
      const currentBalance = parseFloat(account[0].balance);
      const newBalance = (currentBalance + amount).toFixed(2);
      
      await db.update(bankAccounts)
        .set({ balance: newBalance })
        .where(and(eq(bankAccounts.id, sale.accountId), eq(bankAccounts.userId, sale.userId)));
      
      // Criar transação no histórico
      // sale.date já é um objeto Date do banco, usar diretamente
      const localDate = sale.date;
      await db.insert(transactions).values({
        userId: sale.userId,
        accountId: sale.accountId,
        type: "income",
        category: "Venda",
        amount: amount.toString(),
        description: `Venda: ${sale.customerName || 'Cliente'} - ${sale.description}`,
        date: localDate
      });
    }
  }
  
  return result;
}

export async function updateSale(id: number, userId: number, data: Partial<InsertSale>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar venda atual antes de atualizar
  const currentSale = await db.select().from(sales).where(and(eq(sales.id, id), eq(sales.userId, userId))).limit(1);
  if (!currentSale[0]) throw new Error("Venda não encontrada");
  
  const oldSale = currentSale[0];
  const oldAmount = parseFloat(oldSale.amount.toString());
  const newAmount = data.amount ? parseFloat(data.amount.toString()) : oldAmount;
  const newCost = data.cost ? parseFloat(data.cost.toString()) : parseFloat(oldSale.cost.toString());
  const amountDiff = newAmount - oldAmount;
  
  // Recalcular lucro
  if (data.amount || data.cost) {
    data.profit = (newAmount - newCost).toString();
  }
  
  // Ajustar conta bancária se valor ou conta mudou (vendas não-devedor)
  const oldAccountId = oldSale.accountId;
  const newAccountId = data.accountId !== undefined ? data.accountId : oldAccountId;
  const oldSource = oldSale.source;
  const newSource = data.source || oldSource;
  
  const oldDescription = `Venda: ${oldSale.customerName || 'Cliente'} - ${oldSale.description}`;
  
  // Reverter saldo antigo se tinha conta e não era devedor
  if (oldAccountId && oldSource !== "debtor") {
    const oldAccount = await db.select().from(bankAccounts).where(
      and(eq(bankAccounts.id, oldAccountId), eq(bankAccounts.userId, userId))
    ).limit(1);
    if (oldAccount[0]) {
      const newBalance = (parseFloat(oldAccount[0].balance) - oldAmount).toFixed(2);
      await db.update(bankAccounts).set({ balance: newBalance }).where(eq(bankAccounts.id, oldAccountId));
    }
    // Remover transação antiga
    await db.delete(transactions).where(
      and(eq(transactions.userId, userId), eq(transactions.accountId, oldAccountId), eq(transactions.description, oldDescription), eq(transactions.type, "income"))
    );
  }
  
  // Aplicar novo saldo se tem conta e não é devedor
  if (newAccountId && newSource !== "debtor") {
    const newAccount = await db.select().from(bankAccounts).where(
      and(eq(bankAccounts.id, newAccountId), eq(bankAccounts.userId, userId))
    ).limit(1);
    if (newAccount[0]) {
      const updatedBalance = (parseFloat(newAccount[0].balance) + newAmount).toFixed(2);
      await db.update(bankAccounts).set({ balance: updatedBalance }).where(eq(bankAccounts.id, newAccountId));
    }
    // Criar nova transação
    const newDesc = `Venda: ${data.customerName || oldSale.customerName || 'Cliente'} - ${data.description || oldSale.description}`;
    await db.insert(transactions).values({
      userId, accountId: newAccountId, type: "income", category: "Venda",
      amount: newAmount.toString(), description: newDesc, date: data.date || oldSale.date
    });
  }
  
  // Ajustar devedor se era/é venda de devedor
  if (oldSource === "debtor" && oldSale.customerName) {
    // Reverter valor antigo do devedor
    const oldDebtor = await db.select().from(debtors).where(
      and(eq(debtors.userId, userId), eq(debtors.name, oldSale.customerName))
    ).limit(1);
    if (oldDebtor[0]) {
      const newTotal = (parseFloat(oldDebtor[0].totalAmount) - oldAmount).toFixed(2);
      const newRemaining = (parseFloat(oldDebtor[0].remainingAmount) - oldAmount).toFixed(2);
      if (parseFloat(newTotal) <= 0) {
        await db.delete(debtors).where(eq(debtors.id, oldDebtor[0].id));
      } else {
        await db.update(debtors).set({ totalAmount: newTotal, remainingAmount: newRemaining, status: parseFloat(newRemaining) <= 0 ? "paid" : "pending" }).where(eq(debtors.id, oldDebtor[0].id));
      }
    }
  }
  if (newSource === "debtor") {
    const custName = data.customerName || oldSale.customerName;
    if (custName && newAmount > 0) {
      const existingDebtor = await db.select().from(debtors).where(
        and(eq(debtors.userId, userId), eq(debtors.name, custName))
      ).limit(1);
      if (existingDebtor[0]) {
        const newTotal = (parseFloat(existingDebtor[0].totalAmount) + newAmount).toFixed(2);
        const newRemaining = (parseFloat(existingDebtor[0].remainingAmount) + newAmount).toFixed(2);
        await db.update(debtors).set({ totalAmount: newTotal, remainingAmount: newRemaining, status: "pending" }).where(eq(debtors.id, existingDebtor[0].id));
      } else {
        await db.insert(debtors).values({ userId, name: custName, totalAmount: newAmount.toFixed(2), paidAmount: "0", remainingAmount: newAmount.toFixed(2), status: "pending", description: data.description || oldSale.description });
      }
    }
  }
  
  return db.update(sales).set(data).where(and(eq(sales.id, id), eq(sales.userId, userId)));
}

export async function deleteSale(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar a venda para pegar os dados antes de deletar
  const sale = await db.select().from(sales).where(and(eq(sales.id, id), eq(sales.userId, userId))).limit(1);
  if (!sale[0]) throw new Error("Venda não encontrada");
  
  const saleData = sale[0];
  const amount = parseFloat(saleData.amount.toString());
  
  // Se a venda é de devedor, atualizar/deletar registro de devedor
  if (saleData.source === "debtor" && saleData.customerName) {
    const debtor = await db.select().from(debtors).where(
      and(eq(debtors.userId, userId), eq(debtors.name, saleData.customerName))
    ).limit(1);
    
    if (debtor[0]) {
      const newTotal = (parseFloat(debtor[0].totalAmount) - amount).toFixed(2);
      const newRemaining = (parseFloat(debtor[0].remainingAmount) - amount).toFixed(2);
      
      // Se o novo total for zero ou negativo, deletar o devedor
      if (parseFloat(newTotal) <= 0) {
        await db.delete(debtors).where(eq(debtors.id, debtor[0].id));
      } else {
        // Caso contrário, atualizar os valores
        await db.update(debtors)
          .set({ 
            totalAmount: newTotal,
            remainingAmount: newRemaining,
            status: parseFloat(newRemaining) <= 0 ? "paid" : "pending"
          })
          .where(eq(debtors.id, debtor[0].id));
      }
    }
  }
  
  // Se a venda tem conta bancária associada e não é devedor, reverter saldo e deletar transação
  if (saleData.accountId && saleData.source !== "debtor") {
    // Reverter saldo da conta bancária
    const account = await db.select().from(bankAccounts).where(
      and(eq(bankAccounts.id, saleData.accountId), eq(bankAccounts.userId, userId))
    ).limit(1);
    
    if (account[0]) {
      const currentBalance = parseFloat(account[0].balance);
      const newBalance = (currentBalance - amount).toFixed(2);
      
      await db.update(bankAccounts)
        .set({ balance: newBalance })
        .where(and(eq(bankAccounts.id, saleData.accountId), eq(bankAccounts.userId, userId)));
      
      // Deletar transação do histórico
      const description = `Venda: ${saleData.customerName || 'Cliente'} - ${saleData.description}`;
      await db.delete(transactions).where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.accountId, saleData.accountId),
          eq(transactions.description, description),
          eq(transactions.type, "income")
        )
      );
    }
  }
  
  // Deletar itens da venda
  await db.delete(saleItems).where(eq(saleItems.saleId, id));
  
  // Deletar a venda
  return db.delete(sales).where(and(eq(sales.id, id), eq(sales.userId, userId)));
}

// ============= SALE ITEMS =============
export async function getSaleItems(saleId: number): Promise<Array<{
  id: number;
  saleId: number;
  productId: number | null;
  description: string;
  quantity: number;
  unitPrice: string;
  unitCost: string;
  totalPrice: string;
  totalCost: string;
}>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const items = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId)).orderBy(saleItems.id);
  return items as any;
}

// ============= SERVICES =============
export async function getServices(userId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions = [eq(services.userId, userId)];
  if (startDate) conditions.push(sql`${services.date} >= ${startDate}`);
  if (endDate) conditions.push(sql`${services.date} <= ${endDate}`);
  
  return db.select().from(services).where(and(...conditions)).orderBy(desc(services.date));
}

export async function createService(service: InsertService) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const amount = parseFloat((service.amount || "0").toString());
  const cost = parseFloat((service.cost || "0").toString());
  const profit = amount - cost;
  
  // Inserir serviço
  const result = await db.insert(services).values({ ...service, profit: profit.toString() });
  
  // Serviços vão para devedores se tiver cliente e amount > 0
  if (service.customerName && amount > 0) {
    // Verificar se já existe devedor com esse nome
    const existingDebtor = await db.select().from(debtors).where(
      and(eq(debtors.userId, service.userId), eq(debtors.name, service.customerName))
    ).limit(1);
    
    if (existingDebtor[0]) {
      // Atualizar devedor existente
      const newTotal = (parseFloat(existingDebtor[0].totalAmount) + amount).toFixed(2);
      const newRemaining = (parseFloat(existingDebtor[0].remainingAmount) + amount).toFixed(2);
      await db.update(debtors)
        .set({ 
          totalAmount: newTotal,
          remainingAmount: newRemaining,
          status: "pending"
        })
        .where(eq(debtors.id, existingDebtor[0].id));
    } else {
      // Criar novo devedor
      const description = service.osNumber 
        ? `OS ${service.osNumber} - ${service.description}`
        : service.description;
      
      await db.insert(debtors).values({
        userId: service.userId,
        name: service.customerName,
        totalAmount: amount.toFixed(2),
        paidAmount: "0",
        remainingAmount: amount.toFixed(2),
        status: "pending",
        description
      });
    }
  }
  
  // Não atualiza conta bancária pois vai para devedores
  
  return result;
}

export async function updateService(id: number, userId: number, data: Partial<InsertService>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar serviço atual
  const currentService = await db.select().from(services).where(and(eq(services.id, id), eq(services.userId, userId))).limit(1);
  if (!currentService[0]) throw new Error("Service not found");
  
  const oldService = currentService[0];
  const oldAmount = parseFloat((oldService.amount || "0").toString());
  const newAmount = data.amount ? parseFloat(data.amount.toString()) : oldAmount;
  
  if (data.amount || data.cost) {
    const cost = data.cost ? parseFloat(data.cost.toString()) : parseFloat((oldService.cost || "0").toString());
    data.profit = (newAmount - cost).toString();
  }
  
  // Se o serviço JÁ estava concluído e tinha devedor, reverter valor antigo do devedor
  const wasCompleted = oldService.status === "completed";
  const oldCustomerName = oldService.customerName;
  const oldServiceType = oldService.serviceType;
  const hadDebtor = wasCompleted && oldCustomerName && oldServiceType !== "no_repair" && oldAmount > 0;
  
  if (hadDebtor) {
    const oldDebtor = await db.select().from(debtors).where(
      and(eq(debtors.userId, userId), eq(debtors.name, oldCustomerName!))
    ).limit(1);
    if (oldDebtor[0]) {
      const newTotal = (parseFloat(oldDebtor[0].totalAmount) - oldAmount).toFixed(2);
      const newRemaining = (parseFloat(oldDebtor[0].remainingAmount) - oldAmount).toFixed(2);
      if (parseFloat(newTotal) <= 0) {
        await db.delete(debtors).where(eq(debtors.id, oldDebtor[0].id));
      } else {
        await db.update(debtors).set({ totalAmount: newTotal, remainingAmount: newRemaining, status: parseFloat(newRemaining) <= 0 ? "paid" : "pending" }).where(eq(debtors.id, oldDebtor[0].id));
      }
    }
  }
  
  // Se tipo mudou para "repaired", "test" ou "no_repair", marcar como concluído automaticamente
  const newServiceType = data.serviceType || oldServiceType;
  const willComplete = (data.serviceType && (data.serviceType === "repaired" || data.serviceType === "test" || data.serviceType === "no_repair")) || wasCompleted;
  
  if (willComplete) {
    if (data.serviceType) data.status = "completed";
    
    const shouldCreateDebtor = newServiceType !== "no_repair";
    const customerName = data.customerName || oldCustomerName;
    
    if (shouldCreateDebtor && newAmount > 0 && customerName) {
      const existingDebtor = await db.select().from(debtors).where(
        and(eq(debtors.userId, userId), eq(debtors.name, customerName))
      ).limit(1);
      
      if (existingDebtor[0]) {
        const currentTotal = parseFloat(existingDebtor[0].totalAmount);
        const newTotal = currentTotal + newAmount;
        const currentPaid = parseFloat(existingDebtor[0].paidAmount || "0");
        const newRemaining = newTotal - currentPaid;
        
        await db.update(debtors)
          .set({
            totalAmount: newTotal.toFixed(2),
            remainingAmount: newRemaining.toFixed(2),
            status: newRemaining <= 0 ? "paid" : (currentPaid > 0 ? "partial" : "pending"),
            updatedAt: new Date(),
          })
          .where(eq(debtors.id, existingDebtor[0].id));
      } else {
        await db.insert(debtors).values({
          userId,
          name: customerName,
          totalAmount: newAmount.toFixed(2),
          paidAmount: "0",
          remainingAmount: newAmount.toFixed(2),
          status: "pending",
        });
      }
    }
  }
  
  return db.update(services).set(data).where(and(eq(services.id, id), eq(services.userId, userId)));
}

export async function deleteService(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar serviço antes de deletar
  const service = await db.select().from(services).where(and(eq(services.id, id), eq(services.userId, userId))).limit(1);
  if (!service[0]) throw new Error("Serviço não encontrado");
  
  const svc = service[0];
  
  // Se serviço estava concluído e tinha cliente, reverter devedor
  if (svc.status === "completed" && svc.customerName && svc.serviceType !== "no_repair") {
    const amount = parseFloat((svc.amount || "0").toString());
    if (amount > 0) {
      const debtor = await db.select().from(debtors).where(
        and(eq(debtors.userId, userId), eq(debtors.name, svc.customerName))
      ).limit(1);
      if (debtor[0]) {
        const newTotal = (parseFloat(debtor[0].totalAmount) - amount).toFixed(2);
        const newRemaining = (parseFloat(debtor[0].remainingAmount) - amount).toFixed(2);
        if (parseFloat(newTotal) <= 0) {
          await db.delete(debtors).where(eq(debtors.id, debtor[0].id));
        } else {
          await db.update(debtors).set({ totalAmount: newTotal, remainingAmount: newRemaining, status: parseFloat(newRemaining) <= 0 ? "paid" : "pending" }).where(eq(debtors.id, debtor[0].id));
        }
      }
    }
  }
  
  // Se serviço tinha conta bancária e estava concluído, reverter saldo
  if (svc.accountId && svc.status === "completed") {
    const amount = parseFloat((svc.amount || "0").toString());
    if (amount > 0) {
      const account = await db.select().from(bankAccounts).where(
        and(eq(bankAccounts.id, svc.accountId), eq(bankAccounts.userId, userId))
      ).limit(1);
      if (account[0]) {
        const newBalance = (parseFloat(account[0].balance) - amount).toFixed(2);
        await db.update(bankAccounts).set({ balance: newBalance }).where(eq(bankAccounts.id, svc.accountId));
      }
    }
  }
  
  return db.delete(services).where(and(eq(services.id, id), eq(services.userId, userId)));
}

export async function completeService(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar serviço
  const service = await db.select().from(services).where(
    and(eq(services.id, id), eq(services.userId, userId))
  ).limit(1);
  
  if (!service[0]) throw new Error("Service not found");
  
  // Marcar como concluído
  await db.update(services)
    .set({ status: "completed", updatedAt: new Date() })
    .where(and(eq(services.id, id), eq(services.userId, userId)));
  
  // Criar/atualizar devedor com o valor do serviço
  const amount = parseFloat(service[0].amount || "0");
  
  if (amount > 0 && service[0].customerName) {
    // Verificar se já existe devedor com esse nome
    const existingDebtor = await db.select().from(debtors).where(
      and(eq(debtors.userId, userId), eq(debtors.name, service[0].customerName))
    ).limit(1);
    
    if (existingDebtor[0]) {
      // Atualizar devedor existente
      const currentTotal = parseFloat(existingDebtor[0].totalAmount);
      const newTotal = currentTotal + amount;
      const currentPaid = parseFloat(existingDebtor[0].paidAmount || "0");
      const newRemaining = newTotal - currentPaid;
      
      await db.update(debtors)
        .set({
          totalAmount: newTotal.toFixed(2),
          remainingAmount: newRemaining.toFixed(2),
          status: newRemaining <= 0 ? "paid" : (currentPaid > 0 ? "partial" : "pending"),
          updatedAt: new Date(),
        })
        .where(eq(debtors.id, existingDebtor[0].id));
    } else {
      // Criar novo devedor
      await db.insert(debtors).values({
        userId,
        name: service[0].customerName,
        totalAmount: amount.toFixed(2),
        paidAmount: "0",
        remainingAmount: amount.toFixed(2),
        status: "pending",
      });
    }
  }
  
  return { success: true };
}

// ============= EXPENSES =============
export async function getExpenses(userId: number, startDate?: string, endDate?: string, category?: string) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions = [eq(expenses.userId, userId)];
  if (startDate) conditions.push(sql`${expenses.date} >= ${startDate}`);
  if (endDate) conditions.push(sql`${expenses.date} <= ${endDate}`);
  if (category) conditions.push(eq(expenses.category, category as any));
  
  return db.select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.date));
}

export async function createExpense(expense: InsertExpense) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Inserir despesa
  const result = await db.insert(expenses).values(expense);
  
  // Abater valor da conta bancária se accountId foi fornecido
  if (expense.accountId) {
    const expenseAmount = parseFloat(expense.amount.toString());
    
    // Buscar saldo atual da conta
    const account = await db.select().from(bankAccounts).where(
      and(eq(bankAccounts.id, expense.accountId), eq(bankAccounts.userId, expense.userId))
    ).limit(1);
    
    if (account[0]) {
      const currentBalance = parseFloat(account[0].balance);
      const newBalance = currentBalance - expenseAmount;
      
      // Atualizar saldo da conta
      await db.update(bankAccounts)
        .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
        .where(eq(bankAccounts.id, expense.accountId));
      
      // Criar transação no histórico bancário
      await db.insert(transactions).values({
        userId: expense.userId,
        accountId: expense.accountId,
        type: "expense",
        category: expense.category || "Despesa",
        amount: expenseAmount.toString(),
        description: expense.description || "Despesa",
        date: expense.date
      });
    }
  }
  
  return result;
}

export async function updateExpense(id: number, userId: number, data: Partial<InsertExpense>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(expenses).set(data).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
}

export async function deleteExpense(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar dados da despesa antes de deletar
  const expense = await db.select().from(expenses).where(
    and(eq(expenses.id, id), eq(expenses.userId, userId))
  ).limit(1);
  
  if (!expense[0]) {
    throw new Error("Expense not found");
  }
  
  const expenseData = expense[0];
  const amount = parseFloat(expenseData.amount.toString());
  
  // Se a despesa tem conta bancária associada, reverter saldo e deletar transação
  if (expenseData.accountId) {
    // Reverter saldo da conta bancária (adicionar de volta o valor)
    const account = await db.select().from(bankAccounts).where(
      and(eq(bankAccounts.id, expenseData.accountId), eq(bankAccounts.userId, userId))
    ).limit(1);
    
    if (account[0]) {
      const currentBalance = parseFloat(account[0].balance);
      const newBalance = (currentBalance + amount).toFixed(2);
      
      await db.update(bankAccounts)
        .set({ balance: newBalance, updatedAt: new Date() })
        .where(eq(bankAccounts.id, expenseData.accountId));
      
      // Deletar transação do histórico bancário
      await db.delete(transactions).where(
        and(
          eq(transactions.accountId, expenseData.accountId),
          eq(transactions.userId, userId),
          eq(transactions.description, expenseData.description || "Despesa"),
          eq(transactions.type, "expense")
        )
      );
    }
  }
  
  // Deletar a despesa
  return db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
}

// ============= DEBTORS =============
export async function getDebtors(userId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions = [eq(debtors.userId, userId)];
  if (status === 'pending') {
    // Mostrar tanto 'pending' quanto 'partial' (todos com saldo em aberto)
    conditions.push(inArray(debtors.status, ['pending', 'partial'] as any[]));
  } else if (status) {
    conditions.push(eq(debtors.status, status as any));
  }
  
  return db.select().from(debtors).where(and(...conditions)).orderBy(debtors.name);
}

export async function createDebtor(debtor: InsertDebtor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const totalAmount = parseFloat(debtor.totalAmount.toString());
  const paidAmount = parseFloat(debtor.paidAmount?.toString() || "0");
  const remainingAmount = totalAmount - paidAmount;
  
  return db.insert(debtors).values({ 
    ...debtor, 
    remainingAmount: remainingAmount.toString(),
    status: remainingAmount === 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'pending')
  });
}

export async function updateDebtor(id: number, userId: number, data: Partial<InsertDebtor>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (data.totalAmount || data.paidAmount) {
    const currentDebtor = await db.select().from(debtors).where(and(eq(debtors.id, id), eq(debtors.userId, userId))).limit(1);
    if (currentDebtor[0]) {
      const totalAmount = data.totalAmount ? parseFloat(data.totalAmount.toString()) : parseFloat(currentDebtor[0].totalAmount.toString());
      const paidAmount = data.paidAmount ? parseFloat(data.paidAmount.toString()) : parseFloat(currentDebtor[0].paidAmount.toString());
      const remainingAmount = totalAmount - paidAmount;
      data.remainingAmount = remainingAmount.toString();
      data.status = remainingAmount === 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'pending');
    }
  }
  
  return db.update(debtors).set(data).where(and(eq(debtors.id, id), eq(debtors.userId, userId)));
}

export async function deleteDebtor(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(debtors).where(and(eq(debtors.id, id), eq(debtors.userId, userId)));
}

// ============= DEBTOR PAYMENTS =============
export async function getDebtorPayments(userId: number, debtorId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions = [eq(debtorPayments.userId, userId)];
  if (debtorId) conditions.push(eq(debtorPayments.debtorId, debtorId));
  
  return db.select().from(debtorPayments).where(and(...conditions)).orderBy(desc(debtorPayments.date));
}

export async function createDebtorPayment(payment: InsertDebtorPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Atualizar valor pago do devedor
  const debtor = await db.select().from(debtors).where(and(eq(debtors.id, payment.debtorId), eq(debtors.userId, payment.userId))).limit(1);
  if (debtor[0]) {
    const newPaidAmount = parseFloat(debtor[0].paidAmount.toString()) + parseFloat(payment.amount.toString());
    await updateDebtor(payment.debtorId, payment.userId, { paidAmount: newPaidAmount.toString() });
  }
  
  // Se accountId foi fornecido, atualizar saldo da conta bancária e criar transação
  if (payment.accountId) {
    const account = await db.select().from(bankAccounts).where(
      and(eq(bankAccounts.id, payment.accountId), eq(bankAccounts.userId, payment.userId))
    ).limit(1);
    
    if (account[0]) {
      const currentBalance = parseFloat(account[0].balance.toString());
      const paymentAmount = parseFloat(payment.amount.toString());
      const newBalance = currentBalance + paymentAmount;
      
      await db.update(bankAccounts)
        .set({ balance: newBalance.toString(), updatedAt: new Date() })
        .where(eq(bankAccounts.id, payment.accountId));
      
      // Criar transação no histórico
      const debtor = await db.select().from(debtors).where(eq(debtors.id, payment.debtorId)).limit(1);
      // Converter data para Date local para evitar problemas de timezone
      const dateStr = typeof payment.date === 'string' ? payment.date : payment.date.toISOString().split('T')[0];
      const paymentDate = new Date(dateStr + 'T12:00:00');
      await db.insert(transactions).values({
        userId: payment.userId,
        accountId: payment.accountId,
        type: 'income' as const,
        category: 'Recebimento de Devedor',
        amount: payment.amount,
        description: `Pagamento de ${debtor[0]?.name || 'devedor'}: ${payment.notes || 'Sem observações'}`,
        date: paymentDate,
      });
    }
  }
  
  return db.insert(debtorPayments).values(payment);
}

// ============= PRODUCTS =============
export async function getProducts(userId: number, isActive?: boolean) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions = [eq(products.userId, userId)];
  if (isActive !== undefined) conditions.push(eq(products.isActive, isActive));
  
  return db.select().from(products).where(and(...conditions)).orderBy(products.name);
}

export async function getProductById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(and(eq(products.id, id), eq(products.userId, userId))).limit(1);
  return result[0];
}

export async function createProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const cost = parseFloat(product.cost.toString());
  const salePrice = parseFloat(product.salePrice.toString());
  const profit = salePrice - cost;
  const profitMargin = cost > 0 ? (profit / cost) * 100 : 0;
  
  return db.insert(products).values({ 
    ...product, 
    profit: profit.toString(),
    profitMargin: profitMargin.toFixed(2)
  });
}

export async function updateProduct(id: number, userId: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (data.cost || data.salePrice) {
    const currentProduct = await getProductById(id, userId);
    if (currentProduct) {
      const cost = data.cost ? parseFloat(data.cost.toString()) : parseFloat(currentProduct.cost.toString());
      const salePrice = data.salePrice ? parseFloat(data.salePrice.toString()) : parseFloat(currentProduct.salePrice.toString());
      const profit = salePrice - cost;
      const profitMargin = cost > 0 ? (profit / cost) * 100 : 0;
      data.profit = profit.toString();
      data.profitMargin = profitMargin.toFixed(2);
    }
  }
  
  return db.update(products).set(data).where(and(eq(products.id, id), eq(products.userId, userId)));
}

export async function deleteProduct(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(products).where(and(eq(products.id, id), eq(products.userId, userId)));
}

// ============= PRODUCT COMPONENTS =============
export async function getProductComponents(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productComponents).where(eq(productComponents.productId, productId));
}

export async function createProductComponent(component: InsertProductComponent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(productComponents).values(component);
}

export async function deleteProductComponent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(productComponents).where(eq(productComponents.id, id));
}

// ============= DASHBOARD STATS =============
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Total em contas bancárias (excluindo Shopee e Mercado Livre)
  const accounts = await getBankAccounts(userId);
  const marketplaceKeywords = ["shopee", "mercado livre", "mercadolivre", "mercado pago"];
  const isMarketplace = (name: string) => marketplaceKeywords.some(kw => name.toLowerCase().includes(kw));
  const businessAccounts = accounts.filter(acc => !isMarketplace(acc.name));
  const marketplaceAccounts = accounts.filter(acc => isMarketplace(acc.name));
  const totalBalance = businessAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance.toString()), 0);
  const totalMarketplace = marketplaceAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance.toString()), 0);
  
  // Total em investimentos
  const activeInvestments = await getInvestments(userId, true);
  const totalInvestments = activeInvestments.reduce((sum, inv) => {
    const shares = parseFloat(inv.shares.toString());
    const currentPrice = inv.currentPrice ? parseFloat(inv.currentPrice.toString()) : parseFloat(inv.purchasePrice.toString());
    return sum + (shares * currentPrice);
  }, 0);
  
  // Total de devedores (incluindo saldo de contas marketplace como Shopee/ML)
  const activeDebtors = await getDebtors(userId);
  const totalDebtors = activeDebtors.reduce((sum, deb) => sum + parseFloat(deb.remainingAmount.toString()), 0) + totalMarketplace;
  
  // Receitas do mês atual
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const monthSales = await getSales(userId, startOfMonth, endOfMonth);
  const monthServices = await getServices(userId, startOfMonth, endOfMonth);
  const monthIncome = monthSales.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) +
                      monthServices.reduce((sum, s) => sum + parseFloat((s.amount || "0").toString()), 0);
  
  // Despesas do mês atual
  const monthExpenses = await getExpenses(userId, startOfMonth, endOfMonth);
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
  
  // Separar despesas Still e Edgar
  const expensesStill = monthExpenses
    .filter(e => e.category === "still")
    .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
  
  const expensesEdgar = monthExpenses
    .filter(e => e.category !== "still")
    .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
  
  // Lucro do mês (receitas - despesas Still apenas)
  const monthProfit = monthIncome - expensesStill;
  
  return {
    totalBalance,
    totalInvestments,
    totalDebtors,
    monthIncome,
    totalExpenses,
    expensesStill,
    expensesEdgar,
    monthProfit,
    netWorth: totalBalance + totalInvestments + totalDebtors
  };
}


// ============= SERVICE ORDERS (OS) =============
export async function getNextOSNumber(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar último número de OS da tabela services
  const lastService = await db
    .select()
    .from(services)
    .where(and(eq(services.userId, userId), sql`${services.osNumber} IS NOT NULL`))
    .orderBy(desc(services.id))
    .limit(1);
  
  if (!lastService[0] || !lastService[0].osNumber) {
    return "00001";
  }
  
  const lastNumber = parseInt(lastService[0].osNumber);
  const nextNumber = lastNumber + 1;
  return nextNumber.toString().padStart(5, "0");
}

export async function getServiceOrders(userId: number, status?: "open" | "completed") {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(serviceOrders.userId, userId)];
  if (status) {
    conditions.push(eq(serviceOrders.status, status));
  }
  
  return db.select().from(serviceOrders).where(and(...conditions)).orderBy(desc(serviceOrders.createdAt));
}

export async function getServiceOrderById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(serviceOrders)
    .where(and(eq(serviceOrders.id, id), eq(serviceOrders.userId, userId)))
    .limit(1);
  
  return result[0];
}

export async function createServiceOrder(order: InsertServiceOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(serviceOrders).values(order);
  return result;
}

export async function updateServiceOrder(id: number, userId: number, data: Partial<InsertServiceOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar OS atual para verificar se estava concluída
  const current = await db.select().from(serviceOrders).where(
    and(eq(serviceOrders.id, id), eq(serviceOrders.userId, userId))
  ).limit(1);
  
  if (current[0] && current[0].status === "completed" && current[0].customerName) {
    const oldAmount = parseFloat(current[0].totalAmount);
    if (oldAmount > 0) {
      // Reverter valor antigo do devedor
      const oldDebtor = await db.select().from(debtors).where(
        and(eq(debtors.userId, userId), eq(debtors.name, current[0].customerName))
      ).limit(1);
      if (oldDebtor[0]) {
        const newTotal = (parseFloat(oldDebtor[0].totalAmount) - oldAmount).toFixed(2);
        const newRemaining = (parseFloat(oldDebtor[0].remainingAmount) - oldAmount).toFixed(2);
        if (parseFloat(newTotal) <= 0) {
          await db.delete(debtors).where(eq(debtors.id, oldDebtor[0].id));
        } else {
          await db.update(debtors).set({ 
            totalAmount: newTotal, 
            remainingAmount: newRemaining, 
            status: parseFloat(newRemaining) <= 0 ? "paid" : "pending" 
          }).where(eq(debtors.id, oldDebtor[0].id));
        }
      }
    }
  }
  
  await db
    .update(serviceOrders)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(serviceOrders.id, id), eq(serviceOrders.userId, userId)));
  
  // Se a OS continua concluída, re-adicionar o valor atualizado ao devedor
  const updated = await db.select().from(serviceOrders).where(
    and(eq(serviceOrders.id, id), eq(serviceOrders.userId, userId))
  ).limit(1);
  
  if (updated[0] && updated[0].status === "completed" && updated[0].customerName) {
    const newAmount = parseFloat(updated[0].totalAmount);
    if (newAmount > 0) {
      const existingDebtor = await db.select().from(debtors).where(
        and(eq(debtors.userId, userId), eq(debtors.name, updated[0].customerName))
      ).limit(1);
      
      if (existingDebtor[0]) {
        const newTotal = (parseFloat(existingDebtor[0].totalAmount) + newAmount).toFixed(2);
        const newRemaining = (parseFloat(existingDebtor[0].remainingAmount) + newAmount).toFixed(2);
        await db.update(debtors).set({ 
          totalAmount: newTotal, 
          remainingAmount: newRemaining, 
          status: parseFloat(newRemaining) <= 0 ? "paid" : "pending" 
        }).where(eq(debtors.id, existingDebtor[0].id));
      } else {
        await db.insert(debtors).values({
          userId,
          name: updated[0].customerName,
          totalAmount: newAmount.toFixed(2),
          paidAmount: "0",
          remainingAmount: newAmount.toFixed(2),
          status: "pending",
          description: `OS ${updated[0].osNumber}`
        });
      }
    }
  }
  
  return { success: true };
}

export async function completeServiceOrder(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Recalcular totais antes de buscar a OS (garante valor atualizado)
  await recalculateServiceOrderTotals(id);
  
  // Buscar OS com valores atualizados
  const order = await db.select().from(serviceOrders).where(
    and(eq(serviceOrders.id, id), eq(serviceOrders.userId, userId))
  ).limit(1);
  
  if (!order[0]) throw new Error("OS not found");
  
  const now = new Date();
  await db
    .update(serviceOrders)
    .set({ 
      status: "completed",
      exitDate: now,
      completedAt: now,
      updatedAt: now 
    })
    .where(and(eq(serviceOrders.id, id), eq(serviceOrders.userId, userId)));
  
  // Criar/atualizar devedor com o valor total da OS
  const totalAmount = parseFloat(order[0].totalAmount);
  
  if (totalAmount > 0 && order[0].customerName) {
    // Verificar se já existe devedor com esse nome
    const existingDebtor = await db.select().from(debtors).where(
      and(eq(debtors.userId, userId), eq(debtors.name, order[0].customerName))
    ).limit(1);
    
    if (existingDebtor[0]) {
      // Atualizar devedor existente
      const newTotal = (parseFloat(existingDebtor[0].totalAmount) + totalAmount).toFixed(2);
      const newRemaining = (parseFloat(existingDebtor[0].remainingAmount) + totalAmount).toFixed(2);
      await db.update(debtors)
        .set({ 
          totalAmount: newTotal,
          remainingAmount: newRemaining,
          status: "pending"
        })
        .where(eq(debtors.id, existingDebtor[0].id));
    } else {
      // Criar novo devedor
      await db.insert(debtors).values({
        userId: userId,
        name: order[0].customerName,
        totalAmount: totalAmount.toFixed(2),
        paidAmount: "0",
        remainingAmount: totalAmount.toFixed(2),
        status: "pending",
        description: `OS ${order[0].osNumber}`
      });
    }
  }
  
  return { success: true };
}

export async function deleteServiceOrder(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar OS antes de deletar
  const order = await db.select().from(serviceOrders).where(
    and(eq(serviceOrders.id, id), eq(serviceOrders.userId, userId))
  ).limit(1);
  
  if (!order[0]) throw new Error("OS não encontrada");
  
  const os = order[0];
  
  // Se OS estava concluída e tinha cliente, reverter devedor
  if (os.status === "completed" && os.customerName) {
    const totalAmount = parseFloat(os.totalAmount);
    if (totalAmount > 0) {
      const debtor = await db.select().from(debtors).where(
        and(eq(debtors.userId, userId), eq(debtors.name, os.customerName))
      ).limit(1);
      if (debtor[0]) {
        const newTotal = (parseFloat(debtor[0].totalAmount) - totalAmount).toFixed(2);
        const newRemaining = (parseFloat(debtor[0].remainingAmount) - totalAmount).toFixed(2);
        if (parseFloat(newTotal) <= 0) {
          await db.delete(debtors).where(eq(debtors.id, debtor[0].id));
        } else {
          await db.update(debtors).set({ 
            totalAmount: newTotal, 
            remainingAmount: newRemaining, 
            status: parseFloat(newRemaining) <= 0 ? "paid" : "pending" 
          }).where(eq(debtors.id, debtor[0].id));
        }
      }
    }
  }
  
  // Deletar itens primeiro
  await db.delete(serviceOrderItems).where(eq(serviceOrderItems.serviceOrderId, id));
  
  // Deletar OS
  await db
    .delete(serviceOrders)
    .where(and(eq(serviceOrders.id, id), eq(serviceOrders.userId, userId)));
  
  return { success: true };
}

// ============= SERVICE ORDER ITEMS =============
export async function getServiceOrderItems(serviceOrderId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(serviceOrderItems)
    .where(eq(serviceOrderItems.serviceOrderId, serviceOrderId))
    .orderBy(serviceOrderItems.itemNumber);
}

export async function createServiceOrderItem(item: InsertServiceOrderItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Calcular lucro
  const amount = parseFloat(item.amount.toString());
  const cost = parseFloat((item.cost || 0).toString());
  const profit = amount - cost;
  
  const result = await db.insert(serviceOrderItems).values({
    ...item,
    profit: profit.toFixed(2),
  });
  
  // Recalcular totais da OS
  await recalculateServiceOrderTotals(item.serviceOrderId);
  
  return result;
}

export async function updateServiceOrderItem(id: number, data: Partial<InsertServiceOrderItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar item para pegar serviceOrderId
  const item = await db.select().from(serviceOrderItems).where(eq(serviceOrderItems.id, id)).limit(1);
  if (!item[0]) throw new Error("Item not found");
  
  // Buscar OS para checar se está concluída
  const os = await db.select().from(serviceOrders).where(eq(serviceOrders.id, item[0].serviceOrderId)).limit(1);
  const wasCompleted = os[0]?.status === "completed";
  const oldOsTotal = wasCompleted ? parseFloat(os[0].totalAmount) : 0;
  
  // Recalcular lucro se amount ou cost mudaram
  if (data.amount || data.cost) {
    const currentAmount = data.amount ? parseFloat(data.amount.toString()) : parseFloat(item[0].amount);
    const currentCost = data.cost ? parseFloat(data.cost.toString()) : parseFloat(item[0].cost);
    data.profit = (currentAmount - currentCost).toFixed(2);
  }
  
  await db
    .update(serviceOrderItems)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(serviceOrderItems.id, id));
  
  // Recalcular totais da OS
  await recalculateServiceOrderTotals(item[0].serviceOrderId);
  
  // Se OS estava concluída, atualizar devedor com a diferença
  if (wasCompleted && os[0].customerName) {
    const updatedOs = await db.select().from(serviceOrders).where(eq(serviceOrders.id, item[0].serviceOrderId)).limit(1);
    const newOsTotal = parseFloat(updatedOs[0].totalAmount);
    const diff = newOsTotal - oldOsTotal;
    
    if (diff !== 0) {
      const debtor = await db.select().from(debtors).where(
        and(eq(debtors.userId, os[0].userId), eq(debtors.name, os[0].customerName))
      ).limit(1);
      if (debtor[0]) {
        const newTotal = (parseFloat(debtor[0].totalAmount) + diff).toFixed(2);
        const newRemaining = (parseFloat(debtor[0].remainingAmount) + diff).toFixed(2);
        if (parseFloat(newTotal) <= 0) {
          await db.delete(debtors).where(eq(debtors.id, debtor[0].id));
        } else {
          await db.update(debtors).set({ 
            totalAmount: newTotal, 
            remainingAmount: newRemaining, 
            status: parseFloat(newRemaining) <= 0 ? "paid" : "pending" 
          }).where(eq(debtors.id, debtor[0].id));
        }
      }
    }
  }
  
  // Verificar se todos os itens estão concluídos
  await checkAndUpdateServiceOrderStatus(item[0].serviceOrderId);
  
  return { success: true };
}

export async function deleteServiceOrderItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar item para pegar serviceOrderId
  const item = await db.select().from(serviceOrderItems).where(eq(serviceOrderItems.id, id)).limit(1);
  if (!item[0]) throw new Error("Item not found");
  
  await db.delete(serviceOrderItems).where(eq(serviceOrderItems.id, id));
  
  // Recalcular totais da OS
  await recalculateServiceOrderTotals(item[0].serviceOrderId);
  
  return { success: true };
}

async function recalculateServiceOrderTotals(serviceOrderId: number) {
  const db = await getDb();
  if (!db) return;
  
  const items = await getServiceOrderItems(serviceOrderId);
  
  const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const totalCost = items.reduce((sum, item) => sum + parseFloat(item.cost), 0);
  const totalProfit = totalAmount - totalCost;
  
  await db
    .update(serviceOrders)
    .set({
      totalAmount: totalAmount.toFixed(2),
      totalCost: totalCost.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
    })
    .where(eq(serviceOrders.id, serviceOrderId));
}

async function checkAndUpdateServiceOrderStatus(serviceOrderId: number) {
  const db = await getDb();
  if (!db) return;
  
  const items = await getServiceOrderItems(serviceOrderId);
  
  // Se todos os itens estão concluídos, marcar OS como completed
  const allCompleted = items.length > 0 && items.every(item => item.isCompleted);
  
  if (allCompleted) {
    await db
      .update(serviceOrders)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(serviceOrders.id, serviceOrderId));
    
    // Criar devedor com o valor total
    const order = await db.select().from(serviceOrders).where(eq(serviceOrders.id, serviceOrderId)).limit(1);
    if (order[0]) {
      // Verificar se já existe devedor
      const existingDebtor = await db.select().from(debtors).where(
        and(eq(debtors.userId, order[0].userId), eq(debtors.name, order[0].customerName))
      ).limit(1);
      
      const totalAmount = parseFloat(order[0].totalAmount);
      
      if (existingDebtor[0]) {
        // Atualizar devedor existente
        const newTotal = (parseFloat(existingDebtor[0].totalAmount) + totalAmount).toFixed(2);
        const newRemaining = (parseFloat(existingDebtor[0].remainingAmount) + totalAmount).toFixed(2);
        await db.update(debtors)
          .set({ 
            totalAmount: newTotal,
            remainingAmount: newRemaining,
            status: "pending"
          })
          .where(eq(debtors.id, existingDebtor[0].id));
      } else {
        // Criar novo devedor
        await db.insert(debtors).values({
          userId: order[0].userId,
          name: order[0].customerName,
          totalAmount: totalAmount.toFixed(2),
          paidAmount: "0",
          remainingAmount: totalAmount.toFixed(2),
          status: "pending",
          description: `OS ${order[0].osNumber}`
        });
      }
    }
  } else {
    // Se algum item não está concluído, voltar para open
    await db
      .update(serviceOrders)
      .set({
        status: "open",
        completedAt: null,
      })
      .where(eq(serviceOrders.id, serviceOrderId));
  }
}

// ============= PURCHASES =============
export async function getPurchases(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(purchases)
    .where(eq(purchases.userId, userId))
    .orderBy(desc(purchases.date));
}

export async function getPurchaseById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(purchases)
    .where(and(eq(purchases.id, id), eq(purchases.userId, userId)))
    .limit(1);
  
  return result[0];
}

export async function createPurchase(purchase: InsertPurchase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(purchases).values(purchase);
  
  // Se foi pago e tem accountId, atualizar saldo da conta
  if (purchase.status === "paid" && purchase.accountId) {
    const account = await db.select().from(bankAccounts).where(
      and(eq(bankAccounts.id, purchase.accountId), eq(bankAccounts.userId, purchase.userId))
    ).limit(1);
    
    if (account[0]) {
      const newBalance = (parseFloat(account[0].balance) - parseFloat(purchase.amount.toString())).toFixed(2);
      await db.update(bankAccounts)
        .set({ balance: newBalance })
        .where(eq(bankAccounts.id, purchase.accountId));
    }
    
    // Registrar transação
    await db.insert(transactions).values({
      userId: purchase.userId,
      accountId: purchase.accountId,
      date: new Date(purchase.paidDate || purchase.date),
      description: `Compra: ${purchase.description}`,
      amount: `-${purchase.amount}`,
      type: "expense",
      category: "purchase"
    });
  }
  
  return result;
}

export async function updatePurchase(id: number, userId: number, data: Partial<InsertPurchase>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar compra original
  const original = await getPurchaseById(id, userId);
  if (!original) throw new Error("Purchase not found");
  
  // Se mudou de pending para paid, atualizar saldo
  if (data.status === "paid" && original.status === "pending" && data.accountId) {
    const account = await db.select().from(bankAccounts).where(
      and(eq(bankAccounts.id, data.accountId), eq(bankAccounts.userId, userId))
    ).limit(1);
    
    if (account[0]) {
      const amount = data.amount ? parseFloat(data.amount.toString()) : parseFloat(original.amount);
      const newBalance = (parseFloat(account[0].balance) - amount).toFixed(2);
      await db.update(bankAccounts)
        .set({ balance: newBalance })
        .where(eq(bankAccounts.id, data.accountId));
    }
    
    // Registrar transação
    await db.insert(transactions).values({
      userId: userId,
      accountId: data.accountId,
      date: new Date(data.paidDate || new Date().toISOString().split('T')[0]),
      description: `Compra: ${data.description || original.description}`,
      amount: `-${data.amount || original.amount}`,
      type: "expense",
      category: "purchase"
    });
  }
  
  await db
    .update(purchases)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(purchases.id, id), eq(purchases.userId, userId)));
  
  return { success: true };
}

export async function deletePurchase(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar compra antes de deletar para reverter saldo se estiver paga
  const purchase = await getPurchaseById(id, userId);
  
  if (purchase && purchase.status === "paid" && purchase.accountId) {
    const paidAmount = parseFloat(purchase.amount);
    // Reverter saldo do banco
    await db.update(bankAccounts)
      .set({ balance: sql`balance + ${paidAmount}` })
      .where(and(eq(bankAccounts.id, purchase.accountId), eq(bankAccounts.userId, userId)));
    
    // Remover transação bancária associada
    await db.delete(transactions).where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.accountId, purchase.accountId),
        eq(transactions.category, "purchase"),
        sql`${transactions.description} LIKE ${'%' + (purchase.description || '').substring(0, 30) + '%'}`
      )
    );
  }
  
  await db
    .delete(purchases)
    .where(and(eq(purchases.id, id), eq(purchases.userId, userId)));
  
  return { success: true };
}

// ============= BANK TRANSFERS =============
export async function transferBetweenAccounts(
  userId: number,
  fromAccountId: number,
  toAccountId: number,
  amount: string,
  description: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const transferAmount = parseFloat(amount);
  const date = new Date().toISOString().split('T')[0];
  
  // Buscar contas
  const fromAccount = await db.select().from(bankAccounts).where(
    and(eq(bankAccounts.id, fromAccountId), eq(bankAccounts.userId, userId))
  ).limit(1);
  
  const toAccount = await db.select().from(bankAccounts).where(
    and(eq(bankAccounts.id, toAccountId), eq(bankAccounts.userId, userId))
  ).limit(1);
  
  if (!fromAccount[0] || !toAccount[0]) {
    throw new Error("Account not found");
  }
  
  // Atualizar saldos
  const newFromBalance = (parseFloat(fromAccount[0].balance) - transferAmount).toFixed(2);
  const newToBalance = (parseFloat(toAccount[0].balance) + transferAmount).toFixed(2);
  
  await db.update(bankAccounts)
    .set({ balance: newFromBalance })
    .where(eq(bankAccounts.id, fromAccountId));
  
  await db.update(bankAccounts)
    .set({ balance: newToBalance })
    .where(eq(bankAccounts.id, toAccountId));
  
  // Registrar transações
  await db.insert(transactions).values({
    userId: userId,
    accountId: fromAccountId,
    date: new Date(date),
    description: `Transferência para ${toAccount[0].name}: ${description}`,
    amount: `-${transferAmount}`,
    type: "expense",
    category: "transfer"
  });
  
  await db.insert(transactions).values({
    userId: userId,
    accountId: toAccountId,
    date: new Date(date),
    description: `Transferência de ${fromAccount[0].name}: ${description}`,
    amount: transferAmount.toString(),
    type: "income",
    category: "transfer"
  });
  
  return { success: true };
}


// ============= SUPPLIERS =============
export async function getSuppliers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(suppliers).where(eq(suppliers.userId, userId)).orderBy(suppliers.name);
}

export async function getSupplierById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(suppliers).where(
    and(eq(suppliers.id, id), eq(suppliers.userId, userId))
  ).limit(1);
  return result[0] || null;
}

export async function createSupplier(supplier: InsertSupplier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(suppliers).values(supplier);
  // Buscar o registro criado
  const created = await db.select().from(suppliers).where(eq(suppliers.id, result[0].insertId)).limit(1);
  return created[0];
}

export async function updateSupplier(id: number, userId: number, data: Partial<InsertSupplier>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(suppliers).set(data).where(and(eq(suppliers.id, id), eq(suppliers.userId, userId)));
  // Buscar o registro atualizado
  const updated = await db.select().from(suppliers).where(and(eq(suppliers.id, id), eq(suppliers.userId, userId))).limit(1);
  return updated[0];
}

export async function deleteSupplier(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(suppliers).where(and(eq(suppliers.id, id), eq(suppliers.userId, userId)));
}

// Buscar histórico de compras de um fornecedor
export async function getSupplierPurchases(supplierName: string, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(purchases).where(
    and(eq(purchases.supplier, supplierName), eq(purchases.userId, userId))
  ).orderBy(desc(purchases.date));
}

// Buscar estatísticas de um fornecedor
export async function getSupplierStats(supplierName: string, userId: number) {
  const db = await getDb();
  if (!db) return { totalPurchased: 0, totalPaid: 0, totalPending: 0 };
  
  const purchasesList = await db.select().from(purchases).where(
    and(eq(purchases.supplier, supplierName), eq(purchases.userId, userId))
  );
  
  let totalPurchased = 0;
  let totalPaid = 0;
  let totalPending = 0;
  
  for (const purchase of purchasesList) {
    const amount = parseFloat(purchase.amount.toString());
    totalPurchased += amount;
    
    if (purchase.status === "paid") {
      totalPaid += amount;
    } else {
      totalPending += amount;
    }
  }
  
  return {
    totalPurchased: totalPurchased.toFixed(2),
    totalPaid: totalPaid.toFixed(2),
    totalPending: totalPending.toFixed(2)
  };
}


// ============= SUPPLIER PAYMENTS =============

export async function createSupplierPayment(payment: InsertSupplierPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Criar pagamento
  const result = await db.insert(supplierPayments).values(payment);
  
  // Abater valor do banco
  await db.update(bankAccounts)
    .set({ balance: sql`balance - ${payment.amount}` })
    .where(and(eq(bankAccounts.id, payment.accountId), eq(bankAccounts.userId, payment.userId)));
  
  // Registrar transação no histórico bancário
  const rawDate = payment.date;
  const paymentDateObj = rawDate
    ? new Date(rawDate as string | Date)
    : new Date();
  await db.insert(transactions).values({
    userId: payment.userId,
    accountId: payment.accountId,
    type: "expense",
    category: "Pagamento Fornecedor",
    amount: payment.amount.toString(),
    description: `Pagamento Fornecedor: ${payment.supplierName}${payment.notes ? ' - ' + payment.notes : ''}`,
    date: paymentDateObj
  });
  
  // Buscar o registro criado
  const created = await db.select().from(supplierPayments).where(eq(supplierPayments.id, result[0].insertId)).limit(1);
  return created[0];
}

export async function getSupplierPayments(supplierName: string, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supplierPayments).where(
    and(eq(supplierPayments.supplierName, supplierName), eq(supplierPayments.userId, userId))
  ).orderBy(desc(supplierPayments.date));
}

export async function deleteSupplierPayment(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar pagamento antes de deletar para reverter saldo
  const payment = await db.select().from(supplierPayments).where(
    and(eq(supplierPayments.id, id), eq(supplierPayments.userId, userId))
  ).limit(1);
  
  if (payment[0]) {
    // Reverter saldo do banco
    await db.update(bankAccounts)
      .set({ balance: sql`balance + ${payment[0].amount}` })
      .where(and(eq(bankAccounts.id, payment[0].accountId), eq(bankAccounts.userId, userId)));
    
    // Remover transação bancária associada (buscar pela descrição e conta)
    await db.delete(transactions).where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.accountId, payment[0].accountId),
        eq(transactions.category, "Pagamento Fornecedor"),
        sql`${transactions.description} LIKE ${'%' + payment[0].supplierName + '%'}`
      )
    );
    
    // Deletar pagamento
    await db.delete(supplierPayments).where(
      and(eq(supplierPayments.id, id), eq(supplierPayments.userId, userId))
    );
  }
  
  return { success: true };
}


// ========== Product Kits ==========

export async function listProductKits(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productKits).where(eq(productKits.userId, userId)).orderBy(desc(productKits.createdAt));
}

export async function getProductKitById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(productKits).where(
    and(eq(productKits.id, id), eq(productKits.userId, userId))
  ).limit(1);
  return result[0] || null;
}

export async function getProductKitItems(kitId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar itens do kit com informações dos produtos
  const items = await db.select({
    id: productKitItems.id,
    kitId: productKitItems.kitId,
    productId: productKitItems.productId,
    quantity: productKitItems.quantity,
    productName: products.name,
    productCost: products.cost,
    productQuantity: products.quantity,
  }).from(productKitItems)
    .leftJoin(products, eq(productKitItems.productId, products.id))
    .where(eq(productKitItems.kitId, kitId));
  
  return items;
}

export async function createProductKit(data: InsertProductKit) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(productKits).values(data);
  const insertedId = result[0].insertId;
  return getProductKitById(insertedId, data.userId);
}

export async function createProductKitItem(data: InsertProductKitItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(productKitItems).values(data);
  return { success: true };
}

export async function updateProductKit(id: number, userId: number, data: Partial<InsertProductKit>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(productKits).set(data).where(
    and(eq(productKits.id, id), eq(productKits.userId, userId))
  );
  return getProductKitById(id, userId);
}

export async function deleteProductKit(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Deletar itens do kit primeiro
  await db.delete(productKitItems).where(eq(productKitItems.kitId, id));
  
  // Deletar kit
  await db.delete(productKits).where(
    and(eq(productKits.id, id), eq(productKits.userId, userId))
  );
  
  return { success: true };
}

export async function deleteProductKitItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productKitItems).where(eq(productKitItems.id, id));
  return { success: true };
}

// Função para verificar se há estoque suficiente para vender um kit
export async function checkKitStock(kitId: number) {
  const items = await getProductKitItems(kitId);
  const insufficientItems = items.filter(item => 
    (item.productQuantity || 0) < item.quantity
  );
  
  return {
    hasStock: insufficientItems.length === 0,
    insufficientItems: insufficientItems.map(item => ({
      productName: item.productName,
      required: item.quantity,
      available: item.productQuantity || 0,
    })),
  };
}

// Função para baixar estoque ao vender um kit
export async function decreaseKitStock(kitId: number, userId: number, quantity: number = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const items = await getProductKitItems(kitId);
  
  // Baixar estoque de cada produto do kit
  for (const item of items) {
    const decreaseAmount = item.quantity * quantity;
    await db.update(products)
      .set({ quantity: sql`quantity - ${decreaseAmount}` })
      .where(and(eq(products.id, item.productId), eq(products.userId, userId)));
  }
  
  return { success: true };
}

// ============= SALES REPORTS =============

/**
 * Retorna produtos mais vendidos (por quantidade) em um período
 */
export async function getTopSellingProducts(userId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return [];

  let conditions = `si.productId IS NOT NULL AND s.userId = ${userId}`;
  if (startDate) conditions += ` AND s.date >= '${startDate}'`;
  if (endDate) conditions += ` AND s.date <= '${endDate}'`;

  const result = await db.execute(sql`
    SELECT 
      si.productId,
      COALESCE(p.name, si.description) as productName,
      SUM(si.quantity) as totalQuantity,
      SUM(CAST(si.totalPrice AS DECIMAL(15,2))) as totalRevenue,
      SUM(CAST(si.totalCost AS DECIMAL(15,2))) as totalCost,
      SUM(CAST(si.totalPrice AS DECIMAL(15,2)) - CAST(si.totalCost AS DECIMAL(15,2))) as totalProfit,
      COUNT(DISTINCT si.saleId) as salesCount
    FROM sale_items si
    JOIN sales s ON si.saleId = s.id
    LEFT JOIN products p ON si.productId = p.id
    WHERE si.productId IS NOT NULL AND s.userId = ${userId}
    ${startDate ? sql`AND s.date >= ${startDate}` : sql``}
    ${endDate ? sql`AND s.date <= ${endDate}` : sql``}
    GROUP BY si.productId, productName
    ORDER BY totalQuantity DESC
    LIMIT 20
  `);

  return ((result[0] as unknown) as any[]).map((row: any) => ({
    productId: row.productId,
    productName: row.productName || 'Produto sem nome',
    totalQuantity: Number(row.totalQuantity) || 0,
    totalRevenue: Number(row.totalRevenue) || 0,
    totalCost: Number(row.totalCost) || 0,
    totalProfit: Number(row.totalProfit) || 0,
    salesCount: Number(row.salesCount) || 0,
  }));
}

/**
 * Retorna vendas agrupadas por dia em um período
 */
export async function getSalesByDay(userId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(sql`
    SELECT 
      s.date,
      COUNT(*) as salesCount,
      SUM(CAST(s.amount AS DECIMAL(15,2))) as totalRevenue,
      SUM(CAST(s.cost AS DECIMAL(15,2))) as totalCost,
      SUM(CAST(s.profit AS DECIMAL(15,2))) as totalProfit
    FROM sales s
    WHERE s.userId = ${userId}
    ${startDate ? sql`AND s.date >= ${startDate}` : sql``}
    ${endDate ? sql`AND s.date <= ${endDate}` : sql``}
    GROUP BY s.date
    ORDER BY s.date ASC
  `);

  return ((result[0] as unknown) as any[]).map((row: any) => ({
    date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date),
    salesCount: Number(row.salesCount) || 0,
    totalRevenue: Number(row.totalRevenue) || 0,
    totalCost: Number(row.totalCost) || 0,
    totalProfit: Number(row.totalProfit) || 0,
  }));
}

/**
 * Retorna resumo geral de vendas em um período
 */
export async function getSalesSummary(userId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.execute(sql`
    SELECT 
      COUNT(*) as totalSales,
      SUM(CAST(s.amount AS DECIMAL(15,2))) as totalRevenue,
      SUM(CAST(s.cost AS DECIMAL(15,2))) as totalCost,
      SUM(CAST(s.profit AS DECIMAL(15,2))) as totalProfit,
      AVG(CAST(s.amount AS DECIMAL(15,2))) as avgTicket
    FROM sales s
    WHERE s.userId = ${userId}
    ${startDate ? sql`AND s.date >= ${startDate}` : sql``}
    ${endDate ? sql`AND s.date <= ${endDate}` : sql``}
  `);

  const row = ((result[0] as unknown) as any[])[0];
  return {
    totalSales: Number(row?.totalSales) || 0,
    totalRevenue: Number(row?.totalRevenue) || 0,
    totalCost: Number(row?.totalCost) || 0,
    totalProfit: Number(row?.totalProfit) || 0,
    avgTicket: Number(row?.avgTicket) || 0,
  };
}

/**
 * Retorna produtos com estoque abaixo do mínimo
 */
export async function getLowStockProducts(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(products).where(
    and(
      eq(products.userId, userId),
      eq(products.isActive, true),
      sql`${products.minimumStock} > 0 AND ${products.quantity} <= ${products.minimumStock}`
    )
  ).orderBy(products.name);

  return result;
}

/**
 * Retorna vendas de um produto específico agrupadas por dia
 */
export async function getSalesByProductAndDay(userId: number, productId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return { dailySales: [], summary: null };

  // Vendas por dia para o produto
  const dailyResult = await db.execute(sql`
    SELECT 
      s.date,
      SUM(si.quantity) as totalQuantity,
      SUM(CAST(si.totalPrice AS DECIMAL(15,2))) as totalRevenue,
      SUM(CAST(si.totalCost AS DECIMAL(15,2))) as totalCost,
      SUM(CAST(si.totalPrice AS DECIMAL(15,2)) - CAST(si.totalCost AS DECIMAL(15,2))) as totalProfit,
      COUNT(DISTINCT si.saleId) as salesCount
    FROM sale_items si
    JOIN sales s ON si.saleId = s.id
    WHERE si.productId = ${productId} AND s.userId = ${userId}
    ${startDate ? sql`AND s.date >= ${startDate}` : sql``}
    ${endDate ? sql`AND s.date <= ${endDate}` : sql``}
    GROUP BY s.date
    ORDER BY s.date ASC
  `);

  // Resumo geral do produto
  const summaryResult = await db.execute(sql`
    SELECT 
      COALESCE(p.name, si.description) as productName,
      SUM(si.quantity) as totalQuantity,
      SUM(CAST(si.totalPrice AS DECIMAL(15,2))) as totalRevenue,
      SUM(CAST(si.totalCost AS DECIMAL(15,2))) as totalCost,
      SUM(CAST(si.totalPrice AS DECIMAL(15,2)) - CAST(si.totalCost AS DECIMAL(15,2))) as totalProfit,
      COUNT(DISTINCT si.saleId) as salesCount,
      AVG(CAST(si.unitPrice AS DECIMAL(15,2))) as avgPrice
    FROM sale_items si
    JOIN sales s ON si.saleId = s.id
    LEFT JOIN products p ON si.productId = p.id
    WHERE si.productId = ${productId} AND s.userId = ${userId}
    ${startDate ? sql`AND s.date >= ${startDate}` : sql``}
    ${endDate ? sql`AND s.date <= ${endDate}` : sql``}
    GROUP BY productName
  `);

  const rows = (dailyResult[0] as unknown) as any[];
  const summaryRows = (summaryResult[0] as unknown) as any[];

  const dailySales = rows.map((row: any) => ({
    date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date),
    totalQuantity: Number(row.totalQuantity) || 0,
    totalRevenue: Number(row.totalRevenue) || 0,
    totalCost: Number(row.totalCost) || 0,
    totalProfit: Number(row.totalProfit) || 0,
    salesCount: Number(row.salesCount) || 0,
  }));

  const summary = summaryRows.length > 0 ? {
    productName: summaryRows[0].productName || 'Produto sem nome',
    totalQuantity: Number(summaryRows[0].totalQuantity) || 0,
    totalRevenue: Number(summaryRows[0].totalRevenue) || 0,
    totalCost: Number(summaryRows[0].totalCost) || 0,
    totalProfit: Number(summaryRows[0].totalProfit) || 0,
    salesCount: Number(summaryRows[0].salesCount) || 0,
    avgPrice: Number(summaryRows[0].avgPrice) || 0,
  } : null;

  return { dailySales, summary };
}

// ===== COLABORADORES =====

/**
 * Lista todos os colaboradores de um dono
 */
export async function listCollaborators(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(collaborators).where(eq(collaborators.ownerId, ownerId));
}

/**
 * Busca colaborador por email e dono
 */
export async function getCollaboratorByEmail(ownerId: number, email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(collaborators)
    .where(and(eq(collaborators.ownerId, ownerId), eq(collaborators.email, email)));
  return result[0] || null;
}

/**
 * Busca colaborador por userId (para verificar se um usuário logado é colaborador de alguém)
 */
export async function getCollaboratorByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(collaborators)
    .where(and(eq(collaborators.userId, userId), eq(collaborators.status, "active")));
  return result[0] || null;
}

/**
 * Cria um convite de colaborador
 */
export async function createCollaborator(data: {
  ownerId: number;
  email: string;
  name?: string;
  inviteToken: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(collaborators).values({
    ownerId: data.ownerId,
    email: data.email,
    name: data.name,
    status: "pending",
    inviteToken: data.inviteToken,
  });
  const id = (result[0] as any).insertId;
  const rows = await db.select().from(collaborators).where(eq(collaborators.id, id));
  return rows[0] || null;
}

/**
 * Ativa um colaborador após aceitar o convite (vincula ao userId)
 */
export async function activateCollaborator(inviteToken: string, userId: number, name?: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(collaborators).where(eq(collaborators.inviteToken, inviteToken));
  const collab = rows[0];
  if (!collab) return null;
  await db.update(collaborators)
    .set({ userId, status: "active", name: name || collab.name, inviteToken: null })
    .where(eq(collaborators.id, collab.id));
  const updated = await db.select().from(collaborators).where(eq(collaborators.id, collab.id));
  return updated[0] || null;
}

/**
 * Atualiza status do colaborador
 */
export async function updateCollaboratorStatus(id: number, ownerId: number, status: "active" | "inactive") {
  const db = await getDb();
  if (!db) return null;
  await db.update(collaborators).set({ status }).where(and(eq(collaborators.id, id), eq(collaborators.ownerId, ownerId)));
  const rows = await db.select().from(collaborators).where(eq(collaborators.id, id));
  return rows[0] || null;
}

/**
 * Remove um colaborador
 */
export async function deleteCollaborator(id: number, ownerId: number) {
  const db = await getDb();
  if (!db) return false;
  // Remover permissões primeiro
  await db.delete(collaboratorPermissions).where(eq(collaboratorPermissions.collaboratorId, id));
  await db.delete(collaborators).where(and(eq(collaborators.id, id), eq(collaborators.ownerId, ownerId)));
  return true;
}

// ===== PERMISSÕES DE COLABORADORES =====

export const SECTIONS = [
  "dashboard", "bankAccounts", "sales", "services", "purchases",
  "suppliers", "expenses", "debtors", "products", "reports", "investments"
] as const;

export type Section = typeof SECTIONS[number];

/**
 * Lista permissões de um colaborador
 */
export async function getCollaboratorPermissions(collaboratorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(collaboratorPermissions).where(eq(collaboratorPermissions.collaboratorId, collaboratorId));
}

/**
 * Salva (upsert) permissões de um colaborador - substitui todas
 */
export async function saveCollaboratorPermissions(
  collaboratorId: number,
  permissions: Array<{ section: string; canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>
) {
  const db = await getDb();
  if (!db) return false;
  // Deletar permissões antigas
  await db.delete(collaboratorPermissions).where(eq(collaboratorPermissions.collaboratorId, collaboratorId));
  // Inserir novas
  if (permissions.length > 0) {
    await db.insert(collaboratorPermissions).values(
      permissions.map(p => ({
        collaboratorId,
        section: p.section,
        canView: p.canView,
        canCreate: p.canCreate,
        canEdit: p.canEdit,
        canDelete: p.canDelete,
      }))
    );
  }
  return true;
}

/**
 * Ativa um colaborador pelo email (fallback quando o token foi perdido)
 */
export async function activateCollaboratorByEmail(email: string, userId: number, name?: string) {
  const db = await getDb();
  if (!db) return null;
  // Buscar colaborador pendente com esse email
  const rows = await db.select().from(collaborators)
    .where(and(eq(collaborators.email, email), eq(collaborators.status, "pending")));
  const collab = rows[0];
  if (!collab) return null;
  await db.update(collaborators)
    .set({ userId, status: "active", name: name || collab.name, inviteToken: null })
    .where(eq(collaborators.id, collab.id));
  const updated = await db.select().from(collaborators).where(eq(collaborators.id, collab.id));
  return updated[0] || null;
}
