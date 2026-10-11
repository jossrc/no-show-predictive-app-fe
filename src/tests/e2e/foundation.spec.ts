import { expect, test } from '@playwright/test';

test('carga la bienvenida y cambia de tema sin errores de navegador', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Frontend preparado' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();
  const themeButton = page.getByRole('button', { name: 'Cambiar tema' });
  await themeButton.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(themeButton).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: 'test-results/foundation-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('todas las secciones de navegación cargan y la ruta desconocida muestra 404', async ({
  page,
}) => {
  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: 'Navegación principal' });
  for (const name of ['Reservas', 'Reportes', 'Modelos', 'Configuración']) {
    await navigation.getByRole('link', { name, exact: true }).click();
    await expect(page.getByRole('heading', { name, exact: true, level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Módulo en preparación' })).toBeVisible();
    await expect(navigation.getByRole('link', { name, exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
  }
  const response = await page.goto('/ruta-inexistente');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'No encontramos esta página' })).toBeVisible();
});

test('el menú móvil permite navegar, se cierra y respeta el ancho de pantalla', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir navegación' }).click();
  const dialog = page.getByRole('dialog', { name: 'Menú de navegación' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('link', { name: 'Reservas', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Reservas', exact: true, level: 1 }),
  ).toBeVisible();
  await expect(dialog).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/foundation-mobile.png', fullPage: true });
});
