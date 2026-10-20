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
    return res.status(400).json({
      erro: (erro as Error).message,
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
    return res.status(401).json({ erro: "Usuário não autenticado." });
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

    const valorBruto = dados.itens.reduce((total, item) => {
      const produto = produtoPorId.get(item.produtoId)!;

      return total + produto.precoTabela * item.quantidade;
    }, 0);

    const custoTotal = dados.itens.reduce((total, item) => {
      const produto = produtoPorId.get(item.produtoId)!;

      return total + produto.custoUnitario * item.quantidade;
    }, 0);

    const precoFinal = calcularDesconto(
      valorBruto,
      dados.descontoPercentual
    );

    if (precoFinal <= 0) {
      return res.status(400).json({
        erro: "O desconto não pode zerar o valor do orçamento.",
      });
    }

    const margemBruta = calcularMargemBruta(
      precoFinal,
      custoTotal
    );

    const margemValida = validarMargemMinima(
      precoFinal,
      custoTotal
    );

    const alcadaValida = validarAlcada(
      vendedor.cargo,
      dados.descontoPercentual
    );

    let status:
      | "RASCUNHO"
      | "APROVADO"
      | "PENDENTE_APROVACAO"
      | "REJEITADO" = "RASCUNHO";

    if (!margemValida) {
      return res.status(400).json({
        erro: "Orçamento bloqueado: margem mínima de 15% não atingida.",
      });
    }

    status = alcadaValida
    ? mudarStatus("RASCUNHO", "APROVADO")
    : mudarStatus("RASCUNHO", "PENDENTE_APROVACAO");

    const orcamento = await prisma.orcamento.create({
      data: {
        vendedorId: vendedor.id,
        cliente: dados.cliente,
        margemBruta,
        status,
        itens: {
          create: dados.itens.map((item) => {
            const produto = produtoPorId.get(item.produtoId)!;

            return {
              produtoId: produto.id,
              quantidade: item.quantidade,
              precoUnitario: calcularDesconto(
                produto.precoTabela,
                dados.descontoPercentual
              ),
              custoUnitario: produto.custoUnitario,
            };
          }),
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
        itens: true,
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

