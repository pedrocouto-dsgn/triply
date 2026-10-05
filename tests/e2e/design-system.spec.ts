import { expect, test } from "@playwright/test";

for (const width of [375, 768, 1440]) {
  test(`design system is usable at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/design-system");
    await expect(page.getByRole("heading", { name: "Design system", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Orçamento", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Gastos por categoria", exact: true })).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("Não foi possível carregar esta secção");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(10, 11, 11)");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`catalogue-${width}.png`), fullPage: true });
    expect(errors).toEqual([]);
  });
}

test("mobile navigation and keyboard focus work without authentication", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/design-system");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar para o conteúdo" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#workspace-content")).toBeFocused();
  const menu = page.locator("summary");
  await menu.focus();
  await expect(menu).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page.locator("details")).toHaveAttribute("open", "");
  const nav = page.locator("details nav");
  await expect(nav.getByRole("link", { name: "Todas as viagens" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Nova viagem" })).toHaveAttribute("href", "/trips/new");
  await menu.press("Enter");
  await expect(page.locator("details")).not.toHaveAttribute("open", "");
});

test("form examples preserve feedback, focus and disabled states", async ({ page }) => {
  await page.goto("/design-system");
  const name = page.getByLabel("Nome da viagem", { exact: true });
  await name.fill("Uma viagem de teste");
  await expect(name).toHaveCSS("border-radius", "12px");
  await expect(name).toHaveCSS("outline-style", "solid");
  await expect(page.getByLabel("Data de fim · exemplo de erro")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("button", { name: "Indisponível" })).toBeDisabled();
  await page.getByRole("button", { name: "Guardar exemplo" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Exemplo guardado." })).toBeVisible();
  await page.getByRole("button", { name: "Repor", exact: true }).click();
  await expect(name).toHaveValue("Japão, ao nosso ritmo");
});

test("public landing and sign-in fit a small phone", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Começar a planear" })).toHaveAttribute("href", "/auth/sign-up");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("landing-mobile.png"), fullPage: true });
  await page.goto("/auth/sign-in");
  await expect(page.getByRole("heading", { name: "Iniciar sessão" })).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Palavra-passe", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("sign-in-mobile.png"), fullPage: true });
});
