import { expect, type Page, test } from '@playwright/test';

/**
 * E2E del listado (HU-01/HU-03) contra el backend SIMULADO. Los datos son sintéticos y
 * deterministas; ninguna prueba toca PostgreSQL, Python ni el backend real.
 */
const table = (page: Page) => page.getByRole('table');
/** Espera la hidratación (dev) para que las interacciones del formulario no se pierdan. */
async function open(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}
const alertIn = (page: Page) => page.getByRole('main').getByRole('alert');
const rowOf = (page: Page, id: string) => table(page).getByRole('row').filter({ hasText: id });
const rowLink = (page: Page, id: string) =>
  table(page).getByRole('link', { name: `#${id}`, exact: true });

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test('carga el listado con estados predictivos, sin niveles de riesgo ni errores', async ({
  page,
}) => {
  const errors = trackErrors(page);
  await open(page, '/');
  await expect(page).toHaveURL(/\/reservations$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Reservas programadas' })).toBeVisible();
  await expect(page.getByRole('note')).toContainText('No son resultados reales');
  await expect(table(page).getByRole('row')).toHaveCount(8); // encabezado + 7 reservas programadas
  const both = rowOf(page, '900000000001001');
  await expect(both).toContainText('31 %');
  await expect(both).toContainText('27.4 %');
  await expect(rowOf(page, '900000000001002')).toContainText('No evaluable');
  await expect(
    page.getByText('Clasificación de riesgo pendiente de validación.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByText(/riesgo (bajo|medio|alto)/i)).toHaveCount(0);
  await expect(
    page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link'),
  ).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('aplica filtros y orden exploratorio, conservándolos en la URL', async ({ page }) => {
  await open(page, '/reservations');
  await page.getByLabel('Estado').selectOption('CANCELLED');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page).toHaveURL(/status=CANCELLED/);
  await expect(rowLink(page, '900000000001006')).toBeVisible();
  await expect(table(page).getByText('Cancelada', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Restablecer' }).click();
  await expect(page).toHaveURL(/\/reservations$/);
  await page.getByLabel('Ordenar por').selectOption('probabilityNoShow');
  await page.getByLabel('Dirección').selectOption('desc');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page).toHaveURL(/sort=probabilityNoShow&direction=desc/);
  await expect(
    page.getByText(/Orden exploratorio por la probabilidad de Random Forest/),
  ).toBeVisible();
  await expect(table(page).getByRole('row').nth(1)).toContainText('900000000001001');
  expect(page.url()).not.toContain('riskLevel');
});

test('ignora riskLevel en la URL con un aviso y no lo envía al backend', async ({ page }) => {
  await open(page, '/reservations?riskLevel=LOW&sort=riskLevel');
  await expect(page.getByText('Se ajustaron parámetros de la URL')).toBeVisible();
  await expect(page.getByText(/Se ignoró el filtro por nivel de riesgo/)).toBeVisible();
  // El backend simulado responde 409 si recibiera riskLevel: el listado carga normalmente.
  await expect(rowLink(page, '900000000001001')).toBeVisible();
  await expect(page.getByText('Política de riesgo no validada')).toHaveCount(0);
});

test('valida el período antes de consultar', async ({ page }) => {
  await open(page, '/reservations?from=2026-12-10&to=2026-12-01');
  await expect(page.getByText('Período inválido')).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await open(page, '/reservations?from=2030-01-01&to=2030-01-10');
  await expect(page.getByText('No hay reservas programadas en este período')).toBeVisible();
});

test('pagina con cursor opaco: siguiente, anterior y reseteo al filtrar', async ({ page }) => {
  await open(page, '/reservations?limit=3');
  await expect(page.getByText('Página 1 · 3 reservas en esta página')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Anterior' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Siguiente' }).click();
  await expect(page.getByText(/Página 2 · 3 reservas/)).toBeVisible();
  await expect(page).toHaveURL(/cursor=/);
  await page.getByRole('link', { name: 'Siguiente' }).click();
  await expect(page.getByText(/Página 3 · 1 reserva en esta página/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Siguiente' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Anterior' }).click();
  await expect(page.getByText(/Página 2/)).toBeVisible();
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page).not.toHaveURL(/cursor=/);
});

test('cursor inválido y errores del backend se muestran dentro de la página', async ({ page }) => {
  await open(page, '/reservations?cursor=bad_cursor');
  await expect(alertIn(page)).toContainText('Cursor de paginación inválido');
  await page.getByRole('link', { name: 'Ir a la primera página' }).click();
  await expect(rowLink(page, '900000000001001')).toBeVisible();

  await open(page, '/reservations?clinicId=999');
  await expect(alertIn(page)).toContainText('Clínica desconocida');
  await open(page, '/reservations?clinicId=503');
  await expect(alertIn(page)).toContainText('Fuente de reservas no disponible');
  await expect(alertIn(page)).toContainText('ID de solicitud');
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
  await open(page, '/reservations?clinicId=401');
  await expect(alertIn(page)).toContainText('Acceso interno no autorizado');
});

test('navegación por teclado en filtros y acceso al detalle', async ({ page }) => {
  await open(page, '/reservations');
  await page.getByLabel('Estado').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Clínica (ID)')).toBeFocused();
  await page.keyboard.type('2');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/clinicId=2/);
  await expect(table(page).getByRole('row')).toHaveCount(3);
  await rowLink(page, '900000000001001').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('900000000001001');
  await page.getByRole('link', { name: 'Volver a reservas' }).click();
  await expect(page).toHaveURL(/clinicId=2/);
  await expect(page.getByLabel('Clínica (ID)')).toHaveValue('2');
});

test('responsive móvil: tarjetas sin desbordamiento horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/reservations');
  await expect(page.getByRole('link', { name: /Reserva #900000000001001/ })).toBeVisible();
  await expect(page.getByRole('table')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/reservations-mobile.png', fullPage: true });
});

test('responsive escritorio', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, '/reservations');
  await expect(page.getByRole('table')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/reservations-desktop.png', fullPage: true });
});
