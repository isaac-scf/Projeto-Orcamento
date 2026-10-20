
import { Response, NextFunction } from "express";
import type { RequestAutenticada } from "./autenticacao";

type Cargo = "VENDEDOR" | "SUPERVISOR" | "GERENTE";

export function autorizarCargo(...cargosPermitidos: Cargo[]) {
  return (
    req: RequestAutenticada,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.cargoUsuario || !cargosPermitidos.includes(req.cargoUsuario)) {
      return res.status(403).json({
        erro: "Você não tem permissão para realizar esta ação.",
      });
    }

    next();
  };
}