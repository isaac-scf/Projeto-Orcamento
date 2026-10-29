
import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";

async function main() {
  const emailAtualGerente = "gerente.teste@projeto-orcamento.local";
  const novoEmailGerente = process.env.NOVO_EMAIL_GERENTE;
  const emailVendedor = process.env.EMAIL_VENDEDOR;
  const novaSenhaVendedor = process.env.NOVA_SENHA_VENDEDOR;

  if (!novoEmailGerente || !emailVendedor || !novaSenhaVendedor) {
    throw new Error(
      "Defina NOVO_EMAIL_GERENTE, EMAIL_VENDEDOR e NOVA_SENHA_VENDEDOR."
    );
  }

  if (novaSenhaVendedor.length < 8) {
    throw new Error("A nova senha deve ter pelo menos 8 caracteres.");
  }

  const gerente = await prisma.usuario.findUnique({
    where: { email: emailAtualGerente },
  });

  if (!gerente || gerente.cargo !== "GERENTE") {
    throw new Error("Gerente de teste não encontrado.");
  }

  const vendedor = await prisma.usuario.findUnique({
    where: { email: emailVendedor },
  });

  if (!vendedor || vendedor.cargo !== "VENDEDOR") {
    throw new Error("Vendedor não encontrado. Confira o e-mail.");
  }

  const emailOcupado = await prisma.usuario.findUnique({
    where: { email: novoEmailGerente },
  });

  if (emailOcupado && emailOcupado.id !== gerente.id) {
    throw new Error("O novo e-mail já pertence a outro usuário.");
  }

  const senhaHash = await bcrypt.hash(novaSenhaVendedor, 12);

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: gerente.id },
      data: { email: novoEmailGerente },
    }),
    prisma.usuario.update({
      where: { id: vendedor.id },
      data: { senhaHash },
    }),
  ]);

  console.log("Acessos atualizados com sucesso.");
  console.log("E-mail do gerente:", novoEmailGerente);
  console.log("Senha do vendedor redefinida.");
}

main()
  .catch((erro) => {
    console.error("Falha ao atualizar acessos:", erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
