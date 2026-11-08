import { expect, type Page, test } from '@playwright/test';

/**
 * E2E de «Optimización operativa» (HU-06/07/08) contra el backend SIMULADO en memoria
 * (`FRONTEND_DATA_MODE=mock`, `APP_ENV=production`). Ningún POST llega a un backend real.
 * Cada prueba que registra algo usa una reserva sintética distinta (el estado simulado persiste
 * mientras dure el servidor de pruebas).
 */
const PATH = '/operational-optimization';
const TECHNICAL_JARGON =
  /HU-\d|Sprint|requestId|predictionRunId|INTERNAL_SERVICE|OVERBOOKING_|ATTENDANCE_|PREVENTIVE_ACTION|overbooking_eligibility|appointment_finished|[0-9a-f]{8}-[0-9a-f]{4}-/;

async function open(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}
const region = (page: Page, name: string) => page.getByRole('region', { name });
const highRisk = (page: Page) => region(page, 'Reservas con alto riesgo');
const tracking = (page: Page) => region(page, 'Seguimiento operativo');
const rowOf = (_page: Page, scope: ReturnType<typeof region>, id: string) =>
  scope
    .getByRole('table')
    .getByRole('row')
    .filter({ hasText: `#${id}` });

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test('estructura de la Figura 17: filtros, alto riesgo y seguimiento, sin jerga técnica', async ({
  page,
}) => {
  const errors = trackErrors(page);
  await open(page, '/reservations');
  await page
    .getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('link', { name: 'Optimización operativa' })
    .click();
  await expect(page).toHaveURL(/\/operational-optimization$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Optimización operativa' }),
  ).toBeVisible();
  const filters = page.getByRole('form', { name: 'Filtros de búsqueda' });
  for (const label of ['Fecha desde', 'Fecha hasta', 'Sede', 'Estado de la reserva', 'Modelo']) {
    await expect(filters.getByLabel(label)).toBeVisible();
  }
  await expect(rowOf(page, highRisk(page), '900000000001010')).toContainText('Alto (exploratorio)');
  await expect(rowOf(page, highRisk(page), '900000000001012')).toContainText(
    'Habilitado para sobreasignación',
  );
  await expect(rowOf(page, highRisk(page), '900000000001001')).toHaveCount(0); // banda Media
  await expect(tracking(page).getByRole('link', { name: 'Horarios habilitados' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByText('Observaciones')).toHaveCount(0); // sin campo persistido en la API
  expect(await page.locator('main').innerText()).not.toMatch(TECHNICAL_JARGON);
  expect(errors).toEqual([]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'test-results/operational-desktop.png', fullPage: true });
});

test('HU-06: confirma la marca y el estado persiste en listado, seguimiento y detalle', async ({
  page,
}) => {
  await open(page, PATH);
  const row = rowOf(page, highRisk(page), '900000000001010');
  await row.getByRole('button', { name: /Habilitar para sobreasignación/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Habilitar para sobreasignación' });
  await expect(dialog).toContainText(
    'No se creará una nueva cita ni se modificará la agenda principal',
  );
  await expect(dialog.getByRole('radio', { name: /Random Forest · 69.76 %/ })).toBeChecked();
  await dialog.getByRole('radio', { name: /XGBoost · 91.59 %/ }).check();
  await dialog.getByRole('button', { name: 'Confirmar habilitación' }).click();
  await expect(dialog.getByText('Horario habilitado para sobreasignación')).toBeVisible();
  await expect(dialog.getByText('XGBoost', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');

  await expect(row).toContainText('Habilitado para sobreasignación');
  await expect(row.getByRole('button', { name: /Habilitar/ })).toHaveCount(0);
  await expect(rowOf(page, tracking(page), '900000000001010')).toContainText(
    'Alto · XGBoost 91.59 %',
  );

  await page.reload();
  await expect(rowOf(page, highRisk(page), '900000000001010')).toContainText(
    'Habilitado para sobreasignación',
  );
  await rowOf(page, highRisk(page), '900000000001010')
    .getByRole('link', { name: 'Ver detalle de Reserva #900000000001010' })
    .click();
  const management = region(page, 'Gestión operativa');
  await expect(management).toContainText('Habilitado para sobreasignación');
  await expect(management.getByRole('button', { name: /Habilitar/ })).toHaveCount(0);
  await expect(region(page, 'Estimación de inasistencia')).toBeVisible(); // Sprint 01 intacto
  await page.getByRole('link', { name: 'Volver a optimización operativa' }).click();
  await expect(page).toHaveURL(/\/operational-optimization\?from=/);
});

test('HU-06: no elegible sin acción; 409 concurrente se informa y se relee', async ({ page }) => {
  await open(page, '/reservations/900000000001001');
  const management = region(page, 'Gestión operativa');
  await expect(management).toContainText('Este horario no se puede habilitar');
  await expect(management).toContainText('La banda experimental de la predicción no es Alta');
  await expect(management.getByRole('button', { name: /Habilitar/ })).toHaveCount(0);

  await open(page, PATH);
  await rowOf(page, highRisk(page), '900000000001016')
    .getByRole('button', { name: /Habilitar para sobreasignación/ })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Confirmar habilitación' }).click();
  await expect(dialog.getByRole('alert')).toContainText('El horario ya estaba habilitado');
  await expect(dialog.getByText('Habilitado el')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Confirmar habilitación' })).toHaveCount(0);
});

test('HU-07: registra la asistencia tras la cita y muestra la comparación por modelo', async ({
  page,
}) => {
  await open(page, '/reservations/900000000001010');
  await expect(region(page, 'Gestión operativa')).toContainText('La cita aún no ha comenzado');

  await open(page, '/reservations/900000000001013');
  const management = region(page, 'Gestión operativa');
  await management.getByRole('radio', { name: 'Sí asistió' }).check();
  await management.getByRole('button', { name: 'Registrar resultado' }).first().click();
  await expect(management.getByRole('group', { name: '¿Registrar «Asistió»?' })).toBeVisible();
  await management.getByRole('button', { name: 'Confirmar registro' }).click();
  await expect(management.getByText('Resultado registrado').first()).toBeVisible();
  await expect(management).toContainText('Random Forest');
  await expect(management).toContainText('No coincidió');
  await expect(management).toContainText('Coincidió');
  await expect(management).toContainText('Umbral provisional: 50.00 %');

  await page.reload();
  await expect(region(page, 'Gestión operativa')).toContainText('Resultado registrado');
  await expect(
    region(page, 'Gestión operativa').getByRole('radio', { name: 'Sí asistió' }),
  ).toHaveCount(0);
});

test('HU-08: independiente de HU-07 y bloqueado sin habilitación previa', async ({ page }) => {
  await open(page, '/reservations/900000000001015');
  await expect(region(page, 'Gestión operativa')).toContainText(
    'Primero debe habilitarse el horario para sobreasignación.',
  );

  await open(page, PATH);
  await rowOf(page, tracking(page), '900000000001012')
    .getByRole('button', { name: /Registrar resultados/ })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Registrar resultados' });
  await expect(dialog).toContainText('La cita aún no ha comenzado'); // sin HU-07
  await dialog.getByRole('radio', { name: 'No se recuperó' }).check();
  await dialog.getByRole('button', { name: 'Registrar resultado' }).click();
  await dialog.getByRole('button', { name: 'Confirmar registro' }).click();
  await expect(dialog.getByText('Resultado registrado')).toBeVisible();
  await expect(dialog).toContainText('No recuperado');
  await page.keyboard.press('Escape');

  await tracking(page).getByRole('link', { name: 'Espacios recuperados' }).click();
  await expect(page).toHaveURL(/view=recovery/);
  await expect(rowOf(page, tracking(page), '900000000001012')).toContainText('No recuperado');
  await expect(rowOf(page, tracking(page), '900000000001014')).toContainText('No recuperado');
  await tracking(page).getByRole('link', { name: 'Asistencia registrada' }).click();
  await expect(rowOf(page, tracking(page), '900000000001014')).toContainText('No asistió');
  await expect(rowOf(page, tracking(page), '900000000001014')).toContainText('XGBoost: Coincidió');
});

test('filtros en la URL, teclado y errores localizados', async ({ page }) => {
  await open(page, PATH);
  await page.getByLabel('Modelo').selectOption('xgboost_full_v1');
  await page.getByLabel('Sede', { exact: true }).fill('7');
  await page.getByLabel('Sede', { exact: true }).press('Enter');
  await expect(page).toHaveURL(/clinicId=7/);
  await expect(page).toHaveURL(/modelKey=xgboost_full_v1/);
  await expect(highRisk(page)).toContainText('según XGBoost');
  await expect(rowOf(page, highRisk(page), '900000000001011')).toHaveCount(0); // XGB Medio
  await page.goBack();
  await expect(page).not.toHaveURL(/clinicId=7/);

  await open(page, `${PATH}?clinicId=999`);
  await expect(highRisk(page).getByRole('alert')).toContainText('No encontramos esa sede');
  await expect(tracking(page).getByRole('alert')).toContainText('No encontramos esa sede');
  await open(page, `${PATH}?from=2026-01-01&to=2026-12-31`);
  await expect(page.getByText('Período no válido')).toBeVisible();
});

test('móvil y tema oscuro: tarjetas sin desbordamiento y diálogo usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, PATH);
  await expect(highRisk(page).getByRole('table')).toBeHidden();
  await expect(
    highRisk(page).getByRole('button', {
      name: /Habilitar para sobreasignación · Reserva #900000000001011/,
    }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/operational-mobile.png', fullPage: true });

  const toggle = page.getByRole('button', { name: 'Cambiar tema' });
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await highRisk(page)
    .getByRole('button', { name: /Habilitar para sobreasignación · Reserva #900000000001011/ })
    .click();
  await expect(page.getByRole('dialog')).toContainText('Confirma la habilitación');
  await page.screenshot({
    path: 'test-results/operational-dialog-dark.png',
    animations: 'disabled',
  });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
