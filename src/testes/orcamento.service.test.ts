import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  calcularDesconto,
  calcularMargemBruta,
  calcularTotalItem,
  validarMargemMinima,
  validarAlcada,
  calcularOrcamento,
  podeMudarStatus,
  mudarStatus,
  aprovarOrcamento,
  podeAprovarOrcamento,
} from "../services/orcamento.service";

describe("orcamento.service", () => {
  it("deve calcular desconto corretamente", () => {
    expect(calcularDesconto(1000, 10)).toBe(900);
  });

  it("deve calcular margem bruta corretamente", () => {
    expect(calcularMargemBruta(1000, 800)).toBe(20);
  });

  it("deve calcular total do item corretamente", () => {
    expect(calcularTotalItem(100, 5)).toBe(500);
  });

  it("deve validar margem mínima", () => {
    expect(validarMargemMinima(1150, 1000)).toBe(true);
    expect(validarMargemMinima(1149, 1000)).toBe(false);
  });

  it("deve validar alçada do vendedor", () => {
    expect(validarAlcada("VENDEDOR", 5)).toBe(true);
    expect(validarAlcada("VENDEDOR", 6)).toBe(false);
  });
});

  it("deve validar a alçada de todos os cargos", () => {
    expect(validarAlcada("VENDEDOR", 5)).toBe(true);
    expect(validarAlcada("VENDEDOR", 6)).toBe(false);

    expect(validarAlcada("SUPERVISOR", 10)).toBe(true);
    expect(validarAlcada("SUPERVISOR", 11)).toBe(false);

    expect(validarAlcada("GERENTE", 50)).toBe(true);
  });

    it("deve calcular um orçamento aprovado corretamente", () => {
    const resultado = calcularOrcamento(
    [{ precoUnitario: 1000, custoUnitario: 800, quantidade: 1 }],
     5,
    "VENDEDOR"
  );

    expect(resultado.valorBruto).toBe(1000);
    expect(resultado.custoTotal).toBe(800);
    expect(resultado.precoFinal).toBe(950);
    expect(resultado.margemBruta).toBeCloseTo(15.79, 2);
    expect(resultado.margemValida).toBe(true);
    expect(resultado.alcadaValida).toBe(true);
    expect(resultado.status).toBe("APROVADO");
  });

  it("deve deixar orçamento pendente quando a alçada não for suficiente", () => {
    const resultado = calcularOrcamento(
    [{ precoUnitario: 1000, custoUnitario: 800, quantidade: 1 }],
    8,
    "VENDEDOR"
  );

    expect(resultado.alcadaValida).toBe(false);
    expect(resultado.margemValida).toBe(true);
    expect(resultado.status).toBe("PENDENTE_APROVACAO");
  });

 
  it("deve bloquear orçamento quando a margem for inválida", () => {
    expect(() =>
      calcularOrcamento(
        [{ precoUnitario: 1000, custoUnitario: 950, quantidade: 1 }],
        10,
        "VENDEDOR"
      )
    ).toThrow(
      "Orçamento bloqueado: preço final inferior ao custo + 15%."
    );
  });


    it("deve permitir transições válidas de status", () => {
    expect(podeMudarStatus("RASCUNHO", "APROVADO")).toBe(true);
    expect(podeMudarStatus("RASCUNHO", "PENDENTE_APROVACAO")).toBe(true);

    expect(podeMudarStatus("PENDENTE_APROVACAO", "APROVADO")).toBe(true);
    expect(podeMudarStatus("PENDENTE_APROVACAO", "REJEITADO")).toBe(true);
  });

  it("deve bloquear transições inválidas de status", () => {
    expect(podeMudarStatus("APROVADO", "RASCUNHO")).toBe(false);
    expect(podeMudarStatus("APROVADO", "REJEITADO")).toBe(false);
    expect(podeMudarStatus("REJEITADO", "APROVADO")).toBe(false);
    expect(podeMudarStatus("RASCUNHO", "REJEITADO")).toBe(false);
  });

  it("deve mudar o status quando a transição for válida", () => {
    expect(mudarStatus("RASCUNHO", "APROVADO")).toBe("APROVADO");
    expect(mudarStatus("PENDENTE_APROVACAO", "REJEITADO")).toBe("REJEITADO");
  });

  it("deve lançar erro quando a transição for inválida", () => {
    expect(() => {
      mudarStatus("APROVADO", "APROVADO");
    }).toThrow(
      "Transição de APROVADO para APROVADO não permitida"
    );
  });  it("deve permitir aprovação para supervisor e gerente", () => {
    expect(podeAprovarOrcamento("SUPERVISOR")).toBe(true);
    expect(podeAprovarOrcamento("GERENTE")).toBe(true);
  });

  it("deve bloquear aprovação para vendedor", () => {
    expect(podeAprovarOrcamento("VENDEDOR")).toBe(false);

    expect(() => {
      aprovarOrcamento("PENDENTE_APROVACAO", "VENDEDOR");
    }).toThrow(
      "Cargo VENDEDOR não possui permissão para aprovar orçamentos"
    );
  });

  it("deve aprovar orçamento pendente como supervisor", () => {
    expect(
      aprovarOrcamento("PENDENTE_APROVACAO", "SUPERVISOR")
    ).toBe("APROVADO");
  });

  it("deve aprovar orçamento pendente como gerente", () => {
    expect(
      aprovarOrcamento("PENDENTE_APROVACAO", "GERENTE")
    ).toBe("APROVADO");
  });

  it("deve bloquear aprovação de orçamento já aprovado", () => {
    expect(() => {
      aprovarOrcamento("APROVADO", "SUPERVISOR");
    }).toThrow(
      "Transição de APROVADO para APROVADO não permitida"
    );
  });