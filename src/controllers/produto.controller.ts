import { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { importarProdutos, buscarProdutos } from "../services/produto.service";

// Salva o upload temporariamente em disco antes de processar,
// preservando a extensão original (multer por padrão salva sem extensão)
const uploadDir = path.join(__dirname, "..", "..", "tmp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const extensao = path.extname(file.originalname);
    const nomeUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extensao}`;
    cb(null, nomeUnico);
  },
});

export const upload = multer({ storage });

// POST /produtos/importar
// Espera o arquivo no campo "arquivo" do form-data
export async function importarProdutosController(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ erro: "Nenhum arquivo enviado. Use o campo 'arquivo'." });
  }

  const filePath = req.file.path;

  try {
    const resultado = await importarProdutos(filePath);
    return res.status(200).json(resultado);
  } catch (erro) {
    console.error("Erro ao importar produtos:", erro);
    return res.status(500).json({ erro: "Falha ao importar produtos." });
  } finally {
    // Apaga o arquivo temporário independente de sucesso ou erro
    fs.unlink(filePath, (err) => {
      if (err) console.error("Erro ao apagar arquivo temporário:", err);
    });
  }
}

// GET /produtos/busca?termo=xxx
export async function buscarProdutosController(req: Request, res: Response) {
  const termo = req.query.termo;

  if (!termo || typeof termo !== "string") {
    return res.status(400).json({ erro: "Parâmetro 'termo' é obrigatório." });
  }

  try {
    const produtos = await buscarProdutos(termo);
    return res.status(200).json(produtos);
  } catch (erro) {
    console.error("Erro ao buscar produtos:", erro);
    return res.status(500).json({ erro: "Falha ao buscar produtos." });
  }
}