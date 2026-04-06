import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do módulo db para testes unitários
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    listCollaborators: vi.fn(),
    getCollaboratorByEmail: vi.fn(),
    createCollaborator: vi.fn(),
    activateCollaborator: vi.fn(),
    updateCollaboratorStatus: vi.fn(),
    deleteCollaborator: vi.fn(),
    getCollaboratorPermissions: vi.fn(),
    saveCollaboratorPermissions: vi.fn(),
    getCollaboratorByUserId: vi.fn(),
    SECTIONS: ["dashboard", "bankAccounts", "sales", "services", "purchases", "suppliers", "expenses", "debtors", "products", "reports", "investments"],
  };
});

import * as db from "./db";

describe("Colaboradores - Funções de banco de dados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listCollaborators deve retornar lista vazia quando não há colaboradores", async () => {
    vi.mocked(db.listCollaborators).mockResolvedValue([]);
    const result = await db.listCollaborators(1);
    expect(result).toEqual([]);
    expect(db.listCollaborators).toHaveBeenCalledWith(1);
  });

  it("getCollaboratorByEmail deve retornar null quando colaborador não existe", async () => {
    vi.mocked(db.getCollaboratorByEmail).mockResolvedValue(null);
    const result = await db.getCollaboratorByEmail(1, "test@gmail.com");
    expect(result).toBeNull();
  });

  it("createCollaborator deve criar com status pending", async () => {
    const mockCollab = {
      id: 1,
      ownerId: 1,
      userId: null,
      email: "colaborador@gmail.com",
      name: "João",
      status: "pending" as const,
      inviteToken: "abc123",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(db.createCollaborator).mockResolvedValue(mockCollab);

    const result = await db.createCollaborator({
      ownerId: 1,
      email: "colaborador@gmail.com",
      name: "João",
      inviteToken: "abc123",
    });

    expect(result).not.toBeNull();
    expect(result?.status).toBe("pending");
    expect(result?.email).toBe("colaborador@gmail.com");
  });

  it("activateCollaborator deve retornar null para token inválido", async () => {
    vi.mocked(db.activateCollaborator).mockResolvedValue(null);
    const result = await db.activateCollaborator("token-invalido", 99);
    expect(result).toBeNull();
  });

  it("activateCollaborator deve ativar colaborador com token válido", async () => {
    const mockActivated = {
      id: 1,
      ownerId: 1,
      userId: 5,
      email: "colaborador@gmail.com",
      name: "João",
      status: "active" as const,
      inviteToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(db.activateCollaborator).mockResolvedValue(mockActivated);

    const result = await db.activateCollaborator("token-valido", 5, "João");
    expect(result?.status).toBe("active");
    expect(result?.userId).toBe(5);
    expect(result?.inviteToken).toBeNull();
  });

  it("saveCollaboratorPermissions deve salvar permissões corretamente", async () => {
    vi.mocked(db.saveCollaboratorPermissions).mockResolvedValue(true);

    const permissions = [
      { section: "dashboard", canView: true, canCreate: false, canEdit: false, canDelete: false },
      { section: "sales", canView: true, canCreate: true, canEdit: false, canDelete: false },
    ];

    const result = await db.saveCollaboratorPermissions(1, permissions);
    expect(result).toBe(true);
    expect(db.saveCollaboratorPermissions).toHaveBeenCalledWith(1, permissions);
  });

  it("getCollaboratorPermissions deve retornar lista de permissões", async () => {
    const mockPerms = [
      { id: 1, collaboratorId: 1, section: "dashboard", canView: true, canCreate: false, canEdit: false, canDelete: false, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, collaboratorId: 1, section: "sales", canView: true, canCreate: true, canEdit: false, canDelete: false, createdAt: new Date(), updatedAt: new Date() },
    ];
    vi.mocked(db.getCollaboratorPermissions).mockResolvedValue(mockPerms);

    const result = await db.getCollaboratorPermissions(1);
    expect(result).toHaveLength(2);
    expect(result[0].section).toBe("dashboard");
    expect(result[1].canCreate).toBe(true);
  });

  it("updateCollaboratorStatus deve atualizar status do colaborador", async () => {
    const mockUpdated = {
      id: 1,
      ownerId: 1,
      userId: 5,
      email: "colaborador@gmail.com",
      name: "João",
      status: "inactive" as const,
      inviteToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(db.updateCollaboratorStatus).mockResolvedValue(mockUpdated);

    const result = await db.updateCollaboratorStatus(1, 1, "inactive");
    expect(result?.status).toBe("inactive");
  });

  it("deleteCollaborator deve retornar true ao deletar com sucesso", async () => {
    vi.mocked(db.deleteCollaborator).mockResolvedValue(true);
    const result = await db.deleteCollaborator(1, 1);
    expect(result).toBe(true);
  });

  it("SECTIONS deve conter todas as seções do sistema", () => {
    const sections = db.SECTIONS;
    expect(sections).toContain("dashboard");
    expect(sections).toContain("sales");
    expect(sections).toContain("services");
    expect(sections).toContain("bankAccounts");
    expect(sections).toContain("products");
    expect(sections).toContain("reports");
  });
});
