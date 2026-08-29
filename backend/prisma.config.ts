import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

const configuredUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const datasourceUrl = configuredUrl.startsWith("file:./")
  ? `file:${path.resolve(process.cwd(), configuredUrl.slice("file:".length))}`
  : configuredUrl;
process.env.DATABASE_URL = datasourceUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: datasourceUrl,
  },
});
