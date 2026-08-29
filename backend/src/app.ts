import { existsSync } from "node:fs";
import path from "node:path";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { ZodError } from "zod";
import { autenticar } from "./auth.js";
import type { AppConfig } from "./config.js";
import type { PrismaClient } from "./generated/prisma/client.js";
import { HttpError } from "./lib/http-error.js";
import { openapiDocument } from "./openapi.js";
import { criarRotasAuth, criarRotasUsuarios } from "./routes.js";

type AppOptions = {
  prisma: PrismaClient;
  config: AppConfig;
  serveFrontend?: boolean;
  enableRateLimit?: boolean;
};

export function createApp({
  prisma,
  config,
  serveFrontend = false,
  enableRateLimit = true,
}: AppOptions) {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'"],
          imgSrc: ["'self'", "data:"],
        },
      },
    }),
  );
  app.use(
    cors((req, callback) => {
      const origin = req.header("origin");
      const host = req.header("host");
      const origemDaAplicacao = host ? `${req.protocol}://${host}` : null;
      if (!origin || origin === origemDaAplicacao || config.corsOrigins.includes(origin)) {
        callback(null, { origin: true });
        return;
      }
      callback(new HttpError(403, "ORIGEM_NEGADA", "Origem não autorizada pelo CORS"));
    }),
  );
  app.use(express.json({ limit: "32kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", servico: "sentinela-api", versao: "2.0.0" });
  });
  app.get("/api/openapi.json", (_req, res) => res.json(openapiDocument));
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openapiDocument, { customSiteTitle: "Sentinela — API" }),
  );

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({
        erro: {
          codigo: "MUITAS_TENTATIVAS",
          mensagem: "Muitas tentativas de login. Tente novamente em 15 minutos",
        },
      }),
  });

  const authMiddleware = autenticar(prisma, config);
  if (enableRateLimit) app.use("/api/auth/login", loginLimiter);
  app.use("/api/auth", criarRotasAuth(prisma, config, authMiddleware));
  app.use("/api/usuarios", authMiddleware, criarRotasUsuarios(prisma, config));

  app.use("/api", (_req, res) => {
    res
      .status(404)
      .json({ erro: { codigo: "ROTA_NAO_ENCONTRADA", mensagem: "Endpoint não encontrado" } });
  });

  if (serveFrontend) {
    const frontendDir = path.resolve(import.meta.dirname, "../../frontend/dist");
    if (existsSync(frontendDir)) {
      app.use(express.static(frontendDir));
      app.use((req, res, next) => {
        if (req.method === "GET" && req.accepts("html"))
          return res.sendFile(path.join(frontendDir, "index.html"));
        next();
      });
    }
  }

  app.use((_req, res) => {
    res
      .status(404)
      .json({ erro: { codigo: "ROTA_NAO_ENCONTRADA", mensagem: "Recurso não encontrado" } });
  });

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError) {
      const campos: Record<string, string[]> = {};
      for (const issue of error.issues) {
        const campo = issue.path.join(".") || "requisicao";
        campos[campo] = [...(campos[campo] ?? []), issue.message];
      }
      res.status(400).json({ erro: { codigo: "VALIDACAO", mensagem: "Dados inválidos", campos } });
      return;
    }
    if (error instanceof HttpError) {
      res.status(error.status).json({
        erro: {
          codigo: error.codigo,
          mensagem: error.message,
          ...(error.campos ? { campos: error.campos } : {}),
        },
      });
      return;
    }
    console.error("Erro não tratado:", error);
    res
      .status(500)
      .json({ erro: { codigo: "ERRO_INTERNO", mensagem: "Erro interno do servidor" } });
  };
  app.use(errorHandler);

  return app;
}
