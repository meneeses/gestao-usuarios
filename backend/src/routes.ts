import { compare, hash } from "bcryptjs";
import { type RequestHandler, Router } from "express";
import { gerarToken } from "./auth.js";
import type { AppConfig } from "./config.js";
import { Prisma, type PrismaClient } from "./generated/prisma/client.js";
import { HttpError } from "./lib/http-error.js";
import { usuarioPublico } from "./lib/usuarios.js";
import { atualizarUsuarioSchema, criarUsuarioSchema, idSchema, loginSchema } from "./schemas.js";

function exigirUsuario(usuario: Express.Request["usuario"]) {
  if (!usuario) throw new HttpError(401, "NAO_AUTENTICADO", "Usuário não autenticado");
  return usuario;
}

async function emailEmUso(prisma: PrismaClient, email: string, ignorarId?: number) {
  const usuario = await prisma.usuario.findUnique({ where: { email }, select: { id: true } });
  return Boolean(usuario && usuario.id !== ignorarId);
}

function idDaRota(valor: string | undefined): number {
  return idSchema.parse(valor);
}

export function criarRotasAuth(
  prisma: PrismaClient,
  config: AppConfig,
  authMiddleware: RequestHandler,
): Router {
  const router = Router();

  router.post("/login", async (req, res) => {
    const dados = loginSchema.parse(req.body);
    const usuario = await prisma.usuario.findUnique({ where: { email: dados.email } });
    if (!usuario || !(await compare(dados.senha, usuario.senhaHash))) {
      throw new HttpError(401, "CREDENCIAIS_INVALIDAS", "E-mail ou senha inválidos");
    }

    res.json({
      token: gerarToken(usuario, config),
      tipo: "Bearer",
      expiraEm: 3600,
      usuario: usuarioPublico(usuario),
    });
  });

  router.get("/me", authMiddleware, (req, res) => {
    res.json({ usuario: usuarioPublico(exigirUsuario(req.usuario)) });
  });

  return router;
}

export function criarRotasUsuarios(prisma: PrismaClient, config: AppConfig): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const atual = exigirUsuario(req.usuario);
    if (atual.perfil === "cliente") {
      throw new HttpError(403, "ACESSO_NEGADO", "Clientes não podem listar todos os usuários");
    }

    const usuarios = await prisma.usuario.findMany({ orderBy: { id: "asc" } });
    res.json({ usuarios: usuarios.map(usuarioPublico) });
  });

  router.get("/:id", async (req, res) => {
    const atual = exigirUsuario(req.usuario);
    const id = idDaRota(req.params.id);
    if (atual.perfil === "cliente" && atual.id !== id) {
      throw new HttpError(403, "ACESSO_NEGADO", "Clientes só podem consultar o próprio cadastro");
    }

    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new HttpError(404, "USUARIO_NAO_ENCONTRADO", "Usuário não encontrado");
    res.json({ usuario: usuarioPublico(usuario) });
  });

  router.post("/", async (req, res) => {
    const atual = exigirUsuario(req.usuario);
    if (atual.perfil !== "administrador") {
      throw new HttpError(403, "ACESSO_NEGADO", "Somente administradores podem criar usuários");
    }

    const dados = criarUsuarioSchema.parse(req.body);
    if (await emailEmUso(prisma, dados.email)) {
      throw new HttpError(409, "EMAIL_EM_USO", "E-mail já cadastrado");
    }

    try {
      const { senha, ...usuarioNovo } = dados;
      const usuario = await prisma.usuario.create({
        data: { ...usuarioNovo, senhaHash: await hash(senha, config.bcryptRounds) },
      });
      res
        .status(201)
        .json({ mensagem: "Usuário criado com sucesso", usuario: usuarioPublico(usuario) });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new HttpError(409, "EMAIL_EM_USO", "E-mail já cadastrado");
      }
      throw error;
    }
  });

  router.put("/:id", async (req, res) => {
    const atual = exigirUsuario(req.usuario);
    const id = idDaRota(req.params.id);
    const dados = atualizarUsuarioSchema.parse(req.body);
    const alvo = await prisma.usuario.findUnique({ where: { id } });
    if (!alvo) throw new HttpError(404, "USUARIO_NAO_ENCONTRADO", "Usuário não encontrado");

    if (atual.perfil === "cliente" && atual.id !== alvo.id) {
      throw new HttpError(403, "ACESSO_NEGADO", "Clientes só podem editar o próprio cadastro");
    }
    if (atual.perfil === "operador" && alvo.perfil === "administrador") {
      throw new HttpError(403, "ACESSO_NEGADO", "Operadores não podem editar administradores");
    }
    if (atual.perfil !== "administrador" && dados.perfil !== undefined) {
      throw new HttpError(403, "PERFIL_PROTEGIDO", "Somente administradores podem alterar perfis");
    }
    if (await emailEmUso(prisma, dados.email, id)) {
      throw new HttpError(409, "EMAIL_EM_USO", "E-mail já cadastrado");
    }

    if (alvo.perfil === "administrador" && dados.perfil && dados.perfil !== "administrador") {
      const totalAdministradores = await prisma.usuario.count({
        where: { perfil: "administrador" },
      });
      if (totalAdministradores <= 1) {
        throw new HttpError(
          403,
          "ULTIMO_ADMINISTRADOR",
          "O sistema deve manter ao menos um administrador",
        );
      }
    }

    try {
      const usuario = await prisma.usuario.update({
        where: { id },
        data: {
          nome: dados.nome,
          email: dados.email,
          ...(dados.perfil ? { perfil: dados.perfil } : {}),
        },
      });
      res.json({ mensagem: "Usuário atualizado com sucesso", usuario: usuarioPublico(usuario) });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new HttpError(409, "EMAIL_EM_USO", "E-mail já cadastrado");
      }
      throw error;
    }
  });

  router.delete("/:id", async (req, res) => {
    const atual = exigirUsuario(req.usuario);
    const id = idDaRota(req.params.id);
    if (atual.perfil !== "administrador") {
      throw new HttpError(403, "ACESSO_NEGADO", "Somente administradores podem excluir usuários");
    }
    if (atual.id === id) {
      throw new HttpError(403, "AUTOEXCLUSAO", "Não é permitido excluir a própria conta");
    }

    const alvo = await prisma.usuario.findUnique({ where: { id } });
    if (!alvo) throw new HttpError(404, "USUARIO_NAO_ENCONTRADO", "Usuário não encontrado");
    if (alvo.perfil === "administrador") {
      const totalAdministradores = await prisma.usuario.count({
        where: { perfil: "administrador" },
      });
      if (totalAdministradores <= 1) {
        throw new HttpError(
          403,
          "ULTIMO_ADMINISTRADOR",
          "O sistema deve manter ao menos um administrador",
        );
      }
    }

    await prisma.usuario.delete({ where: { id } });
    res.status(204).send();
  });

  return router;
}
