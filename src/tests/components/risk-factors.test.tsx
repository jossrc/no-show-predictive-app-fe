import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RiskFactorsPanel } from '@/features/reservation-risk/components/RiskFactorsPanel';
import { RiskFactorsSection } from '@/features/reservation-risk/components/RiskFactorsSection';
import { RF, XGB } from '@/tests/mocks/fastify/fixtures/reservations';
import {
  catalogFixture,
  factorsFixture,
  httpError,
  MOCK_IDS,
  ok,
  riskFixture,
} from '@/tests/support/fixtures';
import { renderWithQuery } from '@/tests/support/render';

const actions = vi.hoisted(() => ({
  requestPredictionAction: vi.fn(),
  loadRiskFactorsAction: vi.fn(),
}));
vi.mock('@/features/reservation-risk/api/risk.actions', () => actions);

const options = [
  { modelKey: 'random_forest_full_v1' as const, label: 'Random Forest' },
  { modelKey: 'xgboost_full_v1' as const, label: 'XGBoost' },
];

function renderPanel(diagnosticsEnabled = false) {
  renderWithQuery(
    <RiskFactorsPanel reservationId={MOCK_IDS.availableBoth} modelOptions={options} />,
    { diagnosticsEnabled },
  );
}

async function requestFactors(model?: string) {
  const user = userEvent.setup();
  if (model) await user.selectOptions(screen.getByLabelText('Modelo'), model);
  await user.click(screen.getByRole('button', { name: 'Ver factores' }));
  return user;
}

beforeEach(() => vi.clearAllMocks());

