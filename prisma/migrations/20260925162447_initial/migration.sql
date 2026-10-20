/*
  Warnings:

  - Added the required column `cargo` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Cargo" AS ENUM ('VENDEDOR', 'SUPERVISOR', 'GERENTE');

-- CreateEnum
CREATE TYPE "StatusOrcamento" AS ENUM ('RASCUNHO', 'APROVADO', 'PENDENTE_APROVACAO', 'REJEITADO');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "cargo" "Cargo" NOT NULL;

-- CreateTable
CREATE TABLE "Produto" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "custoUnitario" DOUBLE PRECISION NOT NULL,
    "precoTabela" DOUBLE PRECISION NOT NULL,
    "categoria" TEXT NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orcamento" (
    "id" SERIAL NOT NULL,
    "vendedorId" INTEGER NOT NULL,
    "cliente" TEXT NOT NULL,
    "status" "StatusOrcamento" NOT NULL,
    "margemBruta" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Produto_codigo_key" ON "Produto"("codigo");

-- AddForeignKey
ALTER TABLE "Orcamento" ADD CONSTRAINT "Orcamento_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
