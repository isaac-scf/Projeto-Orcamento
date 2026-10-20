
import { Request, Response } from "express";
import { fazerLogin } from "../services/autenticacao.service";

export async function loginController(req: Request, res: Response) {
  const { email, senha } = req.body ?? {};

  if (
    typeof email !== "string" ||
    typeof senha !== "string" ||
    !email.trim() ||
    !senha
  ) {
    return res.status(400).json({
      erro: "Informe um e-mail e uma senha válidos.",
    });
  }

  try {
    const resultado = await fazerLogin(email.trim(), senha);

    if (!resultado) {
      return res.status(401).json({
        erro: "E-mail ou senha incorretos.",
      });
    }

    return res.status(200).json(resultado);
  } catch (erro) {
    console.error("Erro no login:", erro);

    return res.status(500).json({
      erro: "Erro interno ao realizar login.",
    });
  }
}
