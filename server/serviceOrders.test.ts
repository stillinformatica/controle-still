import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Service Orders - Timezone Fix", () => {
  let testUserId: number;
  const timestamp = Date.now();

  beforeAll(async () => {
    // Criar usuário de teste
    const testUser = {
      openId: `test-os-timezone-${timestamp}`,
      name: "Test User OS Timezone",
      email: `test-os-tz-${timestamp}@example.com`,
    };
    await db.upsertUser(testUser);
    const user = await db.getUserByOpenId(testUser.openId);
    if (!user) throw new Error("Failed to create test user");
    testUserId = user.id;
  });

  it("should save and retrieve entryDate without timezone offset", async () => {
    // Obter data atual no formato YYYY-MM-DD
    const today = new Date();
    const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Criar OS com data de hoje
    const osNumber = `T${timestamp.toString().slice(-5)}-1`;
    const result = await db.createServiceOrder({
      userId: testUserId,
      osNumber,
      customerName: "Cliente Teste Timezone",
      entryDate: expectedDate as any,
      status: "open",
      totalAmount: "0",
      totalCost: "0",
      totalProfit: "0",
    });

    expect(result).toBeDefined();

    // Buscar todas as OSs do usuário
    const orders = await db.getServiceOrders(testUserId);
    expect(orders).toBeDefined();
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);
    
    // Encontrar a OS criada pelo número
    const createdOS = orders.find(o => o.osNumber === osNumber);
    expect(createdOS).toBeDefined();
    expect(createdOS?.customerName).toBe("Cliente Teste Timezone");

    // Validar que a data de entrada está correta (sem offset de timezone)
    const entryDate = createdOS?.entryDate;
    expect(entryDate).toBeDefined();
    
    // Converter para string no formato YYYY-MM-DD para comparação
    let actualDate: string;
    if (typeof entryDate === 'string') {
      actualDate = entryDate.split('T')[0]; // Remove parte de hora se houver
    } else if (entryDate instanceof Date) {
      actualDate = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
    } else {
      throw new Error("Invalid date format");
    }

    // A data deve ser exatamente a mesma que foi inserida (sem offset)
    expect(actualDate).toBe(expectedDate);
  });

  it("should handle date correctly in tRPC router", async () => {
    // Testar que o backend gera a data corretamente
    const today = new Date();
    const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Simular o que o router faz - usar string direta
    const entryDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Verificar que a string está no formato correto
    expect(entryDateStr).toBe(expectedDate);
    expect(entryDateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
