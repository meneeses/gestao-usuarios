import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { AppConfig } from "./config.js";
import type { PrismaClient, Usuario } from "./generated/prisma/client.js";

export function gerarToken(usuario: Usuario, config: AppConfig): string {
  return jwt.sign({ nome: usuario.nome, perfil: usuario.perfil }, config.jwtSecret, {
    algorithm: "HS256",
    subject: String(usuario.id),
    expiresIn: 3600,
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
  });
}

export function autenticar(prisma: PrismaClient, config: AppConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      res.status(401).json({ erro: { codigo: "TOKEN_AUSENTE", mensagem: "Token não fornecido" } });
      return;
    }

    try {
      const payload = jwt.verify(authorization.slice(7), config.jwtSecret, {
        algorithms: ["HS256"],
        issuer: config.jwtIssuer,
        audience: config.jwtAudience,
      }) as JwtPayload;
      const id = Number(payload.sub);
      if (!Number.isInteger(id) || id <= 0) throw new Error("subject inválido");

      const usuario = await prisma.usuario.findUnique({ where: { id } });
      if (!usuario) {
        res
          .status(401)
          .json({ erro: { codigo: "SESSAO_INVALIDA", mensagem: "Usuário da sessão não existe" } });
        return;
      }

      req.usuario = usuario;
      next();
    } catch {
      res
        .status(401)
        .json({ erro: { codigo: "TOKEN_INVALIDO", mensagem: "Token inválido ou expirado" } });
    }
  };
}
