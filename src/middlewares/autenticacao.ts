
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("A variável JWT_SECRET não está definida no .env");
}

interface TokenPayload {
  usuarioId: number;
}

export interface RequestAutenticada extends Request {
  usuarioId?: number;
  cargoUsuario?: "VENDEDOR" | "SUPERVISOR" | "GERENTE";
}

export async function autenticar(
  req: RequestAutenticada,
  res: Response,
  next: NextFunction
) {
  const autorizacao = req.headers.authorization;

  if (!autorizacao?.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token não informado." });
  }

  try {
    const token = autorizacao.slice(7);
    const payload = jwt.verify(token, JWT_SECRET!) as TokenPayload;

    if (!Number.isInteger(payload.usuarioId)) {
      return res.status(401).json({ erro: "Token inválido." });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.usuarioId },
      select: { id: true, cargo: true },
    });

    if (!usuario) {
      return res.status(401).json({ erro: "Usuário não encontrado." });
    }

    req.usuarioId = usuario.id;
    req.cargoUsuario = usuario.cargo;

    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }
}
