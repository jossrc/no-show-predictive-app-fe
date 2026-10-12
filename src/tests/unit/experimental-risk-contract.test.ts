import { describe, expect, it } from 'vitest';

import { riskFactorsSchema } from '@/features/reservation-risk/api/factors.contract';
import { riskAssessmentSchema } from '@/features/reservation-risk/api/risk.contract';
import {
  reservationDetailSchema,
  reservationListSchema,
} from '@/features/reservations/api/contract';
import { RF, XGB } from '@/tests/mocks/fastify/fixtures/reservations';
import {
  detailFixture,
  factorsFixture,
  listFixture,
  MOCK_IDS,
  riskFixture,
} from '@/tests/support/fixtures';

describe('Contratos research v2 y scores heredados v1', () => {
  it('conserva la política completa de cada modelo sin sustituir el riesgo operativo', () => {
    const result = riskAssessmentSchema.parse(riskFixture(MOCK_IDS.availableBoth));
    expect(result).toMatchObject({
      riskLevel: null,
      classificationUnavailable: false,
      operationalClassificationUnavailable: true,
      experimentalClassificationUnavailable: false,
      classificationBasis: 'RESEARCH_PROVISIONAL',
      operationalUseAllowed: false,
    });
    expect(result.experimentalRiskNotice).toBeTruthy();
    for (const model of result.models) {
      expect(model).toMatchObject({
        riskLevel: null,
        scoringApiVersion: 'v2',
        experimentalRiskUnavailableReason: null,
      });
      expect(model.experimentalRisk).toMatchObject({
        status: 'RESEARCH_PROVISIONAL',
        meaning: 'relative_score_band_not_validated_absolute_risk',
        approvedBy: null,
        operationalUseAllowed: false,
      });
      expect(model.experimentalRisk?.warnings).not.toHaveLength(0);
      expect(model.experimentalRisk?.lowUpperThreshold).toBeTypeOf('number');
    }
  });

  it('acepta bandas compactas en el detalle de reserva, el listado y el score explicado', () => {
    const detail = reservationDetailSchema.parse(detailFixture(MOCK_IDS.availableBoth));
    expect(detail.scores[0]?.experimentalRisk?.label).toBe('Medio (exploratorio)');
    expect(detail.scores[0]?.experimentalRisk).not.toHaveProperty('lowUpperThreshold');
    const list = reservationListSchema.parse(listFixture([MOCK_IDS.availableBoth]));
    expect(list.data[0]?.risk.experimentalRisk?.level).toBe('MEDIUM');
    for (const modelKey of [RF.key, XGB.key]) {
      const factors = riskFactorsSchema.parse(factorsFixture(MOCK_IDS.availableBoth, modelKey));
      expect(factors.persistedScore.experimentalRisk?.policyHash).toHaveLength(64);
      expect(factors.riskLevel).toBeNull();
    }
  });

  it('mantiene los scores v1 sin inventarles bandas', () => {
    const risk = riskAssessmentSchema.parse(riskFixture(MOCK_IDS.rfOnlyZero));
    expect(risk.models[0]).toMatchObject({
      scoringApiVersion: 'v1',
      experimentalRisk: null,
      experimentalRiskUnavailableReason: 'SCORED_WITHOUT_RESEARCH_POLICY',
      probabilityNoShow: 0,
      riskLevel: null,
    });
  });

  it('rechaza una banda completa incompleta y una supuesta aprobación operativa', () => {
    const risk = riskFixture(MOCK_IDS.availableBoth);
    const model = risk.models[0]!;
    const incomplete = { ...model.experimentalRisk };
    Reflect.deleteProperty(incomplete, 'lowUpperThreshold');
    expect(
      riskAssessmentSchema.safeParse({
        ...risk,
        models: [{ ...model, experimentalRisk: incomplete }],
      }).success,
    ).toBe(false);
    expect(
      riskAssessmentSchema.safeParse({
        ...risk,
        models: [
          {
            ...model,
            experimentalRisk: { ...model.experimentalRisk, operationalUseAllowed: true },
          },
        ],
      }).success,
    ).toBe(false);
  });
});
