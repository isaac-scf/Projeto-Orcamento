
import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";

async function main() {
  const email = "vendedorteste@gmail.com";
  const senha = process.env.SENHA_INICIAL;

  if (!senha || senha.length < 8) {
    throw new Error(
      "Defina SENHA_INICIAL com pelo menos 8 caracteres no ambiente."
    );
  }

  const senhaHash = await bcrypt.hash(senha, 12);

  const usuario = await prisma.usuario.update({
    where: { email },
    data: { senhaHash },
    select: { id: true, email: true, cargo: true },
  });

  console.log("Senha definida para o usuário:", usuario);
}

main()
  .catch((erro) => {
    console.error("Não foi possível definir a senha:", erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
