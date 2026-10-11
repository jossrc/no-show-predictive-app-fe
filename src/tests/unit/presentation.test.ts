import { describe, expect, it } from 'vitest';

import { toHistoryView } from '@/features/client-history/model/history-view';
import { toHealthView } from '@/features/prediction-models/model/health-view';
import {
  resolveModelIdentity,
  selectableModelKeys,
} from '@/features/prediction-models/model/model-identity';
import { formatContribution, toFactorViews } from '@/features/reservation-risk/model/factors';
import {
  buildModelSlots,
  predictionRequestAvailability,
} from '@/features/reservation-risk/model/risk-view';
import { toScoreViews } from '@/features/reservation-risk/model/score-view';
import { describeApiError } from '@/lib/errors/error-catalog';
import { formatPercentage, formatRate } from '@/lib/format/percentage';
import { RF, XGB } from '@/tests/mocks/fastify/fixtures/reservations';
import {
  catalogFixture,
  factorsFixture,
  historyFixture,
  httpError,
  listItemFixture,
  MOCK_IDS,
  ok,
  riskFixture,
} from '@/tests/support/fixtures';

describe('Probabilidades exploratorias', () => {
  it('muestra 0 % y 100 % solo para scores reales y redondea solo la presentación', () => {
    expect(formatPercentage(0)).toBe('0 %');
    expect(formatPercentage(100)).toBe('100 %');
    expect(formatPercentage(31.25)).toBe('31.3 %');
    expect(formatPercentage(31)).toBe('31 %');
  });

  it('identifica modelos por modelKey, no por posición, sin elegir ganador', () => {
    const item = listItemFixture(MOCK_IDS.availableBoth);
    const reversed = [...item.risk.probabilities].reverse();
    const views = toScoreViews(reversed, XGB.key, null);
    expect(views.map((view) => view.modelKey)).toEqual([XGB.key, RF.key]);
    expect(views[0]).toMatchObject({ shortLabel: 'XGB', percentageText: '27.4 %', selected: true });
  });

  it('una reserva sin scores no produce probabilidades', () => {
    expect(
      toScoreViews(listItemFixture(MOCK_IDS.notScorable).risk.probabilities, RF.key, null),
    ).toEqual([]);
  });

  it('reconoce un modelo desconocido sin inventar su algoritmo', () => {
    expect(resolveModelIdentity('modelo_nuevo_v9')).toMatchObject({
      known: false,
      algorithm: null,
      label: 'Modelo no reconocido (modelo_nuevo_v9)',
    });
    expect(resolveModelIdentity('modelo_nuevo_v9', null, 'xgboost').label).toBe(
      'XGBoost · modelo_nuevo_v9',
    );
  });
});

describe('Comparación RF / XGBoost en el detalle', () => {
  it('genera un bloque por modelo esperado aunque solo exista RF', () => {
    const slots = buildModelSlots(riskFixture(MOCK_IDS.rfOnlyZero), catalogFixture);
    expect(slots.map((slot) => [slot.modelKey, slot.result?.percentageNoShow ?? null])).toEqual([
      [RF.key, 0],
      [XGB.key, null],
    ]);
    expect(predictionRequestAvailability(riskFixture(MOCK_IDS.rfOnlyZero), slots).allowed).toBe(
      true,
    );
  });

  it('funciona con solo XGBoost, sin modelos y sin catálogo', () => {
    expect(
      buildModelSlots(riskFixture(MOCK_IDS.xgbOnly), null).find((slot) => slot.result)?.modelKey,
    ).toBe(XGB.key);
    expect(
      buildModelSlots(riskFixture(MOCK_IDS.notScored), null).every((slot) => slot.result === null),
    ).toBe(true);
  });

  it('no ofrece la solicitud para NOT_SCORABLE ni cuando todos los modelos tienen estimación', () => {
    const notScorable = riskFixture(MOCK_IDS.notScorable);
    expect(
      predictionRequestAvailability(notScorable, buildModelSlots(notScorable, catalogFixture))
        .allowed,
    ).toBe(false);
    const both = riskFixture(MOCK_IDS.availableBoth);
    expect(predictionRequestAvailability(both, buildModelSlots(both, catalogFixture)).allowed).toBe(
      false,
    );
  });

  it('limita los modelos seleccionables al contrato', () => {
    expect(selectableModelKeys(null)).toEqual([RF.key, XGB.key]);
    expect(selectableModelKeys(catalogFixture)).toEqual([RF.key, XGB.key]);
  });
});

