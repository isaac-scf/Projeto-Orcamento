import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";

async function main() {
  const email = "gerente.teste@projeto-orcamento.local";
  const senha = process.env.SENHA_GERENTE;

  if (!senha || senha.length < 8) {
    throw new Error(
      "Defina SENHA_GERENTE com pelo menos 8 caracteres."
    );
  }

  const existente = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existente) {
    throw new Error(
      "O usuário de teste já existe. Nenhum dado foi alterado."
    );
  }

  const senhaHash = await bcrypt.hash(senha, 12);

  const gerente = await prisma.usuario.create({
    data: {
      nome: "Gerente de Teste",
      email,
      senhaHash,
      cargo: "GERENTE",
    },
    select: {
      id: true,
      nome: true,
      email: true,
      cargo: true,
    },
  });

  console.log("Gerente de teste criado:", gerente);
}

main()
  .catch((erro) => {
    console.error("Falha ao criar gerente:", erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
