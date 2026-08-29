import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.js";

export function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaBetterSQLite3({ url: databaseUrl });
  return new PrismaClient({ adapter });
}
