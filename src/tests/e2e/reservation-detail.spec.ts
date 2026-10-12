import { expect, type Page, test } from '@playwright/test';

/**
 * E2E del detalle (HU-02, HU-05, HU-06) con resultados predictivos SIMULADOS exclusivamente
 * para prueba. El POST solo llega al backend simulado en memoria.
 */
const region = (page: Page, name: string) => page.getByRole('region', { name });
const RISK = 'Estimación de inasistencia';
const FACTORS = 'Factores relacionados con la estimación';
const HISTORY = 'Historial del cliente';

function trackServerActions(page: Page) {
  const calls: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.headers()['next-action']) calls.push(request.url());
  });
  return calls;
}

test('detalle con estimaciones RF y XGBoost, factores en tabla e historial', async ({ page }) => {
  const actions = trackServerActions(page);
  await page.goto('/reservations/900000000001001');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Reserva #900000000001001');
  await expect(page.getByRole('main')).toContainText('Sede #2');
  const risk = region(page, RISK);
  await expect(risk.getByRole('heading', { name: 'Random Forest' })).toBeVisible();
  await expect(risk.getByText('31.00 %')).toBeVisible();
  await expect(risk.getByText('27.40 %')).toBeVisible();
  await expect(risk.getByText(/no indica confianza/)).toBeVisible();
  await expect(
    risk.getByText(/No validadas ni aprobadas para decisiones operativas/),
  ).toBeVisible();
  expect(actions).toHaveLength(0); // sin factores ni POST automáticos

  const factors = region(page, FACTORS);
  await factors.getByRole('button', { name: 'Ver factores' }).click();
  await expect(factors.getByRole('table')).toContainText('+0.0612');
  await expect(
    factors.getByRole('columnheader', { name: 'Contribución (probabilidad)' }),
  ).toBeVisible();
  await expect(factors.getByText('Dato sensible')).toBeVisible();
  await expect(factors.getByRole('img')).toHaveCount(0);
  expect(actions).toHaveLength(1);

  await factors.getByLabel('Modelo').selectOption('xgboost_full_v1');
  expect(actions).toHaveLength(1);
  await factors.getByRole('button', { name: 'Ver factores' }).click();
  await expect(
    factors.getByRole('columnheader', { name: 'Contribución (log-odds)' }),
  ).toBeVisible();
  await expect(factors.getByText(/no equivalen a puntos porcentuales/)).toBeVisible();

  const history = region(page, HISTORY);
  await expect(history.getByText('Asistencias', { exact: true })).toBeVisible();
  await history.getByRole('tab', { name: 'Información actual' }).click();
  await expect(history.getByText('12', { exact: true })).toBeVisible();
  await history.getByText('Cómo se calcula esta información').click();
  await expect(
    history.getByText('El historial actual no modifica una predicción realizada anteriormente.'),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'test-results/detail-desktop.png', fullPage: true });
});

test('NOT_SCORABLE: mensaje claro y proporcionado, sin códigos ni acciones predictivas', async ({
  page,
}) => {
  await page.goto('/reservations/900000000001002');
  const risk = region(page, RISK);
  await expect(risk.getByText('Estimación no disponible')).toBeVisible();
  await expect(
    risk.getByText(
      'Los servicios programados provienen de la réplica actual sin evidencia temporal de la reserva',
    ),
  ).toBeVisible();
  await expect(risk.getByText(/\d+ %/)).toHaveCount(0);
  await expect(risk.getByRole('button')).toHaveCount(0);
  await expect(page.getByText(/SCHEDULED_SERVICES|NOT_SCORABLE|snapshot/i)).toHaveCount(0);
  await expect(region(page, FACTORS)).toContainText(
    'Los factores de esta estimación no están disponibles.',
  );
  await expect(region(page, HISTORY)).toContainText('Sin datos suficientes');
  await page.screenshot({ path: 'test-results/detail-not-scorable.png', fullPage: true });
});

test('POST explícito: calcula la estimación y actualiza los resultados visibles', async ({
  page,
}) => {
  await page.goto('/reservations/900000000001003');
  const risk = region(page, RISK);
  await expect(risk.getByText('Aún no hay una estimación')).toBeVisible();
  await risk.getByRole('button', { name: 'Calcular estimación' }).click();
  await expect(risk.getByText('Estimación calculada')).toBeVisible();
  await expect(risk.getByText('42.00 %')).toBeVisible();
  await expect(risk.getByText('39.10 %')).toBeVisible();
});

test('errores parciales localizados, sin reintentos automáticos', async ({ page }) => {
  const actions = trackServerActions(page);
  await page.goto('/reservations/900000000001009');
  // Fallos parciales: la información factual sigue visible.
  await expect(page.getByRole('main')).toContainText('Sede #11');
  await expect(region(page, 'Información de la cita')).toContainText('Reprogramación detectada');
  await expect(region(page, RISK).getByRole('alert')).toContainText(
    'Estimaciones no disponibles por ahora',
  );
  await expect(region(page, HISTORY).getByRole('alert')).toContainText(
    'No pudimos cargar la información',
  );

  const factors = region(page, FACTORS);
  await factors.getByRole('button', { name: 'Ver factores' }).click();
  await expect(factors.getByRole('alert')).toContainText('Factores no disponibles por ahora');
  expect(actions).toHaveLength(1);
});

test('reserva inexistente muestra una vista clara con regreso al listado', async ({ page }) => {
  await page.goto('/reservations/900000000009999');
  await expect(page.getByText('No encontramos esta reserva')).toBeVisible();
  await page.getByRole('link', { name: 'Volver a reservas' }).click();
  await expect(page).toHaveURL(/\/reservations$/);
});

test('detalle en móvil y tablet sin desbordamiento horizontal', async ({ page }) => {
  for (const [width, height, name] of [
    [390, 844, 'mobile'],
    [820, 1180, 'tablet'],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/reservations/900000000001001');
    await expect(region(page, RISK)).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: `test-results/detail-${name}.png`, fullPage: true });
  }
});

test('el tema oscuro se aplica con el teclado', async ({ page }) => {
  await page.goto('/reservations');
  const toggle = page.getByRole('button', { name: 'Cambiar tema' });
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.screenshot({ path: 'test-results/reservations-dark.png', fullPage: true });
});