describe('Factores relacionados con la estimación (HU-05)', () => {
  it('no consulta factores al renderizar ni al cambiar los selectores', async () => {
    renderPanel();
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText('Modelo'), XGB.key);
    await user.selectOptions(screen.getByLabelText('Cantidad'), '10');
    expect(actions.loadRiskFactorsAction).not.toHaveBeenCalled();
  });

  it('RF: tabla sin gráficos, en escala de probabilidad', async () => {
    actions.loadRiskFactorsAction.mockResolvedValue(
      ok(factorsFixture(MOCK_IDS.availableBoth, RF.key)),
    );
    renderPanel();
    await requestFactors();
    const table = within(await screen.findByRole('table'));
    expect(actions.loadRiskFactorsAction).toHaveBeenCalledTimes(1);
    expect(actions.loadRiskFactorsAction).toHaveBeenCalledWith(MOCK_IDS.availableBoth, RF.key, 5);
    expect(table.getByRole('columnheader', { name: 'Contribución (probabilidad)' })).toBeVisible();
    expect(table.getByText('+0.0612')).toBeVisible();
    expect(table.getByText('-0.0218')).toBeVisible();
    expect(table.getByText('0.000')).toBeVisible();
    expect(table.getAllByText('Sin efecto apreciable').length).toBeGreaterThan(0);
    expect(table.getByText('Dato sensible')).toBeVisible();
    expect(screen.getByText(/escala de probabilidad \(de 0 a 1\)/)).toBeVisible();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(document.querySelector('svg.recharts-surface, canvas')).toBeNull();
  });

  it('XGBoost: contribuciones en log-odds, nunca en puntos porcentuales', async () => {
    actions.loadRiskFactorsAction.mockResolvedValue(
      ok(factorsFixture(MOCK_IDS.availableBoth, XGB.key)),
    );
    renderPanel();
    await requestFactors(XGB.key);
    const table = within(await screen.findByRole('table'));
    expect(table.getByRole('columnheader', { name: 'Contribución (log-odds)' })).toBeVisible();
    expect(screen.getByText(/no equivalen a puntos porcentuales/)).toBeVisible();
    for (const cell of table.getAllByRole('cell')) {
      expect(cell.textContent).not.toMatch(/%|p\. p\./);
    }
    expect(actions.loadRiskFactorsAction).toHaveBeenCalledWith(MOCK_IDS.availableBoth, XGB.key, 5);
  });

  it('no presenta los factores como causas; las notas metodológicas son desplegables', async () => {
    actions.loadRiskFactorsAction.mockResolvedValue(
      ok(factorsFixture(MOCK_IDS.availableBoth, RF.key)),
    );
    renderPanel();
    const user = await requestFactors();
    expect(
      await screen.findByText(/no indican necesariamente las causas de una inasistencia/),
    ).toBeVisible();
    expect(screen.queryByText(/causa la inasistencia|porque el cliente/i)).not.toBeInTheDocument();
    expect(screen.getByText(/no implica causalidad/)).not.toBeVisible();
    await user.click(screen.getByText('Acerca de estos factores'));
    expect(screen.getByText(/no implica causalidad/)).toBeVisible();
    expect(screen.getByText(/se muestran por transparencia/)).toBeVisible();
  });

  it('explicación sin factores: bloque compacto, sin tabla vacía', async () => {
    actions.loadRiskFactorsAction.mockResolvedValue(
      ok(factorsFixture(MOCK_IDS.rfOnlyZero, RF.key, 5, true)),
    );
    renderPanel();
    await requestFactors();
    expect(
      await screen.findByText('Los factores de esta estimación no están disponibles.'),
    ).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('409 EXPLANATION_SNAPSHOT_UNAVAILABLE: mensaje comprensible, sin códigos técnicos', async () => {
    actions.loadRiskFactorsAction.mockResolvedValue(
      httpError(409, 'EXPLANATION_SNAPSHOT_UNAVAILABLE', {
        reasons: [{ code: 'SCHEDULED_SERVICES_NOT_POINT_IN_TIME', message: 'Sin evidencia' }],
      }),
    );
    renderPanel();
    await requestFactors();
    expect(await screen.findByText('Explicación no disponible')).toBeVisible();
    expect(
      screen.getByText('No podemos mostrar los factores de esta cita con la información actual.'),
    ).toBeVisible();
    expect(screen.queryByText(/SCHEDULED_SERVICES|snapshot/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it.each([
    [503, 'EXPLANATION_UNAVAILABLE', 'Factores no disponibles por ahora'],
    [504, 'ML_TIMEOUT', 'No se completó la estimación'],
    [502, 'ML_CONTRACT_VIOLATION', 'No se pudo calcular la estimación'],
  ])('%i %s se muestra como error localizado', async (status, code, title) => {
    actions.loadRiskFactorsAction.mockResolvedValue(httpError(status, code));
    renderPanel();
    await requestFactors();
    expect(await screen.findByRole('alert')).toHaveTextContent(title);
  });

  it('error de red con reintento manual', async () => {
    actions.loadRiskFactorsAction.mockRejectedValueOnce(new Error('fetch failed'));
    actions.loadRiskFactorsAction.mockResolvedValueOnce(
      ok(factorsFixture(MOCK_IDS.availableBoth, RF.key)),
    );
    renderPanel();
    const user = await requestFactors();
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar la información');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('table')).toBeVisible();
  });

  it('desarrollo: el diagnóstico muestra el espacio de salida y la historia', async () => {
    actions.loadRiskFactorsAction.mockResolvedValue(
      ok(factorsFixture(MOCK_IDS.availableBoth, XGB.key)),
    );
    renderPanel(true);
    const user = await requestFactors(XGB.key);
    await screen.findByRole('table');
    await user.click(
      screen.getByRole('button', {
        name: 'Diagnóstico técnico: Factores relacionados con la estimación',
      }),
    );
    const sheet = within(screen.getByRole('dialog'));
    expect(sheet.getByText('HU-05')).toBeVisible();
    expect(sheet.getAllByText('log_odds').length).toBeGreaterThan(0);
  });
});

describe('Sección de factores', () => {
  it('reserva no evaluable: sección compacta, sin controles ni consultas', () => {
    render(
      <RiskFactorsSection
        reservationId={MOCK_IDS.notScorable}
        risk={ok(riskFixture(MOCK_IDS.notScorable))}
        catalog={ok(catalogFixture)}
      />,
    );
    const region = within(
      screen.getByRole('region', { name: 'Factores relacionados con la estimación' }),
    );
    expect(region.getByText('Los factores de esta estimación no están disponibles.')).toBeVisible();
    expect(region.queryByRole('button')).not.toBeInTheDocument();
    expect(actions.loadRiskFactorsAction).not.toHaveBeenCalled();
  });
});
