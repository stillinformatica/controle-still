import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("Supplier Payments", () => {
  const testUserId = 99998; // ID único para testes
  let testAccountId: number;

  beforeAll(async () => {
    // Limpar dados de teste anteriores
    const existingSuppliers = await db.getSuppliers(testUserId);
    for (const supplier of existingSuppliers) {
      await db.deleteSupplier(supplier.id, testUserId);
    }
    
    const existingAccounts = await db.getBankAccounts(testUserId);
    for (const account of existingAccounts) {
      await db.deleteBankAccount(account.id, testUserId);
    }

    // Criar fornecedor de teste
    await db.createSupplier({
      userId: testUserId,
      name: "Fornecedor Teste Pagamentos",
      address: "Rua Teste, 123",
      phone: "(11) 99999-9999",
    });

    // Criar conta bancária de teste
    const account = await db.createBankAccount({
      userId: testUserId,
      name: "Banco Teste Pagamentos",
      balance: "10000.00",
      accountType: "checking",
    });
    testAccountId = account.id;

    // Criar compra de teste
    await db.createPurchase({
      userId: testUserId,
      supplier: "Fornecedor Teste Pagamentos",
      description: "Compra teste",
      amount: "5000.00",
      date: "2026-02-13" as any,
      status: "pending",
    });
  });

  it("deve criar pagamento de fornecedor", async () => {
    const initialBalance = await db.getBankAccountById(testAccountId, testUserId);
    const balanceBefore = parseFloat(initialBalance!.balance.toString());

    const payment = await db.createSupplierPayment({
      userId: testUserId,
      supplierName: "Fornecedor Teste Pagamentos",
      amount: "2000.00",
      accountId: testAccountId,
      date: "2026-02-13" as any,
      notes: "Pagamento parcial",
    });

    expect(payment).toBeDefined();
    expect(payment.amount).toBe("2000.00");
    expect(payment.supplierName).toBe("Fornecedor Teste Pagamentos");

    // Verificar se saldo do banco foi abatido
    const accountAfter = await db.getBankAccountById(testAccountId, testUserId);
    const balanceAfter = parseFloat(accountAfter!.balance.toString());
    expect(balanceAfter).toBe(balanceBefore - 2000);
  });

  it("deve listar pagamentos de fornecedor", async () => {
    const payments = await db.getSupplierPayments("Fornecedor Teste Pagamentos", testUserId);
    
    expect(payments.length).toBeGreaterThan(0);
    expect(payments[0].supplierName).toBe("Fornecedor Teste Pagamentos");
  });

  it("deve calcular estatísticas corretas", async () => {
    const stats = await db.getSupplierStats("Fornecedor Teste Pagamentos", testUserId);
    
    expect(stats).toBeDefined();
    expect(parseFloat(stats.totalPurchased)).toBeGreaterThan(0);
    expect(parseFloat(stats.totalPaid)).toBeGreaterThanOrEqual(0);
    expect(parseFloat(stats.totalPending)).toBeGreaterThanOrEqual(0);
  });

  it("deve isolar dados entre usuários diferentes", async () => {
    const user2Id = 99997; // Outro ID de usuário

    // Tentar buscar pagamentos do primeiro usuário com ID do segundo
    const payments = await db.getSupplierPayments("Fornecedor Teste Pagamentos", user2Id);
    
    expect(payments.length).toBe(0);
  });

  afterAll(async () => {
    // Limpar dados de teste
    const suppliers = await db.getSuppliers(testUserId);
    for (const supplier of suppliers) {
      await db.deleteSupplier(supplier.id, testUserId);
    }
    
    const accounts = await db.getBankAccounts(testUserId);
    for (const account of accounts) {
      await db.deleteBankAccount(account.id, testUserId);
    }
  });
});
