import "dotenv/config";
import { hash } from "bcryptjs";
import { createPrismaClient } from "../src/lib/prisma.js";

const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
const prisma = createPrismaClient(databaseUrl);

const contas = [
  {
    nome: "Administrador do Sistema",
    email: "admin@sistema.com",
    senha: "Admin@123",
    perfil: "administrador" as const,
  },
  {
    nome: "Operador de Demonstração",
    email: "operador@sistema.com",
    senha: "Operador@123",
    perfil: "operador" as const,
  },
  {
    nome: "Cliente de Demonstração",
    email: "cliente@sistema.com",
    senha: "Cliente@123",
    perfil: "cliente" as const,
  },
];

try {
  for (const conta of contas) {
    const senhaHash = await hash(conta.senha, rounds);
    await prisma.usuario.upsert({
      where: { email: conta.email },
      update: { nome: conta.nome, senhaHash, perfil: conta.perfil },
      create: { nome: conta.nome, email: conta.email, senhaHash, perfil: conta.perfil },
    });
  }
  console.log("Contas de demonstração prontas.");
} finally {
  await prisma.$disconnect();
}
