import { render, screen, within } from '@testing-library/react';
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
const section = () => screen.getByRole('region', { name: 'Estimación de inasistencia' });

function renderRisk(id: string, risk = ok(riskFixture(id)), models = catalog) {
  return render(<RiskSection reservationId={id} risk={risk} catalog={models} />);
}

beforeEach(() => vi.clearAllMocks());

describe('Estimación de inasistencia (HU-02)', () => {
  it('muestra la banda exploratoria de cada modelo junto a su score, sin crear riesgo operativo', () => {
    renderRisk(MOCK_IDS.availableBoth);
    const rf = screen.getByRole('heading', { name: 'Random Forest' }).closest('article')!;
    const xgb = screen.getByRole('heading', { name: 'XGBoost' }).closest('article')!;
    expect(within(rf).getByText('Medio (exploratorio)')).toBeVisible();
    expect(within(xgb).getByText('Bajo (exploratorio)')).toBeVisible();
    expect(within(section()).getByText(/no representan riesgo absoluto validado/)).toBeVisible();
  });

  it('explica la reprogramación y conserva todos los motivos devueltos, sin calcular scores', () => {
    renderRisk(MOCK_IDS.stale);
    const region = within(section());
    expect(
      region.getByText('La cita fue reprogramada y no existe instantánea original de la reserva'),
    ).toBeVisible();
    expect(region.queryByText(/\d+\.\d+ %/)).not.toBeInTheDocument();
    expect(region.queryByRole('button')).not.toBeInTheDocument();
    expect(actions.requestPredictionAction).not.toHaveBeenCalled();
  });

  it('presenta el mensaje de un motivo nuevo sin exponer su código', () => {
    const risk = riskFixture(MOCK_IDS.notScorable);
    renderRisk(
      MOCK_IDS.notScorable,
      ok({
        ...risk,
        reasons: [{ code: 'NEW_REASON', message: 'La reconstrucción original no es elegible.' }],
      }),
    );
    expect(within(section()).getByText('La reconstrucción original no es elegible.')).toBeVisible();
    expect(within(section()).queryByText('NEW_REASON')).not.toBeInTheDocument();
  });

  it('AVAILABLE_EXPLORATORY con RF y XGBoost: independientes, sin promedio ni ganador', () => {
    renderRisk(MOCK_IDS.availableBoth);
    const region = within(section());
    expect(region.getByRole('heading', { name: 'Random Forest' })).toBeVisible();
    expect(region.getByRole('heading', { name: 'XGBoost' })).toBeVisible();
    expect(region.getByText('31.00 %')).toBeVisible();
    expect(region.getByText('27.40 %')).toBeVisible();
    expect(region.getByText(/3.6 p. p./)).toBeVisible();
    expect(region.getByText(/no indica confianza ni qué modelo es más preciso/)).toBeVisible();
    expect(
      region.getByText(
        /Estimaciones experimentales no calibradas. No validadas ni aprobadas para decisiones operativas./,
      ),
    ).toBeVisible();
    expect(
      region.getByText(/niveles de riesgo operativo todavía no está disponible/),
    ).toBeVisible();
    expect(region.queryByText(/riesgo (bajo|medio|alto)/i)).not.toBeInTheDocument();
    expect(region.queryByText(/ganador|promedio/i)).not.toBeInTheDocument();
    // Todos los modelos tienen estimación: la acción no se muestra.
    expect(region.queryByRole('button', { name: 'Calcular estimación' })).not.toBeInTheDocument();
  });

  it('no crea semáforos: la cifra no cambia de color según umbrales', () => {
    renderRisk(MOCK_IDS.availableBoth);
    for (const value of ['31.00 %', '27.40 %']) {
      expect(within(section()).getByText(value).className).not.toMatch(
        /red|green|yellow|amber|destructive|warning|success/,
      );
    }
  });

  it('un solo modelo: probabilidad real de 0 % y el otro modelo «Sin estimación»', () => {
    renderRisk(MOCK_IDS.rfOnlyZero);
    const region = within(section());
    expect(region.getByText('0.00 %')).toBeVisible();
    expect(region.getByText('Sin estimación')).toBeVisible();
    expect(region.getByRole('button', { name: 'Calcular estimación' })).toBeEnabled();
  });

  it('XGBoost únicamente: probabilidad de 100 % para un score real de 1', () => {
    renderRisk(MOCK_IDS.xgbOnly);
    expect(within(section()).getByText('100.00 %')).toBeVisible();
  });

  it('NOT_SCORED: «Aún no hay una estimación» con acción explícita, sin POST automático', () => {
    renderRisk(MOCK_IDS.notScored);
    const region = within(section());
    expect(region.getByText('Aún no hay una estimación')).toBeVisible();
    expect(region.getByRole('button', { name: 'Calcular estimación' })).toBeEnabled();
    expect(region.queryByText(/%/)).not.toBeInTheDocument();
    expect(actions.requestPredictionAction).not.toHaveBeenCalled();
  });

  it('NOT_SCORABLE: mensaje comprensible y compacto, sin códigos, porcentajes ni acciones', () => {
    renderRisk(MOCK_IDS.notScorable);
    const region = within(section());
    expect(region.getByText('Estimación no disponible')).toBeVisible();
    expect(
      region.getByText(
        'Los servicios programados provienen de la réplica actual sin evidencia temporal de la reserva',
      ),
    ).toBeVisible();
    expect(region.queryByText(/\d+ %/)).not.toBeInTheDocument();
    expect(region.queryByText(/SCHEDULED_SERVICES|NOT_SCORABLE|snapshot/i)).not.toBeInTheDocument();
    expect(region.queryByRole('button')).not.toBeInTheDocument();
    expect(region.queryByText(/experimental/i)).not.toBeInTheDocument();
    expect(region.queryByRole('alert')).not.toBeInTheDocument();
    expect(actions.requestPredictionAction).not.toHaveBeenCalled();
  });

  it('un fallo del riesgo se muestra localizado y un fallo del catálogo no oculta los resultados', () => {
    const { unmount } = renderRisk(
      MOCK_IDS.partialErrors,
      httpError(503, 'PERSISTENCE_UNAVAILABLE'),
    );
    expect(within(section()).getByRole('alert')).toHaveTextContent(
      'Estimaciones no disponibles por ahora',
    );
    expect(within(section()).getByRole('button', { name: 'Reintentar' })).toBeVisible();
    unmount();

    renderRisk(
      MOCK_IDS.availableBoth,
      ok(riskFixture(MOCK_IDS.availableBoth)),
      httpError(503, 'ML_UNAVAILABLE'),
    );
    expect(within(section()).getByText('31.00 %')).toBeVisible();
    expect(within(section()).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('un modelo desconocido se muestra sin descartarlo ni suponer su algoritmo por posición', () => {
    const risk = riskFixture(MOCK_IDS.availableBoth);
    const unknown = {
      ...risk,
      models: [{ ...risk.models[0]!, modelKey: 'modelo_nuevo_v2' }, risk.models[1]!],
    };
    renderRisk(MOCK_IDS.availableBoth, ok(unknown));
    const region = within(section());
    expect(region.getByRole('heading', { name: 'Random Forest · modelo_nuevo_v2' })).toBeVisible();
    expect(region.getByRole('heading', { name: 'XGBoost' })).toBeVisible();
    // RF del catálogo sigue apareciendo como modelo sin estimación: no se le asigna el resultado ajeno.
    expect(region.getByRole('heading', { name: 'Random Forest' })).toBeVisible();
    expect(region.getByText('Sin estimación')).toBeVisible();
  });
});
