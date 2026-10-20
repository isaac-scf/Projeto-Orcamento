import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface ProdutoImportado {
  codigo: string;
  descricao: string;
  custoUnitario: number;
  precoTabela: number;
  categoria: string;
}

function lerArquivo(filePath: string): any[] {
  const extensao = path.extname(filePath).toLowerCase();

  if (extensao === ".csv") {
    const conteudo = fs.readFileSync(filePath, "utf-8");
    return parse(conteudo, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  }

  if (extensao === ".xlsx" || extensao === ".xls") {
    const workbook = XLSX.readFile(filePath);
    const primeiraAba = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[primeiraAba]);
  }

  throw new Error("Formato de arquivo não suportado. Use .csv ou .xlsx");
}

function validarLinha(linha: any): ProdutoImportado | null {
  if (!linha.codigo || !linha.descricao || !linha.categoria) return null;

  const custoUnitario = Number(linha.custoUnitario);
  const precoTabela = Number(linha.precoTabela);

  if (isNaN(custoUnitario) || isNaN(precoTabela)) return null;

  return {
    codigo: String(linha.codigo).trim(),
    descricao: String(linha.descricao).trim(),
    custoUnitario,
    precoTabela,
    categoria: String(linha.categoria).trim(),
  };
}

export async function importarProdutos(filePath: string) {
  const linhasBrutas = lerArquivo(filePath);

  const validos: ProdutoImportado[] = [];
  const invalidos: number[] = [];

  linhasBrutas.forEach((linha, index) => {
    const produto = validarLinha(linha);
    if (produto) {
      validos.push(produto);
    } else {
      invalidos.push(index + 1);
    }
  });

  let importados = 0;
  for (const produto of validos) {
    await prisma.produto.upsert({
      where: { codigo: produto.codigo },
      update: produto,
      create: produto,
    });
    importados++;
  }

  return {
    totalLinhas: linhasBrutas.length,
    importados,
    invalidos,
  };
}

export async function buscarProdutos(termo: string) {
  return prisma.produto.findMany({
    where: {
      OR: [
        { codigo: { contains: termo, mode: "insensitive" } },
        { descricao: { contains: termo, mode: "insensitive" } },
      ],
    },
  });
}