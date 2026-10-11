import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RiskFactorsPanel } from '@/features/reservation-risk/components/RiskFactorsPanel';
import { RF, XGB } from '@/tests/mocks/fastify/fixtures/reservations';
import { factorsFixture, httpError, MOCK_IDS, ok } from '@/tests/support/fixtures';
import { renderWithQuery } from '@/tests/support/render';

const actions = vi.hoisted(() => ({
  requestPredictionAction: vi.fn(),
  loadRiskFactorsAction: vi.fn(),
}));
vi.mock('@/features/reservation-risk/api/risk.actions', () => actions);
vi.mock('@/features/reservation-risk/components/RiskFactorsChart', () => ({
  default: () => <div data-testid="shap-chart" />,
}));

const options = [
  { modelKey: 'random_forest_full_v1' as const, label: 'Random Forest' },
  { modelKey: 'xgboost_full_v1' as const, label: 'XGBoost' },
];

function renderPanel(unavailableReason: string | null = null) {
  renderWithQuery(
    <RiskFactorsPanel
      reservationId={MOCK_IDS.availableBoth}
      modelOptions={options}
      unavailableReason={unavailableReason}
    />,
  );
}

async function requestExplanation(model?: string) {
  const user = userEvent.setup();
  if (model) await user.selectOptions(screen.getByLabelText('Modelo'), model);
  await user.click(screen.getByRole('button', { name: 'Ver explicación' }));
  return user;
}

beforeEach(() => vi.clearAllMocks());

describe('Factores SHAP bajo demanda (HU-05)', () => {
  it('no solicita la explicación al renderizar ni al cambiar el selector', async () => {
    renderPanel();
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText('Modelo'), XGB.key);
    await user.selectOptions(screen.getByLabelText('Factores'), '10');
    expect(actions.loadRiskFactorsAction).not.toHaveBeenCalled();
  });

  it('RF: solicita un único modelo y muestra factores en escala de probabilidad', async () => {
    actions.loadRiskFactorsAction.mockResolvedValue(
      ok(factorsFixture(MOCK_IDS.availableBoth, RF.key)),
    );
    renderPanel();
    await requestExplanation();
    expect(await screen.findByTestId('shap-chart')).toBeInTheDocument();
    expect(actions.loadRiskFactorsAction).toHaveBeenCalledTimes(1);
    expect(actions.loadRiskFactorsAction).toHaveBeenCalledWith(MOCK_IDS.availableBoth, RF.key, 5);
    expect(screen.getByText('Probabilidad (enlace identidad)')).toBeVisible();
    const table = within(screen.getByRole('table'));
    expect(table.getByText('+0.0612')).toBeVisible();
    expect(table.getByText('-0.0218')).toBeVisible();
    expect(table.getByText('0.000')).toBeVisible();
    expect(table.getByText('Sin asociación apreciable')).toBeVisible();
    expect(table.getByText('Atributo sensible')).toBeVisible();
    expect(screen.getByText(/se muestran por transparencia/)).toBeVisible();
  });

  it('XGBoost: contribuciones en log-odds, nunca en puntos porcentuales', async () => {
    actions.loadRiskFactorsAction.mockResolvedValue(
      ok(factorsFixture(MOCK_IDS.availableBoth, XGB.key)),
    );
    renderPanel();
    await requestExplanation(XGB.key);
    expect(await screen.findByText('Log-odds (enlace sigmoide)')).toBeVisible();
    expect(screen.getByText(/no equivalen a puntos porcentuales/)).toBeVisible();
    for (const cell of within(screen.getByRole('table')).getAllByRole('cell')) {
      expect(cell.textContent).not.toMatch(/%|p\. p\./);
    }
    expect(actions.loadRiskFactorsAction).toHaveBeenCalledWith(MOCK_IDS.availableBoth, XGB.key, 5);
  });

  it('aclara que los factores no son causas', async () => {
    actions.loadRiskFactorsAction.mockResolvedValue(
      ok(factorsFixture(MOCK_IDS.availableBoth, RF.key)),
    );
    renderPanel();
    await requestExplanation();
    expect(await screen.findByText(/no implica causalidad/)).toBeVisible();
    expect(screen.queryByText(/causa la inasistencia|porque el cliente/i)).not.toBeInTheDocument();
  });

  it('explicación sin factores: no dibuja un gráfico vacío', async () => {
    actions.loadRiskFactorsAction.mockResolvedValue(
      ok(factorsFixture(MOCK_IDS.rfOnlyZero, RF.key, 5, true)),
    );
    renderPanel();
    await requestExplanation();
    expect(
      await screen.findByText('El modelo no informó factores para esta estimación'),
    ).toBeVisible();
    expect(screen.queryByTestId('shap-chart')).not.toBeInTheDocument();
  });

  it('409 EXPLANATION_SNAPSHOT_UNAVAILABLE: mensaje amigable con detalles técnicos', async () => {
    actions.loadRiskFactorsAction.mockResolvedValue(
      httpError(409, 'EXPLANATION_SNAPSHOT_UNAVAILABLE', {
        reasons: [{ code: 'SCHEDULED_SERVICES_NOT_POINT_IN_TIME', message: 'Sin evidencia' }],
      }),
    );
    renderPanel();
    await requestExplanation();
    expect(
      await screen.findByText(
        'No se dispone de información suficiente para explicar esta estimación.',
      ),
    ).toBeVisible();
    expect(screen.getByText('Detalles técnicos (1)')).toBeInTheDocument();
    expect(screen.queryByTestId('shap-chart')).not.toBeInTheDocument();
  });

  it.each([
    [503, 'EXPLANATION_UNAVAILABLE', 'Explicaciones SHAP no disponibles'],
    [504, 'ML_TIMEOUT', 'Tiempo de espera agotado'],
    [502, 'ML_CONTRACT_VIOLATION', 'Respuesta ML incompatible'],
  ])('%i %s se muestra como error localizado', async (status, code, title) => {
    actions.loadRiskFactorsAction.mockResolvedValue(httpError(status, code));
    renderPanel();
    await requestExplanation();
    expect(await screen.findByRole('alert')).toHaveTextContent(title);
  });

  it('error de red con reintento manual', async () => {
    actions.loadRiskFactorsAction.mockRejectedValueOnce(new Error('fetch failed'));
    actions.loadRiskFactorsAction.mockResolvedValueOnce(
      ok(factorsFixture(MOCK_IDS.availableBoth, RF.key)),
    );
    renderPanel();
    const user = await requestExplanation();
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión con el backend');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByTestId('shap-chart')).toBeInTheDocument();
  });

  it('no ofrece la explicación para una reserva no evaluable', () => {
    renderPanel('La explicación no está disponible: la reserva no es evaluable.');
    expect(screen.queryByRole('button', { name: 'Ver explicación' })).not.toBeInTheDocument();
    expect(actions.loadRiskFactorsAction).not.toHaveBeenCalled();
  });
});
