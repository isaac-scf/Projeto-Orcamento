import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  usuarioFindUnique: vi.fn(),
  produtoFindMany: vi.fn(),
  orcamentoCreate: vi.fn(),
}));

vi.mock("../generated/client", () => ({
  PrismaClient: class {
    usuario = { findUnique: mocks.usuarioFindUnique };
    produto = { findMany: mocks.produtoFindMany };
    orcamento = { create: mocks.orcamentoCreate };
  },
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: class {
    constructor(..._args: any[]) {}
  },
}));

vi.mock("pg", () => ({
  Pool: class {
    constructor(..._args: any[]) {}
  },
}));

import { criarOrcamento } from "../services/orcamento.service";

describe("criarOrcamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.usuarioFindUnique.mockResolvedValue({
      id: 1,
      nome: "Vendedor de Teste",
      cargo: "VENDEDOR",
    });

    mocks.produtoFindMany.mockResolvedValue([
      {
        id: 2,
        precoTabela: 1000,
        custoUnitario: 800,
      },
    ]);

    mocks.orcamentoCreate.mockResolvedValue({
      id: 123,
      vendedorId: 1,
      cliente: "Cliente Teste",
      status: "APROVADO",
      margemBruta: 15.79,
      itens: [],
    });
  });

  it("deve criar um orçamento aprovado", async () => {
    const resultado = await criarOrcamento(
      1,
      "Cliente Teste",
      [{ produtoId: 2, quantidade: 1 }],
      5
    );

    expect(resultado.id).toBe(123);
    expect(mocks.orcamentoCreate).toHaveBeenCalledOnce();

    expect(mocks.orcamentoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          vendedorId: 1,
          cliente: "Cliente Teste",
          status: "APROVADO",
        }),
      })
    );
  });

  it("deve rejeitar vendedor inexistente", async () => {
    mocks.usuarioFindUnique.mockResolvedValue(null);

    await expect(
      criarOrcamento(99, "Cliente Teste", [{ produtoId: 2, quantidade: 1 }], 0)
    ).rejects.toThrow("Vendedor não encontrado");

    expect(mocks.orcamentoCreate).not.toHaveBeenCalled();
  });

  it("deve rejeitar produto inexistente", async () => {
    mocks.produtoFindMany.mockResolvedValue([]);

    await expect(
      criarOrcamento(1, "Cliente Teste", [{ produtoId: 999, quantidade: 1 }], 0)
    ).rejects.toThrow("Um ou mais produtos não foram encontrados");

    expect(mocks.orcamentoCreate).not.toHaveBeenCalled();
  });

  it("deve bloquear orçamento que viola a margem mínima", async () => {
    mocks.produtoFindMany.mockResolvedValue([
      {
        id: 2,
        precoTabela: 1000,
        custoUnitario: 950,
      },
    ]);

    await expect(
      criarOrcamento(1, "Cliente Teste", [{ produtoId: 2, quantidade: 1 }], 10)
    ).rejects.toThrow();

    expect(mocks.orcamentoCreate).not.toHaveBeenCalled();
  });

  it("deve deixar pendente um desconto acima da alçada do vendedor", async () => {
    mocks.orcamentoCreate.mockImplementation(async (dados: any) => ({
      id: 124,
      ...dados.data,
      itens: [],
    }));

    const resultado = await criarOrcamento(
      1,
      "Cliente Teste",
      [{ produtoId: 2, quantidade: 1 }],
      8
    );

    expect(resultado.status).toBe("PENDENTE_APROVACAO");
  });
});
