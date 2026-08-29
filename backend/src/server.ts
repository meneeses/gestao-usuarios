import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createPrismaClient } from "./lib/prisma.js";

const config = loadConfig();
const prisma = createPrismaClient(config.databaseUrl);
const app = createApp({ prisma, config, serveFrontend: true });

const server = app.listen(config.port, "127.0.0.1", () => {
  console.log(`Sentinela disponível em http://localhost:${config.port}`);
  console.log(`Documentação da API em http://localhost:${config.port}/api/docs`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
