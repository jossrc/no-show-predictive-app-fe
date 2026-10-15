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
const detailLink = (page: Page, id: string) =>
  page.getByRole('link', { name: `Ver detalle de Reserva #${id}` });
const rowOf = (page: Page, id: string) => table(page).getByRole('row').filter({ hasText: id });
const TECHNICAL_JARGON =
  /HU-\d|Sprint|EXPLORATORY_NOT_VALIDATED|NO_SHOW_CANDIDATE|NOT_SCORABLE|NOT_SCORED|FRONTEND_DATA_MODE|requestId|ID de solicitud/;

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function noHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

test('carga el listado con estimaciones, sin niveles de riesgo, jerga técnica ni errores', async ({
  page,
}) => {
  const errors = trackErrors(page);
  await open(page, '/');
  await expect(page).toHaveURL(/\/reservations$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Gestión de reservas' })).toBeVisible();
  await expect(page.getByText('Consulta y seguimiento de citas programadas.')).toBeVisible();
  await expect(page.getByRole('note')).toContainText('No son resultados reales');
  await expect(table(page).getByRole('row')).toHaveCount(8); // encabezado + 7 reservas programadas
  const both = rowOf(page, '900000000001001');
  await expect(both).toContainText('Medio · Random Forest');
  await expect(both).toContainText('Bajo · XGBoost');
  await expect(rowOf(page, '900000000001002')).toContainText('Sin estimación');
  await expect(page.getByText(/riesgo (bajo|medio|alto)/i)).toHaveCount(0);
  await expect(
    page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link'),
  ).toHaveCount(1);
  // APP_ENV=production: sin herramientas técnicas ni referencias académicas.
  await expect(page.getByRole('button', { name: /Diagnóstico/ })).toHaveCount(0);
  expect(await page.locator('body').innerText()).not.toMatch(TECHNICAL_JARGON);
  expect(errors).toEqual([]);
});

test('aplica filtros principales y avanzados, conservándolos en la URL', async ({ page }) => {
  await open(page, '/reservations');
  await page.getByLabel('Estado').selectOption('CANCELLED');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page).toHaveURL(/status=CANCELLED/);
  await expect(detailLink(page, '900000000001006')).toBeVisible();
  await expect(table(page).getByText('Cancelada', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Restablecer' }).click();
  await expect(page).toHaveURL(/\/reservations$/);
  await expect(page.getByLabel('Ordenar por')).toBeHidden();
  await page.getByRole('button', { name: /Más filtros/ }).click();
  await page.getByLabel('Ordenar por').selectOption('probabilityNoShow');
  await page.getByLabel('Dirección').selectOption('desc');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page).toHaveURL(/sort=probabilityNoShow&direction=desc/);
  await expect(page.getByText(/Ordenadas por estimación de Random Forest/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Más filtros/ })).toContainText('2');
  await expect(table(page).getByRole('row').nth(1)).toContainText('900000000001001');
  expect(page.url()).not.toContain('riskLevel');
});

test('filtra y ordena por banda relativa del modelo elegido', async ({ page }) => {
  await open(page, '/reservations');
  await expect(page.getByLabel('Por página')).toBeVisible();
  await page.getByRole('button', { name: /Más filtros/ }).click();
  await page.getByLabel('Banda relativa').selectOption('LOW');
  await page.getByLabel('Modelo', { exact: true }).selectOption('xgboost_full_v1');
  await page.getByLabel('Ordenar por').selectOption('experimentalRisk');
  await page.getByLabel('Por página').selectOption('10');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page).toHaveURL(/experimentalRiskLevel=LOW/);
  await expect(table(page).getByRole('row')).toHaveCount(2);
  await expect(rowOf(page, '900000000001001')).toContainText('Bajo · XGBoost');
  await expect(page.getByText(/Ordenadas por banda relativa de XGBoost/)).toBeVisible();
  await expect(page.getByText('Hasta 10 reservas por página')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anterior', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Siguiente', exact: true })).toBeDisabled();
  expect(new URL(page.url()).searchParams.has('riskLevel')).toBe(false);
});

test('ignora riskLevel en la URL con un aviso y no lo envía al backend', async ({ page }) => {
  await open(page, '/reservations?riskLevel=LOW&sort=riskLevel');
  await expect(page.getByText('Ajustamos algunos filtros')).toBeVisible();
  await expect(
    page.getByText(/La clasificación por nivel de riesgo todavía no está disponible/),
  ).toBeVisible();
  // El backend simulado responde 409 si recibiera riskLevel: el listado carga normalmente.
  await expect(detailLink(page, '900000000001001')).toBeVisible();
  await expect(page.getByText('Clasificación de riesgo no disponible')).toHaveCount(0);
});

