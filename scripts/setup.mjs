import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backendDir = path.join(rootDir, "backend");
const envPath = path.join(backendDir, ".env");
const envExamplePath = path.join(backendDir, ".env.example");

if (!existsSync(envPath)) {
  const template = readFileSync(envExamplePath, "utf8");
  const secret = randomBytes(48).toString("base64url");
  writeFileSync(envPath, template.replace("__GERADO_PELO_SETUP__", secret), { mode: 0o600 });
  console.log("Configuração local segura criada em backend/.env.");
}

const envContent = readFileSync(envPath, "utf8");
const databaseUrl = envContent.match(/^DATABASE_URL=(.+)$/m)?.[1]?.replaceAll('"', "");
if (databaseUrl?.startsWith("file:")) {
  const configuredPath = databaseUrl.slice("file:".length);
  const databasePath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(backendDir, configuredPath);
  mkdirSync(path.dirname(databasePath), { recursive: true });
  closeSync(openSync(databasePath, "a", 0o600));
}

for (const args of [
  ["run", "db:generate", "-w", "backend"],
  ["run", "db:migrate", "-w", "backend"],
  ["run", "db:seed", "-w", "backend"],
]) {
  const result = spawnSync("npm", args, { cwd: rootDir, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("Projeto preparado. Execute: npm run dev");
