import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

// Mock context com usuário autenticado
const createMockContext = (userId: number = 1) => ({
  user: {
    id: userId,
    openId: "test-open-id",
    name: "Test User",
    email: "test@example.com",
    role: "user" as const,
    createdAt: new Date(),
  },
});

describe("Suppliers Module", () => {
  let testSupplierId: number;
  const testUserId = 99999; // ID único para testes

  beforeAll(async () => {
    // Limpar dados de teste anteriores
    const existingSuppliers = await db.getSuppliers(testUserId);
    for (const supplier of existingSuppliers) {
      await db.deleteSupplier(supplier.id, testUserId);
    }
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testSupplierId) {
      try {
        await db.deleteSupplier(testSupplierId, testUserId);
      } catch (error) {
        // Ignorar erro se já foi deletado
      }
    }
  });

  describe("Supplier CRUD Operations", () => {
    it("should create a new supplier", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      const newSupplier = await caller.suppliers.create({
        name: "Fornecedor Teste Ltda",
        address: "Rua Teste, 123 - São Paulo, SP",
        phone: "(11) 98765-4321",
        email: "contato@fornecedorteste.com",
        notes: "Fornecedor de teste para vitest",
      });

      expect(newSupplier).toBeDefined();
      expect(newSupplier.name).toBe("Fornecedor Teste Ltda");
      expect(newSupplier.address).toBe("Rua Teste, 123 - São Paulo, SP");
      expect(newSupplier.phone).toBe("(11) 98765-4321");
      expect(newSupplier.email).toBe("contato@fornecedorteste.com");

      testSupplierId = newSupplier.id;
    });

    it("should list all suppliers for user", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      const suppliers = await caller.suppliers.list();

      expect(Array.isArray(suppliers)).toBe(true);
      expect(suppliers.length).toBeGreaterThan(0);
      expect(suppliers.some(s => s.name === "Fornecedor Teste Ltda")).toBe(true);
    });

    it("should get supplier by id", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      const supplier = await caller.suppliers.getById({ id: testSupplierId });

      expect(supplier).toBeDefined();
      expect(supplier?.name).toBe("Fornecedor Teste Ltda");
      expect(supplier?.id).toBe(testSupplierId);
    });

    it("should update supplier information", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      const updated = await caller.suppliers.update({
        id: testSupplierId,
        phone: "(11) 91234-5678",
        notes: "Fornecedor atualizado",
      });

      expect(updated).toBeDefined();
      expect(updated.phone).toBe("(11) 91234-5678");
      expect(updated.notes).toBe("Fornecedor atualizado");
    });

    it("should delete supplier", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      // Criar um fornecedor temporário para deletar
      const tempSupplier = await caller.suppliers.create({
        name: "Fornecedor Temporário",
        address: "Endereço Temporário",
      });

      const result = await caller.suppliers.delete({ id: tempSupplier.id });

      expect(result).toBeDefined();

      // Verificar que foi deletado
      const deleted = await caller.suppliers.getById({ id: tempSupplier.id });
      expect(deleted).toBeNull();
    });
  });

  describe("Supplier Statistics", () => {
    it("should get supplier purchase statistics", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      // Criar uma compra para o fornecedor de teste
      await caller.purchases.create({
        date: "2026-02-13",
        supplier: "Fornecedor Teste Ltda",
        description: "Compra de teste",
        amount: "1000.00",
        status: "pending",
      });

      const stats = await caller.suppliers.getStats({
        supplierName: "Fornecedor Teste Ltda",
      });

      expect(stats).toBeDefined();
      expect(stats.totalPurchased).toBeDefined();
      expect(stats.totalPaid).toBeDefined();
      expect(stats.totalPending).toBeDefined();
      expect(parseFloat(stats.totalPurchased.toString())).toBeGreaterThanOrEqual(1000);
    });

    it("should get supplier purchase history", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      const purchases = await caller.suppliers.getPurchases({
        supplierName: "Fornecedor Teste Ltda",
      });

      expect(Array.isArray(purchases)).toBe(true);
      expect(purchases.length).toBeGreaterThan(0);
      expect(purchases.some(p => p.description === "Compra de teste")).toBe(true);
    });
  });

  describe("Data Isolation", () => {
    it("should not allow access to other users' suppliers", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));
      const otherUserCaller = appRouter.createCaller(createMockContext(88888));

      // Criar fornecedor com usuário de teste
      const supplier = await caller.suppliers.create({
        name: "Fornecedor Privado",
        address: "Endereço Privado",
      });

      // Tentar acessar com outro usuário
      const result = await otherUserCaller.suppliers.getById({ id: supplier.id });

      expect(result).toBeNull();

      // Limpar
      await caller.suppliers.delete({ id: supplier.id });
    });
  });
});
