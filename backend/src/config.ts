import "dotenv/config";
import { z } from "zod";

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().startsWith("file:").default("file:./prisma/dev.db"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter pelo menos 32 caracteres"),
  JWT_ISSUER: z.string().min(3).default("gestao-usuarios-api"),
  JWT_AUDIENCE: z.string().min(3).default("gestao-usuarios-web"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
});

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  corsOrigins: string[];
  bcryptRounds: number;
};

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const value = configSchema.parse(source);
  return {
    nodeEnv: value.NODE_ENV,
    port: value.PORT,
    databaseUrl: value.DATABASE_URL,
    jwtSecret: value.JWT_SECRET,
    jwtIssuer: value.JWT_ISSUER,
    jwtAudience: value.JWT_AUDIENCE,
    corsOrigins: value.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    bcryptRounds: value.BCRYPT_ROUNDS,
  };
}
