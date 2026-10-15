import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RequestPredictionPanel } from '@/features/reservation-risk/components/RequestPredictionPanel';
import { httpError, MOCK_IDS, ok } from '@/tests/support/fixtures';
import { renderWithQuery } from '@/tests/support/render';

const actions = vi.hoisted(() => ({
  requestPredictionAction: vi.fn(),
  loadRiskFactorsAction: vi.fn(),
}));
vi.mock('@/features/reservation-risk/api/risk.actions', () => actions);
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const options = [
  { modelKey: 'random_forest_full_v1' as const, label: 'Random Forest' },
  { modelKey: 'xgboost_full_v1' as const, label: 'XGBoost' },
];

const panel = (
  <RequestPredictionPanel
    reservationId={MOCK_IDS.notScored}
    modelOptions={options}
    availability={{ allowed: true, reason: null }}
  />
);

function renderPanel() {
  render(panel);
  return screen.getByRole('button', { name: 'Calcular estimación' });
}

const success = (created: boolean) =>
  ok(
    {
      created,
      replayed: !created,
      requestedModelKeys: ['random_forest_full_v1'],
      featureWarnings: [],
    },
    created ? 201 : 200,
  );

beforeEach(() => vi.clearAllMocks());

describe('Solicitud explícita de predicción (HU-02)', () => {
  it('no se ejecuta al renderizar', () => {
    renderPanel();
    expect(actions.requestPredictionAction).not.toHaveBeenCalled();
  });

  it('envía compare por defecto, muestra carga y bloquea el doble clic', async () => {
    const user = userEvent.setup();
    let resolve: (value: unknown) => void = () => {};
    actions.requestPredictionAction.mockReturnValue(new Promise((r) => (resolve = r)));
    const button = renderPanel();
    await user.click(button);
    await user.click(button);
    expect(await screen.findByRole('button', { name: /Calculando/ })).toBeDisabled();
    expect(actions.requestPredictionAction).toHaveBeenCalledTimes(1);
    expect(actions.requestPredictionAction).toHaveBeenCalledWith(MOCK_IDS.notScored, {
      mode: 'compare',
    });
    resolve(success(true));
    expect(await screen.findByText('Estimación calculada')).toBeVisible();
  });

  it('envía single con el modelo elegido', async () => {
    const user = userEvent.setup();
    actions.requestPredictionAction.mockResolvedValue(success(false));
    renderPanel();
    await user.selectOptions(screen.getByLabelText('Modelos'), 'xgboost_full_v1');
    await user.click(screen.getByRole('button', { name: 'Calcular estimación' }));
    expect(actions.requestPredictionAction).toHaveBeenCalledWith(MOCK_IDS.notScored, {
      mode: 'single',
      modelKey: 'xgboost_full_v1',
    });
    expect(await screen.findByText('Ya existía una estimación')).toBeVisible();
  });

  it('409 NOT_SCORABLE se presenta como limitación, no como falla', async () => {
    const user = userEvent.setup();
    actions.requestPredictionAction.mockResolvedValue(
      httpError(409, 'NOT_SCORABLE', {
        reasons: [{ code: 'CATALOG_NOT_POINT_IN_TIME', message: 'Catálogo modificado' }],
      }),
    );
    await user.click(renderPanel());
    expect(await screen.findByText('Estimación no disponible')).toBeVisible();
    expect(
      screen.getByText('No contamos con información suficiente para calcularla.'),
    ).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('CATALOG_NOT_POINT_IN_TIME')).not.toBeInTheDocument();
  });

  it.each([
    [429, 'ML_RATE_LIMITED', 'Demasiadas solicitudes', true],
    [502, 'ML_CONTRACT_VIOLATION', 'No se pudo calcular la estimación', false],
    [503, 'ML_UNAVAILABLE', 'Estimaciones no disponibles por ahora', true],
    [503, 'ML_CREDENTIAL_REJECTED', 'No se pudo calcular la estimación', false],
    [503, 'PERSISTENCE_UNAVAILABLE', 'Estimaciones no disponibles por ahora', true],
    [409, 'FEATURE_VERSION_MISMATCH', 'No se pudo calcular la estimación', false],
    [422, 'INVALID_FEATURES', 'No se pudo calcular la estimación', false],
  ])('%i %s muestra «%s» sin códigos ni requestId', async (status, code, title, retryable) => {
    const user = userEvent.setup();
    actions.requestPredictionAction.mockResolvedValue(httpError(status, code));
    await user.click(renderPanel());
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(title);
    expect(alert).not.toHaveTextContent(new RegExp(`${code}|req-error-1|${status}`));
    expect(screen.queryAllByRole('button', { name: 'Reintentar' }).length > 0).toBe(retryable);
  });

  it('desarrollo: el código y el requestId se consultan en el diagnóstico', async () => {
    const user = userEvent.setup();
    actions.requestPredictionAction.mockResolvedValue(httpError(503, 'ML_UNAVAILABLE'));
    renderWithQuery(panel, { diagnosticsEnabled: true });
    await user.click(screen.getByRole('button', { name: 'Calcular estimación' }));
    await user.click(await screen.findByRole('button', { name: 'Ver diagnóstico técnico' }));
    const sheet = within(screen.getByRole('dialog'));
    expect(sheet.getByText('ML_UNAVAILABLE')).toBeVisible();
    expect(sheet.getByText('req-error-1')).toBeVisible();
    expect(sheet.getByText('POST /api/v1/reservations/:reservationId/predictions')).toBeVisible();
  });

  it('504: resultado no confirmado y sin reintento automático', async () => {
    const user = userEvent.setup();
    actions.requestPredictionAction.mockResolvedValue(httpError(504, 'ML_TIMEOUT'));
    await user.click(renderPanel());
    expect(await screen.findByText('No se completó la estimación')).toBeVisible();
    expect(screen.getByText(/No podemos confirmar el resultado/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Actualizar estado' })).toBeVisible();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(actions.requestPredictionAction).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(actions.requestPredictionAction).toHaveBeenCalledTimes(2));
  });

  it('un fallo de conexión de la acción se muestra como error de red', async () => {
    const user = userEvent.setup();
    actions.requestPredictionAction.mockRejectedValue(new Error('fetch failed'));
    await user.click(renderPanel());
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar la información');
  });

  it('no se muestra cuando la acción no corresponde', () => {
    render(
      <RequestPredictionPanel
        reservationId={MOCK_IDS.notScorable}
        modelOptions={options}
        availability={{ allowed: false, reason: 'No disponible.' }}
      />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
