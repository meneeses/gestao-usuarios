CREATE TABLE "usuarios" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "nome" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "senha_hash" TEXT NOT NULL,
  "perfil" TEXT NOT NULL CHECK ("perfil" IN ('administrador', 'operador', 'cliente')),
  "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
