import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

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

describe("Sales Reports Module", () => {
  const testUserId = 88888; // ID único para testes de relatório

  afterAll(async () => {
    // Limpar dados de teste
    const testProducts = await db.getProducts(testUserId);
    for (const product of testProducts) {
      await db.deleteProduct(product.id, testUserId);
    }
  });

  describe("Product Minimum Stock", () => {
    let testProductId: number;

    it("should create a product with minimumStock", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      const result = await caller.products.create({
        name: "Produto Teste Estoque",
        cost: "50.00",
        salePrice: "100.00",
        quantity: "3",
        minimumStock: 5,
      });

      expect(result).toBeDefined();
    });

    it("should list products with minimumStock field", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      const products = await caller.products.list({ isActive: true });
      expect(Array.isArray(products)).toBe(true);

      const testProduct = products.find(p => p.name === "Produto Teste Estoque");
      expect(testProduct).toBeDefined();
      expect(testProduct?.minimumStock).toBe(5);
      expect(testProduct?.quantity).toBe(3);

      if (testProduct) {
        testProductId = testProduct.id;
      }
    });

    it("should detect product with stock below minimum", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      // Produto com quantity=3 e minimumStock=5 deve aparecer como estoque baixo
      const lowStockProducts = await caller.products.getLowStock();
      expect(Array.isArray(lowStockProducts)).toBe(true);

      const testProduct = lowStockProducts.find(p => p.name === "Produto Teste Estoque");
      expect(testProduct).toBeDefined();
      expect(testProduct?.quantity).toBeLessThanOrEqual(testProduct?.minimumStock ?? 0);
    });

    it("should update product minimumStock", async () => {
      if (!testProductId) return;

      const caller = appRouter.createCaller(createMockContext(testUserId));

      await caller.products.update({
        id: testProductId,
        minimumStock: 2, // Agora estoque mínimo é 2, e temos 3 em estoque
      });

      // Produto não deve mais aparecer como estoque baixo
      const lowStockProducts = await caller.products.getLowStock();
      const testProduct = lowStockProducts.find(p => p.id === testProductId);
      expect(testProduct).toBeUndefined(); // Não deve estar na lista de estoque baixo
    });

    it("should not include product with minimumStock=0 in low stock list", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      // Criar produto sem estoque mínimo definido
      await caller.products.create({
        name: "Produto Sem Minimo",
        cost: "10.00",
        salePrice: "20.00",
        quantity: "0",
        minimumStock: 0, // Sem mínimo definido
      });

      const lowStockProducts = await caller.products.getLowStock();
      const noMinProduct = lowStockProducts.find(p => p.name === "Produto Sem Minimo");
      expect(noMinProduct).toBeUndefined(); // Não deve aparecer (minimumStock=0)
    });
  });

  describe("Sales Reports Queries", () => {
    it("should return sales summary for a period", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      const summary = await caller.reports.salesSummary({
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      });

      expect(summary).toBeDefined();
      expect(typeof summary?.totalSales).toBe("number");
      expect(typeof summary?.totalRevenue).toBe("number");
      expect(typeof summary?.totalProfit).toBe("number");
      expect(typeof summary?.avgTicket).toBe("number");
    });

    it("should return top selling products", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      const topProducts = await caller.reports.topSellingProducts({
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      });

      expect(Array.isArray(topProducts)).toBe(true);
      // Cada produto deve ter os campos esperados
      if (topProducts.length > 0) {
        const product = topProducts[0];
        expect(typeof product.productName).toBe("string");
        expect(typeof product.totalQuantity).toBe("number");
        expect(typeof product.totalRevenue).toBe("number");
        expect(typeof product.totalProfit).toBe("number");
      }
    });

    it("should return sales by day", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      const salesByDay = await caller.reports.salesByDay({
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      });

      expect(Array.isArray(salesByDay)).toBe(true);
      // Cada entrada deve ter os campos esperados
      if (salesByDay.length > 0) {
        const dayData = salesByDay[0];
        expect(typeof dayData.date).toBe("string");
        expect(typeof dayData.salesCount).toBe("number");
        expect(typeof dayData.totalRevenue).toBe("number");
        expect(typeof dayData.totalProfit).toBe("number");
      }
    });

    it("should return empty results for future period with no data", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      const summary = await caller.reports.salesSummary({
        startDate: "2099-01-01",
        endDate: "2099-12-31",
      });

      expect(summary?.totalSales).toBe(0);
      expect(summary?.totalRevenue).toBe(0);
    });
  });
});
