import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { obterEstrategiaAlcada, type Cargo } from "./estrategia-alcada.service";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export function calcularDesconto(
  valor: number,
  descontoPercentual: number
): number {
  return valor * (1 - descontoPercentual / 100);
}

export function calcularMargemBruta(
  precoFinal: number,
  custoTotal: number
): number {
  return ((precoFinal - custoTotal) / precoFinal) * 100;
}

export function validarMargemMinima(
  precoFinal: number,
  custoTotal: number
): boolean {
  const precoMinimo = custoTotal * 1.15;
 
  return precoFinal >= precoMinimo;
}

export function calcularTotalItem(
  precoUnitario: number,
  quantidade: number
): number {
  return precoUnitario * quantidade;
}

export interface ItemCalculo {
  precoUnitario: number;
  custoUnitario: number;
  quantidade: number;
}


export class MargemInvalidaException extends Error {
  constructor() {
    super("Orçamento bloqueado: preço final inferior ao custo + 15%.");
    this.name = "MargemInvalidaException";
  }
}


export function calcularOrcamento(
  itens: ItemCalculo[],
  descontoPercentual: number,
  cargo: "VENDEDOR" | "SUPERVISOR" | "GERENTE"
) {
  const valorBruto = itens.reduce(
    (total, item) => total + calcularTotalItem(item.precoUnitario, item.quantidade),
    0
  );

  const custoTotal = itens.reduce(
    (total, item) => total + calcularTotalItem(item.custoUnitario, item.quantidade),
    0
  );

  const precoFinal = calcularDesconto(valorBruto, descontoPercentual);

  const margemBruta = calcularMargemBruta(
    precoFinal,
    custoTotal
  );

    const margemValida = validarMargemMinima(
    precoFinal,
    custoTotal
  );

  const alcadaValida = validarAlcada(
    cargo,
    descontoPercentual
  );

  let status:
    | "RASCUNHO"
    | "APROVADO"
    | "PENDENTE_APROVACAO"
    | "REJEITADO";

    if (!margemValida) {
    throw new MargemInvalidaException();
  } else if (alcadaValida) {
    status = mudarStatus("RASCUNHO", "APROVADO");
  } else {
    status = mudarStatus(
      "RASCUNHO",
      "PENDENTE_APROVACAO"
    );
  }

  return {
    valorBruto,
    custoTotal,
    descontoPercentual,
    precoFinal,
    margemBruta,
    margemValida,
    alcadaValida,
    status
  };
}

export function validarAlcada(
  cargo: "VENDEDOR" | "SUPERVISOR" | "GERENTE",
  descontoPercentual: number
): boolean {
  const estrategia = obterEstrategiaAlcada(cargo);

  return estrategia.validarDesconto(descontoPercentual);
}

export function podeMudarStatus(
  statusAtual:
    | "RASCUNHO"
    | "APROVADO"
    | "PENDENTE_APROVACAO"
    | "REJEITADO",
  novoStatus:
    | "RASCUNHO"
    | "APROVADO"
    | "PENDENTE_APROVACAO"
    | "REJEITADO"
): boolean {
  if (statusAtual === "RASCUNHO") {
    return (
      novoStatus === "APROVADO" ||
      novoStatus === "PENDENTE_APROVACAO"
    );
  }

  if (statusAtual === "PENDENTE_APROVACAO") {
    return (
      novoStatus === "APROVADO" ||
      novoStatus === "REJEITADO"
    );
  }

  return false;
}

export function mudarStatus(
  statusAtual:
    | "RASCUNHO"
    | "APROVADO"
    | "PENDENTE_APROVACAO"
    | "REJEITADO",
  novoStatus:
    | "RASCUNHO"
    | "APROVADO"
    | "PENDENTE_APROVACAO"
    | "REJEITADO"
) {
  if (!podeMudarStatus(statusAtual, novoStatus)) {
    throw new Error(
      `Transição de ${statusAtual} para ${novoStatus} não permitida`
    );
  }

  return novoStatus;
}

export function aprovarOrcamento(
  statusAtual:
    | "RASCUNHO"
    | "APROVADO"
    | "PENDENTE_APROVACAO"
    | "REJEITADO",
  cargo: "VENDEDOR" | "SUPERVISOR" | "GERENTE"
) {
  if (!podeAprovarOrcamento(cargo)) {
    throw new Error(
      `Cargo ${cargo} não possui permissão para aprovar orçamentos`
    );
  }

  return mudarStatus(statusAtual, "APROVADO");
}

export function podeAprovarOrcamento(
  cargo: "VENDEDOR" | "SUPERVISOR" | "GERENTE"
): boolean {
  return cargo === "SUPERVISOR" || cargo === "GERENTE";
}

export async function criarOrcamento(
  vendedorId: number,
  cliente: string,
  itens: { produtoId: number; quantidade: number }[],
  descontoPercentual: number
) {
  const vendedor = await prisma.usuario.findUnique({
    where: { id: vendedorId },
  });

  if (!vendedor) {
    throw new Error("Vendedor não encontrado");
  }

  const produtoIds = itens.map((item) => item.produtoId);

  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds } },
  });

  if (produtos.length !== produtoIds.length) {
    throw new Error("Um ou mais produtos não foram encontrados");
  }

    const itensCalculo = itens.map((item) => {
    const produto = produtos.find((p) => p.id === item.produtoId);

    return {
      precoUnitario: produto!.precoTabela,
      custoUnitario: produto!.custoUnitario,
      quantidade: item.quantidade,
    };
  });

const resultado = calcularOrcamento(
  itensCalculo,
  descontoPercentual,
  vendedor.cargo
);

const orcamentoCriado = await prisma.orcamento.create({
  data: {
    vendedorId,
    cliente,
    status: resultado.status,
    margemBruta: resultado.margemBruta,
    itens: {
      create: itens.map((item) => {
        const produto = produtos.find((p) => p.id === item.produtoId)!;

        return {
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: produto.precoTabela,
          custoUnitario: produto.custoUnitario,
        };
      }),
    },
  },
  include: {
    itens: true,
  },
});

return orcamentoCriado;
}