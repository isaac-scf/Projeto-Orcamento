import { z } from "zod";
import { Request, Response, NextFunction } from "express";

const itemOrcamentoSchema = z.object({
  produtoId: z.number().int().positive(),
  quantidade: z.number().int().positive(),
  descontoPercentual: z.number().min(0).max(100).default(0),
});

export const criarOrcamentoSchema = z.object({
  cliente: z.string().min(1, "Cliente é obrigatório"),
  itens: z
    .array(itemOrcamentoSchema)
    .min(1, "O orçamento precisa ter pelo menos um item"),
  descontoPercentual: z.number().min(0).max(100).default(0),
});

export type CriarOrcamentoInput = z.infer<typeof criarOrcamentoSchema>;

export function validarCriarOrcamento(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const resultado = criarOrcamentoSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({ erro: resultado.error.issues });
  }

  Object.assign(req.body, resultado.data);
  next();
}
