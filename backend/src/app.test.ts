import { closeSync, mkdtempSync, openSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import type { AppConfig } from "./config.js";
import { createPrismaClient } from "./lib/prisma.js";

const config: AppConfig = {
  nodeEnv: "test",
  port: 0,
  databaseUrl: "",
  jwtSecret: "segredo-de-testes-com-mais-de-trinta-e-dois-caracteres",
  jwtIssuer: "sentinela-test",
  jwtAudience: "sentinela-web-test",
  corsOrigins: ["http://localhost:5173"],
  bcryptRounds: 4,
};

const testDir = mkdtempSync(path.join(tmpdir(), "sentinela-api-"));
const databasePath = path.join(testDir, "test.db");
closeSync(openSync(databasePath, "w"));
const prisma = createPrismaClient(`file:${databasePath}`);
const app = createApp({ prisma, config, enableRateLimit: false });

async function login(email: string, senha: string) {
  const response = await request(app).post("/api/auth/login").send({ email, senha });
  return response.body.token as string;
}

beforeAll(async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "usuarios" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "nome" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "senha_hash" TEXT NOT NULL,
      "perfil" TEXT NOT NULL,
      "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "atualizado_em" DATETIME NOT NULL
    )
  `);
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email")');
  for (const conta of [
    {
      nome: "Admin Teste",
      email: "admin@teste.com",
      senha: "Admin@123",
      perfil: "administrador" as const,
    },
    {
      nome: "Operador Teste",
      email: "operador@teste.com",
      senha: "Operador@123",
      perfil: "operador" as const,
    },
    {
      nome: "Cliente Teste",
      email: "cliente@teste.com",
      senha: "Cliente@123",
      perfil: "cliente" as const,
    },
  ]) {
    await prisma.usuario.create({
      data: {
        nome: conta.nome,
        email: conta.email,
        perfil: conta.perfil,
        senhaHash: await hash(conta.senha, 4),
      },
    });
  }
});

afterAll(async () => {
  await prisma.$disconnect();
  rmSync(testDir, { recursive: true, force: true });
});

describe("infraestrutura HTTP", () => {
  it("aceita a própria origem e recusa origens fora da allowlist", async () => {
    await request(app)
      .get("/api/health")
      .set("Host", "sentinela.local")
      .set("Origin", "http://sentinela.local")
      .expect(200)
      .expect("Access-Control-Allow-Origin", "http://sentinela.local");
    await request(app)
      .get("/api/health")
      .set("Host", "sentinela.local")
      .set("Origin", "https://origem-maliciosa.example")
      .expect(403);
  });
});

describe("autenticação JWT", () => {
  it("faz login, omite o hash e revalida a sessão", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@teste.com", senha: "Admin@123" })
      .expect(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.usuario).not.toHaveProperty("senhaHash");
    await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${response.body.token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.usuario.email).toBe("admin@teste.com");
        expect(body.usuario).not.toHaveProperty("senhaHash");
      });
  });

  it("rejeita credenciais, token ausente, inválido e expirado", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@teste.com", senha: "errada" })
      .expect(401);
    await request(app).get("/api/usuarios").expect(401);
    await request(app)
      .get("/api/usuarios")
      .set("Authorization", "Bearer token-invalido")
      .expect(401);
    const expirado = jwt.sign({ nome: "Admin", perfil: "administrador" }, config.jwtSecret, {
      algorithm: "HS256",
      subject: "1",
      expiresIn: -1,
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    });
    await request(app).get("/api/usuarios").set("Authorization", `Bearer ${expirado}`).expect(401);
  });

  it("invalida conta excluída e aplica uma permissão alterada imediatamente", async () => {
    const senhaHash = await hash("Temporaria@123", 4);
    const temporaria = await prisma.usuario.create({
      data: {
        nome: "Conta Temporária",
        email: "temporaria@teste.com",
        senhaHash,
        perfil: "cliente",
      },
    });
    const tokenTemporario = await login("temporaria@teste.com", "Temporaria@123");
    await prisma.usuario.delete({ where: { id: temporaria.id } });
    await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${tokenTemporario}`)
      .expect(401);

    const tokenOperador = await login("operador@teste.com", "Operador@123");
    await prisma.usuario.update({
      where: { email: "operador@teste.com" },
      data: { perfil: "cliente" },
    });
    await request(app)
      .get("/api/usuarios")
      .set("Authorization", `Bearer ${tokenOperador}`)
      .expect(403);
    await prisma.usuario.update({
      where: { email: "operador@teste.com" },
      data: { perfil: "operador" },
    });
  });

  it("limita cinco logins malsucedidos por IP em quinze minutos", async () => {
    const appComLimite = createApp({ prisma, config, enableRateLimit: true });
    for (let tentativa = 0; tentativa < 5; tentativa += 1) {
      await request(appComLimite)
        .post("/api/auth/login")
        .send({ email: "inexistente@teste.com", senha: "SenhaErrada" })
        .expect(401);
    }
    await request(appComLimite)
      .post("/api/auth/login")
      .send({ email: "inexistente@teste.com", senha: "SenhaErrada" })
      .expect(429);
  });
});

