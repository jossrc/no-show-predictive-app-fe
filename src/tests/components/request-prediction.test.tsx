import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RequestPredictionPanel } from '@/features/reservation-risk/components/RequestPredictionPanel';
import { httpError, MOCK_IDS, ok } from '@/tests/support/fixtures';

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

function renderPanel() {
  render(
    <RequestPredictionPanel
      reservationId={MOCK_IDS.notScored}
      modelOptions={options}
      availability={{ allowed: true, reason: null }}
    />,
  );
  return screen.getByRole('button', { name: 'Solicitar predicción' });
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
    expect(await screen.findByRole('button', { name: /Solicitando predicción/ })).toBeDisabled();
    expect(actions.requestPredictionAction).toHaveBeenCalledTimes(1);
    expect(actions.requestPredictionAction).toHaveBeenCalledWith(MOCK_IDS.notScored, {
      mode: 'compare',
    });
    resolve(success(true));
    expect(await screen.findByText('Predicción registrada')).toBeVisible();
  });

  it('envía single con el modelo elegido', async () => {
    const user = userEvent.setup();
    actions.requestPredictionAction.mockResolvedValue(success(false));
    renderPanel();
    await user.selectOptions(screen.getByLabelText('Modelos a evaluar'), 'xgboost_full_v1');
    await user.click(screen.getByRole('button', { name: 'Solicitar predicción' }));
    expect(actions.requestPredictionAction).toHaveBeenCalledWith(MOCK_IDS.notScored, {
      mode: 'single',
      modelKey: 'xgboost_full_v1',
    });
    expect(await screen.findByText('Se reutilizó una predicción existente')).toBeVisible();
  });

  it('409 NOT_SCORABLE se presenta como estado funcional con motivos, no como falla', async () => {
    const user = userEvent.setup();
    actions.requestPredictionAction.mockResolvedValue(
      httpError(409, 'NOT_SCORABLE', {
        reasons: [{ code: 'CATALOG_NOT_POINT_IN_TIME', message: 'Catálogo modificado' }],
      }),
    );
    await user.click(renderPanel());
    expect(await screen.findByText('Reserva no evaluable')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    [429, 'ML_RATE_LIMITED', 'Servicio de predicción saturado', true],
    [502, 'ML_CONTRACT_VIOLATION', 'Respuesta ML incompatible', false],
    [503, 'ML_UNAVAILABLE', 'Servicio ML no disponible', true],
    [503, 'ML_CREDENTIAL_REJECTED', 'Credencial interna ML rechazada', false],
    [503, 'PERSISTENCE_UNAVAILABLE', 'Persistencia predictiva no disponible', true],
    [409, 'FEATURE_VERSION_MISMATCH', 'Incompatibilidad de versión ML', false],
    [422, 'INVALID_FEATURES', 'Características inválidas', false],
  ])('%i %s muestra «%s»', async (status, code, title, retryable) => {
    const user = userEvent.setup();
    actions.requestPredictionAction.mockResolvedValue(httpError(status, code));
    await user.click(renderPanel());
    expect(await screen.findByRole('alert')).toHaveTextContent(title);
    expect(screen.queryAllByRole('button', { name: 'Reintentar' }).length > 0).toBe(retryable);
    expect(screen.getByText(/req-error-1/)).toBeVisible();
  });

  it('504: indica resultado no confirmado y no reintenta automáticamente', async () => {
    const user = userEvent.setup();
    actions.requestPredictionAction.mockResolvedValue(httpError(504, 'ML_TIMEOUT'));
    await user.click(renderPanel());
    expect(await screen.findByText(/No se confirmó el resultado de la operación/)).toBeVisible();
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
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión con el backend');
  });

  it('deshabilitada con explicación cuando no corresponde', () => {
    render(
      <RequestPredictionPanel
        reservationId={MOCK_IDS.notScorable}
        modelOptions={options}
        availability={{ allowed: false, reason: 'No disponible: la reserva no es evaluable.' }}
      />,
    );
    const button = screen.getByRole('button', { name: 'Solicitar predicción' });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription('No disponible: la reserva no es evaluable.');
  });
});
