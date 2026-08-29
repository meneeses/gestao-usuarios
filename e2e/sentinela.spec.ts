import { expect, type Page, test } from "@playwright/test";

const evidencias = "docs/evidencias";

async function entrarComo(page: Page, perfil: "Administrador" | "Operador" | "Cliente") {
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(perfil) }).click();
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page.getByRole("heading", { name: new RegExp(`Olá, ${perfil}`) })).toBeVisible();
}

test("tela de login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Acesse o Sentinela" })).toBeVisible();
  await page.screenshot({ path: `${evidencias}/01-login.png`, fullPage: true });
});

test("dashboard do administrador", async ({ page }) => {
  await entrarComo(page, "Administrador");
  await expect(page.getByRole("heading", { name: "Usuários cadastrados" })).toBeVisible();
  await expect(page.getByRole("button", { name: "+ Novo usuário" })).toBeVisible();
  await page.screenshot({ path: `${evidencias}/02-dashboard-administrador.png`, fullPage: true });
});

test("dashboard do operador", async ({ page }) => {
  await entrarComo(page, "Operador");
  await expect(page.getByRole("heading", { name: "Usuários cadastrados" })).toBeVisible();
  await expect(page.getByRole("button", { name: "+ Novo usuário" })).toHaveCount(0);
  await page.screenshot({ path: `${evidencias}/03-dashboard-operador.png`, fullPage: true });
});

test("dashboard do cliente e resposta proibida", async ({ page }) => {
  await entrarComo(page, "Cliente");
  await expect(page.getByRole("heading", { name: "Meu perfil" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Usuários cadastrados" })).toHaveCount(0);
  await page.screenshot({ path: `${evidencias}/04-dashboard-cliente.png`, fullPage: true });

  const resposta = await page.evaluate(async () => {
    const token = sessionStorage.getItem("sentinela.jwt");
    const response = await fetch("/api/usuarios", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { status: response.status, corpo: await response.json() };
  });
  expect(resposta.status).toBe(403);
  await page.setContent(
    "<main style='font:18px monospace;padding:48px'><h1>Resposta protegida por RBAC</h1><pre></pre></main>",
  );
  await page.locator("pre").evaluate(
    (elemento, texto) => {
      elemento.textContent = texto;
    },
    JSON.stringify(resposta, null, 2),
  );
  await page.screenshot({ path: `${evidencias}/06-resposta-403.png`, fullPage: true });
});

test("Swagger público", async ({ page }) => {
  await page.goto("/api/docs/");
  await expect(page.locator(".swagger-container")).toBeVisible();
  await page.screenshot({ path: `${evidencias}/05-swagger.png`, fullPage: true });
});
