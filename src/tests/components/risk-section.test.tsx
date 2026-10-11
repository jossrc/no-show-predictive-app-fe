import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RiskSection } from '@/features/reservation-risk/components/RiskSection';
import { catalogFixture, httpError, MOCK_IDS, ok, riskFixture } from '@/tests/support/fixtures';

const actions = vi.hoisted(() => ({
  requestPredictionAction: vi.fn(),
  loadRiskFactorsAction: vi.fn(),
}));
vi.mock('@/features/reservation-risk/api/risk.actions', () => actions);
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const catalog = ok(catalogFixture);
const section = () => screen.getByRole('region', { name: 'Estimación predictiva' });

beforeEach(() => vi.clearAllMocks());

describe('Estimación predictiva (HU-02)', () => {
  it('AVAILABLE_EXPLORATORY con dos modelos: bloques comparables sin ganador', () => {
    render(
      <RiskSection
        reservationId={MOCK_IDS.availableBoth}
        risk={ok(riskFixture(MOCK_IDS.availableBoth))}
        catalog={catalog}
      />,
    );
    const region = within(section());
    expect(region.getByRole('heading', { name: 'Random Forest' })).toBeVisible();
    expect(region.getByRole('heading', { name: 'XGBoost' })).toBeVisible();
    expect(region.getByText('31 %')).toBeVisible();
    expect(region.getByText('27.4 %')).toBeVisible();
    expect(region.getByText(/3.6 p. p./)).toBeVisible();
    expect(region.getByText(/no indica confianza ni qué modelo es más preciso/)).toBeVisible();
    expect(region.getByText(/Clasificación de riesgo pendiente de validación/)).toBeVisible();
    expect(region.queryByText(/riesgo (bajo|medio|alto)/i)).not.toBeInTheDocument();
    expect(region.queryByText(/modelo ganador:|promedio de modelos/i)).not.toBeInTheDocument();
  });

  it('AVAILABLE_EXPLORATORY con un modelo: probabilidad real de 0 % y modelo faltante explícito', () => {
    render(
      <RiskSection
        reservationId={MOCK_IDS.rfOnlyZero}
        risk={ok(riskFixture(MOCK_IDS.rfOnlyZero))}
        catalog={catalog}
      />,
    );
    const region = within(section());
    expect(region.getByText('0 %')).toBeVisible();
    expect(region.getByText('Sin estimación registrada para este modelo.')).toBeVisible();
    expect(region.getByRole('button', { name: 'Solicitar predicción' })).toBeEnabled();
  });

  it('probabilidad de 100 % para un score real de 1', () => {
    render(
      <RiskSection
        reservationId={MOCK_IDS.xgbOnly}
        risk={ok(riskFixture(MOCK_IDS.xgbOnly))}
        catalog={catalog}
      />,
    );
    expect(within(section()).getByText('100 %')).toBeVisible();
  });

  it('NOT_SCORED: informa la ausencia y permite solicitar explícitamente sin llamar a la acción', () => {
    render(
      <RiskSection
        reservationId={MOCK_IDS.notScored}
        risk={ok(riskFixture(MOCK_IDS.notScored))}
        catalog={catalog}
      />,
    );
    const region = within(section());
    expect(
      region.getByText('Esta reserva todavía no tiene una predicción registrada.'),
    ).toBeVisible();
    expect(region.getByRole('button', { name: 'Solicitar predicción' })).toBeEnabled();
    expect(region.queryByText(/%/)).not.toBeInTheDocument();
    expect(actions.requestPredictionAction).not.toHaveBeenCalled();
  });

  it('NOT_SCORABLE: sin porcentaje, con motivos desplegables y acción deshabilitada', async () => {
    const user = userEvent.setup();
    render(
      <RiskSection
        reservationId={MOCK_IDS.notScorable}
        risk={ok(riskFixture(MOCK_IDS.notScorable))}
        catalog={catalog}
      />,
    );
    const region = within(section());
    expect(
      region.getByText('No es posible generar una predicción con la información disponible.'),
    ).toBeVisible();
    expect(region.queryByText(/\d+ %/)).not.toBeInTheDocument();
    await user.click(region.getByText('Ver motivos (2)'));
    expect(region.getByText('SCHEDULED_SERVICES_NOT_POINT_IN_TIME')).toBeVisible();
    expect(region.getByRole('button', { name: 'Solicitar predicción' })).toBeDisabled();
    expect(region.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('un fallo del riesgo se muestra localizado y un fallo del catálogo no oculta los resultados', () => {
    const { unmount } = render(
      <RiskSection
        reservationId={MOCK_IDS.partialErrors}
        risk={httpError(503, 'PERSISTENCE_UNAVAILABLE')}
        catalog={catalog}
      />,
    );
    expect(within(section()).getByRole('alert')).toHaveTextContent(
      'Persistencia predictiva no disponible',
    );
    unmount();

    render(
      <RiskSection
        reservationId={MOCK_IDS.availableBoth}
        risk={ok(riskFixture(MOCK_IDS.availableBoth))}
        catalog={httpError(503, 'ML_UNAVAILABLE')}
      />,
    );
    expect(within(section()).getByText('31 %')).toBeVisible();
    expect(within(section()).getByText(/Catálogo de modelos no disponible/)).toBeVisible();
  });

  it('un modelo desconocido se muestra sin descartarlo ni suponer su algoritmo por posición', () => {
    const risk = riskFixture(MOCK_IDS.availableBoth);
    const unknown = {
      ...risk,
      models: [{ ...risk.models[0]!, modelKey: 'modelo_nuevo_v2' }, risk.models[1]!],
    };
    render(
      <RiskSection reservationId={MOCK_IDS.availableBoth} risk={ok(unknown)} catalog={catalog} />,
    );
    const region = within(section());
    expect(region.getByRole('heading', { name: 'Random Forest · modelo_nuevo_v2' })).toBeVisible();
    expect(region.getByRole('heading', { name: 'XGBoost' })).toBeVisible();
    // RF del catálogo sigue apareciendo como modelo sin estimación: no se le asigna el resultado ajeno.
    expect(region.getByRole('heading', { name: 'Random Forest' })).toBeVisible();
    expect(region.getByText('Sin estimación registrada para este modelo.')).toBeVisible();
  });
});
