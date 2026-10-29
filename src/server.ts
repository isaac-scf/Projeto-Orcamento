
import "dotenv/config";

import express from "express";

import {
  upload,
  importarProdutosController,
  buscarProdutosController,
} from "./controllers/produto.controller";

import {
  aprovarOrcamentoController,
  criarOrcamentoController,
  listarOrcamentosPendentesController,
} from "./controllers/orcamento.controller";

import { validarCriarOrcamento } from "./dtos/orcamento.dto";
import { loginController } from "./controllers/autenticacao.controller";
import { autenticar } from "./middlewares/autenticacao";

const app = express();

app.use(express.json());

app.post("/login", loginController);

app.get("/", (req, res) => {
  res.json({ mensagem: "API funcionando!" });
});

app.post(
  "/produtos/importar",
  autenticar,
  upload.single("arquivo"),
  importarProdutosController
);

app.get("/produtos/busca", buscarProdutosController);

app.post(
  "/orcamentos",
  autenticar,
  validarCriarOrcamento,
  criarOrcamentoController
);

app.get(
  "/orcamentos/pendentes",
  autenticar,
  listarOrcamentosPendentesController
);

app.post(
  "/orcamentos/:id/aprovar",
  autenticar,
  aprovarOrcamentoController
);

app.listen(3000, "0.0.0.0", () => {
  console.log("Servidor rodando na porta 3000");
});

