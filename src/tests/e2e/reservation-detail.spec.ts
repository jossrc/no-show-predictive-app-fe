import { expect, type Page, test } from '@playwright/test';

/**
 * E2E del detalle (HU-02, HU-05, HU-06) con resultados predictivos SIMULADOS exclusivamente
 * para prueba. El POST solo llega al backend simulado en memoria.
 */
const region = (page: Page, name: string) => page.getByRole('region', { name });

test('detalle con estimaciones RF y XGBoost, historial y SHAP bajo demanda', async ({ page }) => {
  const factorRequests: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.headers()['next-action'])
      factorRequests.push(request.url());
  });
  await page.goto('/reservations/900000000001001');
  const risk = region(page, 'Estimación predictiva');
  await expect(risk.getByRole('heading', { name: 'Random Forest' })).toBeVisible();
  await expect(risk.getByText('31 %')).toBeVisible();
  await expect(risk.getByText('27.4 %')).toBeVisible();
  await expect(risk.getByText(/no indica confianza/)).toBeVisible();
  expect(factorRequests).toHaveLength(0); // sin SHAP ni POST automáticos

  const factors = region(page, 'Factores asociados a la estimación');
  await factors.getByRole('button', { name: 'Ver explicación' }).click();
  await expect(factors.getByText('Probabilidad (enlace identidad)')).toBeVisible();
  await expect(factors.getByRole('img', { name: /Gráfico de contribuciones/ })).toBeVisible();
  await expect(factors.getByRole('table')).toContainText('+0.0612');
  await expect(factors.getByText('Atributo sensible')).toBeVisible();
  expect(factorRequests).toHaveLength(1);

  await factors.getByLabel('Modelo').selectOption('xgboost_full_v1');
  expect(factorRequests).toHaveLength(1);
  await factors.getByRole('button', { name: 'Ver explicación' }).click();
  await expect(factors.getByText('Log-odds (enlace sigmoide)')).toBeVisible();
  await expect(factors.getByText(/no equivalen a puntos porcentuales/)).toBeVisible();

  const history = region(page, 'Historial del cliente');
  await expect(history.getByText('Asistencias previas')).toBeVisible();
  await history.getByRole('tab', { name: 'Conocido actualmente' }).click();
  await expect(history.getByText('12', { exact: true })).toBeVisible();
  await expect(
    history.getByText(/no corresponde al historial usado por la predicción original/),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'test-results/detail-desktop.png', fullPage: true });
});

test('NOT_SCORABLE: sin porcentaje, con motivos y sin acciones predictivas habilitadas', async ({
  page,
}) => {
  await page.goto('/reservations/900000000001002');
  const risk = region(page, 'Estimación predictiva');
  await expect(
    risk.getByText('No es posible generar una predicción con la información disponible.'),
  ).toBeVisible();
  await expect(risk.getByText(/\d+ %/)).toHaveCount(0);
  await risk.getByText('Ver motivos (2)').click();
  await expect(risk.getByText('SCHEDULED_SERVICES_NOT_POINT_IN_TIME')).toBeVisible();
  await expect(risk.getByRole('button', { name: 'Solicitar predicción' })).toBeDisabled();
  await expect(region(page, 'Factores asociados a la estimación')).toContainText(
    'la reserva no es evaluable',
  );
  await expect(region(page, 'Historial del cliente')).toContainText('Sin historial suficiente');
});

test('POST explícito: crea la predicción y actualiza la estimación visible', async ({ page }) => {
  await page.goto('/reservations/900000000001003');
  const risk = region(page, 'Estimación predictiva');
  await expect(
    risk.getByText('Esta reserva todavía no tiene una predicción registrada.'),
  ).toBeVisible();
  await risk.getByRole('button', { name: 'Solicitar predicción' }).click();
  await expect(risk.getByText('Predicción registrada')).toBeVisible();
  await expect(risk.getByText('42 %')).toBeVisible();
  await expect(risk.getByText('39.1 %')).toBeVisible();
});

test('timeout del POST: resultado no confirmado sin reintento automático', async ({ page }) => {
  let posts = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.headers()['next-action']) posts += 1;
  });
  await page.goto('/reservations/900000000001009');
  // Fallos parciales: la información factual sigue visible.
  await expect(region(page, 'Información de la cita')).toContainText('Clínica #11');
  await expect(region(page, 'Estimación predictiva').getByRole('alert')).toContainText(
    'Persistencia predictiva no disponible',
  );
  await expect(region(page, 'Historial del cliente').getByRole('alert')).toContainText(
    'Fuente de reservas no disponible',
  );

  const factors = region(page, 'Factores asociados a la estimación');
  await factors.getByRole('button', { name: 'Ver explicación' }).click();
  await expect(factors.getByRole('alert')).toContainText('Explicaciones SHAP no disponibles');
  expect(posts).toBe(1);
});

test('reserva inexistente muestra una vista clara con regreso al listado', async ({ page }) => {
  await page.goto('/reservations/900000000009999');
  await expect(page.getByText('Reserva no encontrada')).toBeVisible();
  await page.getByRole('link', { name: 'Volver al listado de reservas' }).click();
  await expect(page).toHaveURL(/\/reservations$/);
});

test('detalle en móvil sin desbordamiento horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/reservations/900000000001001');
  await expect(region(page, 'Estimación predictiva')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/detail-mobile.png', fullPage: true });
});

test('el tema oscuro se aplica con el teclado', async ({ page }) => {
  await page.goto('/reservations');
  const toggle = page.getByRole('button', { name: 'Cambiar tema' });
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.screenshot({ path: 'test-results/reservations-dark.png', fullPage: true });
});
