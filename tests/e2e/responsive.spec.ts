import { expect, test } from '@playwright/test';

test('la aplicación monta su interfaz principal', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page.locator('.app-shell')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.content')).not.toBeEmpty();
  expect(pageErrors).toEqual([]);
});

test('el menú móvil abre, navega y vuelve a cerrarse', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Prueba específica de móvil');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.app-shell')).toBeVisible({ timeout: 20_000 });

  const shell = page.locator('.app-shell');
  const sidebar = page.locator('.approved-sidebar, .sidebar').first();
  const menuButton = page.locator('.menu-button').first();

  await expect(menuButton).toBeVisible();
  await menuButton.click();
  await expect(shell).not.toHaveClass(/sidebar-collapsed/);
  await expect(sidebar).toBeVisible();

  await page.locator('.approved-nav a').filter({ hasText: /Programación 2D/ }).first().click();
  await expect(page).toHaveURL(/programacion-2d/);
  await expect(shell).toHaveClass(/sidebar-collapsed/);
  await expect(sidebar).toBeHidden();
});

test('no hay desbordamiento horizontal en móvil, tableta ni escritorio', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.app-shell')).toBeVisible({ timeout: 20_000 });

  for (const width of [320, 390, 768, 1024, 1365]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    expect(dimensions.document, `document width at viewport ${width}`).toBeLessThanOrEqual(dimensions.viewport + 3);
    expect(dimensions.body, `body width at viewport ${width}`).toBeLessThanOrEqual(dimensions.viewport + 3);
  }
});