test('valida el período antes de consultar y muestra un estado vacío claro', async ({ page }) => {
  await open(page, '/reservations?from=2026-12-10&to=2026-12-01');
  await expect(page.getByText('Período no válido')).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await open(page, '/reservations?from=2030-01-01&to=2030-01-10');
  await expect(page.getByText('No encontramos reservas')).toBeVisible();
  await expect(page.getByText('Prueba con otro período o modifica los filtros.')).toBeVisible();
  await page.getByRole('link', { name: 'Restablecer filtros' }).click();
  await expect(page).toHaveURL(/\/reservations$/);
});

test('pagina con cursor opaco: siguiente, anterior y reseteo al filtrar', async ({ page }) => {
  await open(page, '/reservations?limit=3');
  await expect(page.getByText('3 reservas en esta página', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Anterior' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Siguiente' }).click();
  await expect(page.getByText('Página 2 · 3 reservas en esta página')).toBeVisible();
  await expect(page).toHaveURL(/cursor=/);
  await expect(page).toHaveURL(/limit=3/);
  await page.getByRole('link', { name: 'Siguiente' }).click();
  await expect(page.getByText('Página 3 · 1 reserva en esta página')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Siguiente' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Anterior' }).click();
  await expect(page.getByText(/Página 2/)).toBeVisible();
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page).not.toHaveURL(/cursor=/);
});

test('errores del backend en lenguaje claro, dentro de la página y sin datos técnicos', async ({
  page,
}) => {
  await open(page, '/reservations?cursor=bad_cursor');
  await expect(alertIn(page)).toContainText('Esta página ya no está disponible');
  await page.getByRole('link', { name: 'Ir a la primera página' }).click();
  await expect(detailLink(page, '900000000001001')).toBeVisible();

  await open(page, '/reservations?clinicId=999');
  await expect(alertIn(page)).toContainText('No encontramos esa sede');
  await expect(page.getByRole('link', { name: 'Quitar filtro de sede' })).toBeVisible();
  await open(page, '/reservations?clinicId=503');
  await expect(alertIn(page)).toContainText('No pudimos cargar las reservas');
  await expect(alertIn(page)).toContainText('Intenta actualizar la información.');
  await expect(alertIn(page)).not.toContainText(/SOURCE_DATA_UNAVAILABLE|503|solicitud/);
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
  await open(page, '/reservations?clinicId=401');
  await expect(alertIn(page)).toContainText('No pudimos cargar las reservas');
  await expect(alertIn(page)).not.toContainText('UNAUTHORIZED');
});

test('navegación por teclado en filtros y acceso al detalle', async ({ page }) => {
  await open(page, '/reservations');
  await page.getByLabel('Estado').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Sede')).toBeFocused();
  await page.keyboard.type('2');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/clinicId=2/);
  await expect(table(page).getByRole('row')).toHaveCount(3);
  await detailLink(page, '900000000001001').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('900000000001001');
  await page.getByRole('link', { name: 'Volver a reservas' }).click();
  await expect(page).toHaveURL(/clinicId=2/);
  await expect(page.getByLabel('Sede')).toHaveValue('2');
});

test('responsive móvil: tarjetas sin desbordamiento horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/reservations');
  await expect(detailLink(page, '900000000001001')).toBeVisible();
  await expect(page.getByRole('table')).toBeHidden();
  expect(await noHorizontalOverflow(page)).toBe(true);
  await page.screenshot({ path: 'test-results/reservations-mobile.png', fullPage: true });
});

test('responsive tablet (tarjetas) y escritorio (tabla) sin desbordamiento', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await open(page, '/reservations');
  await expect(page.getByRole('table')).toBeHidden();
  await expect(detailLink(page, '900000000001001')).toBeVisible();
  expect(await noHorizontalOverflow(page)).toBe(true);
  await page.screenshot({ path: 'test-results/reservations-tablet.png', fullPage: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Cliente' })).toBeVisible();
  expect(await noHorizontalOverflow(page)).toBe(true);
  await page.screenshot({ path: 'test-results/reservations-desktop.png', fullPage: true });
});