describe("validação e CRUD", () => {
  it("permite ao administrador listar e criar, validando senha, campos e duplicidade", async () => {
    const token = await login("admin@teste.com", "Admin@123");
    await request(app)
      .get("/api/usuarios")
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.usuarios).toHaveLength(3);
        expect(JSON.stringify(body)).not.toContain("senhaHash");
      });
    await request(app)
      .post("/api/usuarios")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Nova Cliente", email: "nova@teste.com", senha: "fraca", perfil: "cliente" })
      .expect(400);
    await request(app)
      .post("/api/usuarios")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nome: "Nova Cliente",
        email: "nova@teste.com",
        senha: "Nova@123",
        perfil: "cliente",
        admin: true,
      })
      .expect(400);
    await request(app)
      .post("/api/usuarios")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Nova Cliente", email: "nova@teste.com", senha: "Nova@123", perfil: "cliente" })
      .expect(201);
    await request(app)
      .post("/api/usuarios")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Duplicada", email: "nova@teste.com", senha: "Nova@123", perfil: "cliente" })
      .expect(409);
  });
});

describe("matriz RBAC", () => {
  it("restringe o cliente aos próprios dados", async () => {
    const token = await login("cliente@teste.com", "Cliente@123");
    await request(app).get("/api/usuarios").set("Authorization", `Bearer ${token}`).expect(403);
    await request(app).get("/api/usuarios/3").set("Authorization", `Bearer ${token}`).expect(200);
    await request(app).get("/api/usuarios/2").set("Authorization", `Bearer ${token}`).expect(403);
  });

  it("impede elevação de privilégio e edição de administrador pelo operador", async () => {
    const token = await login("operador@teste.com", "Operador@123");
    await request(app)
      .put("/api/usuarios/2")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Operador Teste", email: "operador@teste.com", perfil: "administrador" })
      .expect(403);
    await request(app)
      .put("/api/usuarios/1")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Admin Alterado", email: "admin@teste.com" })
      .expect(403);
    await request(app)
      .put("/api/usuarios/3")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Cliente Atualizada", email: "cliente@teste.com" })
      .expect(200);
    await request(app)
      .delete("/api/usuarios/3")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });

  it("protege autoexclusão e o último administrador", async () => {
    const token = await login("admin@teste.com", "Admin@123");
    await request(app)
      .delete("/api/usuarios/1")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
    await request(app)
      .put("/api/usuarios/1")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Admin Teste", email: "admin@teste.com", perfil: "cliente" })
      .expect(403);
  });

  it("permite exclusão administrativa e devolve 204", async () => {
    const token = await login("admin@teste.com", "Admin@123");
    const alvo = await prisma.usuario.findUniqueOrThrow({ where: { email: "nova@teste.com" } });
    await request(app)
      .delete(`/api/usuarios/${alvo.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204)
      .expect("");
    await request(app)
      .get(`/api/usuarios/${alvo.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
  });
});
