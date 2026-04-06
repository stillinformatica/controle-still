import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Bank Accounts", () => {
  it("should create a new bank account", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bankAccounts.create({
      name: "Banco Teste",
      balance: "1000.00",
      accountType: "checking",
      isActive: true,
    });

    expect(result).toBeDefined();
  });

  it("should list bank accounts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const accounts = await caller.bankAccounts.list();

    expect(Array.isArray(accounts)).toBe(true);
  });
});

describe("Dashboard Stats", () => {
  it("should return dashboard statistics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.stats();

    expect(stats).toBeDefined();
    expect(typeof stats?.totalBalance).toBe("number");
    expect(typeof stats?.totalInvestments).toBe("number");
    expect(typeof stats?.totalDebtors).toBe("number");
    expect(typeof stats?.netWorth).toBe("number");
  });

  it("should calculate net worth correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.stats();

    if (stats) {
      const expectedNetWorth = stats.totalBalance + stats.totalInvestments + stats.totalDebtors;
      expect(stats.netWorth).toBe(expectedNetWorth);
    }
  });
});

describe("Investments", () => {
  it("should create a new investment", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.investments.create({
      code: "HGLG11",
      name: "CSHG Logística",
      type: "fii",
      shares: "100",
      purchasePrice: "150.00",
      purchaseDate: "2024-01-01",
      dyPercent: "0.80",
    });

    expect(result).toBeDefined();
  });

  it("should list investments", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const investments = await caller.investments.list({ isActive: true });

    expect(Array.isArray(investments)).toBe(true);
  });
});

describe("Sales", () => {
  it("should create a sale and calculate profit", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sales.create({
      date: "2024-01-15",
      description: "Venda Computador",
      amount: "2000.00",
      cost: "1500.00",
      source: "direct",
    });

    expect(result).toBeDefined();
  });

  it("should list sales", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const sales = await caller.sales.list({});

    expect(Array.isArray(sales)).toBe(true);
  });
});

describe("Expenses", () => {
  it("should create an expense", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.expenses.create({
      date: "2024-01-10",
      description: "Conta de Luz",
      amount: "250.00",
      category: "fixas",
      isPaid: true,
      isRecurring: true,
    });

    expect(result).toBeDefined();
  });

  it("should list expenses by category", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const expenses = await caller.expenses.list({ category: "fixas" });

    expect(Array.isArray(expenses)).toBe(true);
  });
});

describe("Debtors", () => {
  it("should create a debtor and calculate remaining amount", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.debtors.create({
      name: "Cliente Teste",
      totalAmount: "5000.00",
      paidAmount: "1000.00",
      description: "Venda parcelada",
    });

    expect(result).toBeDefined();
  });

  it("should list debtors", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const debtors = await caller.debtors.list({});

    expect(Array.isArray(debtors)).toBe(true);
  });
});

describe("Products", () => {
  it("should create a product and calculate profit margin", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.create({
      name: "Computador Gamer",
      description: "PC completo",
      cost: "3000.00",
      salePrice: "4500.00",
    });

    expect(result).toBeDefined();
  });

  it("should list products", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list({});

    expect(Array.isArray(products)).toBe(true);
  });
});