describe('Factores SHAP', () => {
  it('formatea contribuciones con signo y sin porcentaje en ambos espacios', () => {
    const rf = toFactorViews(factorsFixture(MOCK_IDS.availableBoth, RF.key).explanation.factors);
    const xgb = toFactorViews(factorsFixture(MOCK_IDS.availableBoth, XGB.key).explanation.factors);
    expect(rf[0]?.contributionText).toBe('+0.0612');
    expect(xgb[0]?.contributionText).toBe('+0.4821');
    for (const factor of [...rf, ...xgb]) expect(factor.contributionText).not.toContain('%');
    expect(formatContribution(-0.0218)).toBe('-0.0218');
    expect(formatContribution(0)).toBe('0.000');
  });

  it('describe la dirección como asociación con la salida del modelo', () => {
    const [positive, , negative] = toFactorViews(
      factorsFixture(MOCK_IDS.availableBoth, RF.key).explanation.factors,
    );
    expect(positive?.directionLabel).toBe('Asociado a una salida mayor del modelo');
    expect(negative?.directionLabel).toBe('Asociado a una salida menor del modelo');
    expect(negative?.sensitive).toBe(true);
  });
});

describe('Historial del cliente', () => {
  it('muestra 0 % cuando la tasa es 0 y nunca convierte null en 0 %', () => {
    expect(toHistoryView(historyFixture(MOCK_IDS.availableBoth, 'booking_creation'))).toMatchObject(
      { attended: 10, noShow: 0, rateText: '0 %' },
    );
    const empty = toHistoryView(historyFixture(MOCK_IDS.notScorable, 'booking_creation'));
    expect(empty).toMatchObject({ rateText: null, lastAttendedText: null, lastNoShowText: null });
    expect(formatRate(1 / 13)).toBe('7.7 %');
  });

  it('traduce los avisos sin perder códigos desconocidos', () => {
    const view = toHistoryView({
      ...historyFixture(MOCK_IDS.availableBoth, 'current_known'),
      warnings: ['CURRENT_KNOWN_DOES_NOT_FEED_ORIGINAL_SCORE', 'NUEVO_AVISO'],
    });
    expect(view.warnings.map((warning) => warning.text)).toEqual([
      'Este historial actual no alimenta ni modifica el score original de la reserva.',
      'NUEVO_AVISO',
    ]);
  });
});

describe('Errores y disponibilidad', () => {
  it('presenta los códigos del contrato en español', () => {
    expect(
      describeApiError(httpError(409, 'EXPLANATION_SNAPSHOT_UNAVAILABLE').error).description,
    ).toBe('No se dispone de información suficiente para explicar esta estimación.');
    expect(describeApiError(httpError(503, 'DESCONOCIDO').error)).toMatchObject({
      title: 'Servicio no disponible',
      retryable: true,
    });
    expect(describeApiError(httpError(418, 'DESCONOCIDO').error).retryable).toBe(false);
  });

  it('no afirma disponibilidad total cuando solo responde Health', () => {
    const view = toHealthView(
      ok({
        service: 'ml',
        status: 'ok',
        message: '',
        servingStatus: 'EXPLORATORY_NOT_VALIDATED',
        operationalUseAllowed: false,
      }),
    );
    expect(view.label).toBe('ML disponible');
    expect(view.description).toContain('no garantiza');
    expect(toHealthView(httpError(503, 'X')).tone).toBe('unknown');
  });
});
