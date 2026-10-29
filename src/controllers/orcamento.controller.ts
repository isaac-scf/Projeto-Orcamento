
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import type { CriarOrcamentoInput } from "../dtos/orcamento.dto";
import type { RequestAutenticada } from "../middlewares/autenticacao";

import {
  aprovarOrcamento,
  calcularDesconto,
  calcularMargemBruta,
  validarMargemMinima,
  validarAlcada,
  mudarStatus,
} from "../services/orcamento.service";

export async function aprovarOrcamentoController(
  req: RequestAutenticada,
  res: Response
) {
  const id = Number(req.params.id);
  const cargo = req.cargoUsuario;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: "ID inválido." });
  }

  if (cargo !== "SUPERVISOR" && cargo !== "GERENTE") {
    return res.status(403).json({
      erro: "Somente supervisor ou gerente pode aprovar.",
    });
  }

  try {
    const orcamento = await prisma.orcamento.findUnique({
      where: { id },
    });

    if (!orcamento) {
      return res.status(404).json({
        erro: "Orçamento não encontrado.",
      });
    }

    if (orcamento.status !== "PENDENTE_APROVACAO") {
      return res.status(400).json({
        erro: "Somente orçamentos pendentes podem ser aprovados.",
      });
    }

    const novoStatus = aprovarOrcamento(orcamento.status, cargo);

    const atualizado = await prisma.orcamento.update({
      where: { id },
      data: { status: novoStatus },
    });

    return res.status(200).json(atualizado);
  } catch (erro) {
    console.error("Erro ao aprovar orçamento:", erro);

    return res.status(500).json({
      erro: "Não foi possível aprovar o orçamento.",
    });
  }
}

export async function criarOrcamentoController(
  req: RequestAutenticada,
  res: Response
) {
  const dados = req.body as CriarOrcamentoInput;

  try {
    const vendedorId = req.usuarioId;

    if (!vendedorId) {
      return res.status(401).json({
        erro: "Usuário não autenticado.",
      });
    }

    const vendedor = await prisma.usuario.findUnique({
      where: { id: vendedorId },
    });

    if (!vendedor) {
      return res.status(404).json({
        erro: "Vendedor não encontrado.",
      });
    }

    const produtos = await prisma.produto.findMany({
      where: {
        id: {
          in: dados.itens.map((item) => item.produtoId),
        },
      },
    });

    const produtoPorId = new Map(
      produtos.map((produto) => [produto.id, produto])
    );

    if (
      produtoPorId.size !== dados.itens.length ||
      dados.itens.some((item) => !produtoPorId.has(item.produtoId))
    ) {
      return res.status(400).json({
        erro: "Existem produtos inválidos ou repetidos nos itens.",
      });
    }

    const itensCalculados = dados.itens.map((item) => {
      const produto = produtoPorId.get(item.produtoId)!;
      const descontoPercentual = item.descontoPercentual ?? 0;

      const precoUnitario = calcularDesconto(
        produto.precoTabela,
        descontoPercentual
      );

      return {
        produtoId: produto.id,
        quantidade: item.quantidade,
        descontoPercentual,
        precoUnitario,
        custoUnitario: produto.custoUnitario,
        total: precoUnitario * item.quantidade,
        custoTotal: produto.custoUnitario * item.quantidade,
      };
    });

    const precoFinal = itensCalculados.reduce(
      (total, item) => total + item.total,
      0
    );

    const custoTotal = itensCalculados.reduce(
      (total, item) => total + item.custoTotal,
      0
    );

    if (precoFinal <= 0) {
      return res.status(400).json({
        erro: "O preço final do orçamento deve ser maior que zero.",
      });
    }

    const margemBruta = calcularMargemBruta(precoFinal, custoTotal);
    const margemValida = validarMargemMinima(precoFinal, custoTotal);

    const alcadaValida = itensCalculados.every((item) =>
      validarAlcada(vendedor.cargo, item.descontoPercentual)
    );

    if (!margemValida) {
      return res.status(400).json({
        erro: "Orçamento bloqueado: margem mínima de 15% não atingida.",
      });
    }

    const status:
      | "RASCUNHO"
      | "APROVADO"
      | "PENDENTE_APROVACAO"
      | "REJEITADO" = alcadaValida
      ? mudarStatus("RASCUNHO", "APROVADO")
      : mudarStatus("RASCUNHO", "PENDENTE_APROVACAO");

    const orcamento = await prisma.orcamento.create({
      data: {
        vendedorId: vendedor.id,
        cliente: dados.cliente,
        margemBruta,
        status,
        itens: {
          create: itensCalculados.map((item) => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            custoUnitario: item.custoUnitario,
            descontoPercentual: item.descontoPercentual,
          })),
        },
      },
      include: {
        itens: true,
      },
    });

    return res.status(201).json(orcamento);
  } catch (erro) {
    console.error("Erro ao criar orçamento:", erro);

    return res.status(500).json({
      erro: "Não foi possível criar o orçamento.",
    });
  }
}

export async function listarOrcamentosPendentesController(
  req: RequestAutenticada,
  res: Response
) {
  if (
    req.cargoUsuario !== "SUPERVISOR" &&
    req.cargoUsuario !== "GERENTE"
  ) {
    return res.status(403).json({
      erro: "Somente supervisor ou gerente pode listar orçamentos pendentes.",
    });
  }

  try {
    const orcamentos = await prisma.orcamento.findMany({
      where: {
        status: "PENDENTE_APROVACAO",
      },
      include: {
        vendedor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        itens: {
          include: {
            produto: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    return res.status(200).json(orcamentos);
  } catch (erro) {
    console.error("Erro ao listar orçamentos pendentes:", erro);

    return res.status(500).json({
      erro: "Não foi possível listar os orçamentos pendentes.",
    });
  }
}
