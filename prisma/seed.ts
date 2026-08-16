import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const cpf = process.env.SEED_ADMIN_CPF ?? "00000000000";
  const senha = process.env.SEED_ADMIN_PASSWORD ?? "troque-esta-senha";

  const passwordHash = await bcrypt.hash(senha, 10);

  const admin = await prisma.user.upsert({
    where: { cpf },
    update: {},
    create: {
      cpf,
      nome: "Administrador SME Baraúna",
      role: "ADMIN",
      passwordHash,
    },
  });

  await prisma.indicadoresLanding.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  console.log(`Admin provisionado: CPF ${admin.cpf} (defina SEED_ADMIN_CPF/SEED_ADMIN_PASSWORD para customizar).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
