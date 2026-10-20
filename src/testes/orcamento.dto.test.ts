import { describe, it, expect, vi } from "vitest";
import { criarOrcamentoSchema,
         validarCriarOrcamento,
 } from "../dtos/orcamento.dto";

describe("criarOrcamentoSchema", () => {
  const dadosValidos = {
    cliente: "Cliente Teste",
    itens: [
      {
        produtoId: 51,
        quantidade: 2,
      },
    ],
    descontoPercentual: 0,
  };

  it("deve aceitar um orçamento válido", () => {
    const resultado = criarOrcamentoSchema.safeParse(dadosValidos);

    expect(resultado.success).toBe(true);
  });

  it("deve aplicar desconto zero quando não informado", () => {
    const { descontoPercentual, ...dados } = dadosValidos;

    const resultado = criarOrcamentoSchema.safeParse(dados);

    expect(resultado.success).toBe(true);

    if (resultado.success) {
      expect(resultado.data.descontoPercentual).toBe(0);
    }
  });

  it("deve rejeitar cliente vazio", () => {
    const resultado = criarOrcamentoSchema.safeParse({
      ...dadosValidos,
      cliente: "",
    });

    expect(resultado.success).toBe(false);
  });

  it("deve rejeitar orçamento sem itens", () => {
    const resultado = criarOrcamentoSchema.safeParse({
      ...dadosValidos,
      itens: [],
    });

    expect(resultado.success).toBe(false);
  });

  it("deve rejeitar quantidade inválida", () => {
    const resultado = criarOrcamentoSchema.safeParse({
      ...dadosValidos,
      itens: [{ produtoId: 51, quantidade: 0 }],
    });

    expect(resultado.success).toBe(false);
  });

  it("deve rejeitar desconto acima de 100%", () => {
    const resultado = criarOrcamentoSchema.safeParse({
      ...dadosValidos,
      descontoPercentual: 101,
    });

    expect(resultado.success).toBe(false);
  });

  it("deve rejeitar desconto negativo", () => {
    const resultado = criarOrcamentoSchema.safeParse({
      ...dadosValidos,
      descontoPercentual: -1,
    });

    expect(resultado.success).toBe(false);
  });
});

describe("validarCriarOrcamento", () => {
  it("deve chamar next quando os dados forem válidos", () => {
    const req = {
      body: {
        cliente: "Cliente Teste",
        itens: [{ produtoId: 51, quantidade: 2 }],
        descontoPercentual: 10,
      },
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;

    const next = vi.fn();

    validarCriarOrcamento(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("deve retornar 400 quando os dados forem inválidos", () => {
    const req = {
      body: {
        cliente: "",
        itens: [],
        descontoPercentual: 10,
      },
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;

    const next = vi.fn();

    validarCriarOrcamento(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });
});
