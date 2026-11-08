import { describe, expect, it } from 'vitest';

import type { AttendanceState } from '@/features/operational-optimization/api/attendance.contract';
import type { SpaceRecoveryState } from '@/features/operational-optimization/api/recovery.contract';
import { toHighRiskRowView } from '@/features/operational-optimization/model/high-risk-view';
import { formatSpaceRecovered } from '@/features/operational-optimization/model/labels';
import {
  attendanceMode,
  recoveryMode,
  toComparisonViews,
} from '@/features/operational-optimization/model/outcome-view';
import {
  canEnableOverbooking,
  ineligibilityReasons,
  overbookingMark,
} from '@/features/operational-optimization/model/overbooking-view';
import { attendanceRunChoices } from '@/features/operational-optimization/model/runs';
import {
  toAuthorizationRow,
  toRecoveryRow,
} from '@/features/operational-optimization/model/tracking-view';
import {
  attendanceFixture,
  listItemFixture,
  MOCK_IDS,
  overbookingFixture,
  recoveryFixture,
} from '@/tests/support/fixtures';

describe('HU-06 · presentación de la marca', () => {
  it('null es «no disponible»; enabled=false es «No habilitado»', () => {
    expect(overbookingMark(null)).toEqual({
      mark: 'unavailable',
      label: 'Estado de gestión no disponible',
    });
    expect(overbookingMark(listItemFixture(MOCK_IDS.highBoth).overbooking).label).toBe(
      'No habilitado',
    );
    expect(overbookingMark(listItemFixture(MOCK_IDS.enabledFuture).overbooking).label).toBe(
      'Habilitado para sobreasignación',
    );
  });

  it('solo es habilitable si el backend dice eligible=true con un candidato elegible', () => {
    expect(canEnableOverbooking(overbookingFixture(MOCK_IDS.highBoth))).toBe(true);
    expect(canEnableOverbooking(overbookingFixture(MOCK_IDS.enabledFuture))).toBe(false);
    const medium = overbookingFixture(MOCK_IDS.availableBoth);
    expect(canEnableOverbooking(medium)).toBe(false);
    expect(ineligibilityReasons(medium)).toEqual([
      'Random Forest: La banda experimental de la predicción no es Alta',
      'XGBoost: La banda experimental de la predicción no es Alta',
    ]);
    const forged = { ...medium, eligibility: { ...medium.eligibility, eligible: true } };
    expect(canEnableOverbooking(forged)).toBe(false);
  });

  it('las motivos de reserva cancelada vienen del backend, sin reinterpretarlos', () => {
    expect(ineligibilityReasons(overbookingFixture(MOCK_IDS.cancelled))).toContain(
      'La reserva no está programada (cancelada o pasada)',
    );
  });

  it('la fila de alto riesgo usa solo el modelo elegido y la hora de Lima', () => {
    const row = toHighRiskRowView(listItemFixture(MOCK_IDS.highBoth), {
      modelKey: 'random_forest_full_v1',
      backHref: '/operational-optimization?from=2026-10-04&to=2026-10-31',
    });
    expect(row.bandLabel).toBe('Alto (exploratorio)');
    expect(row.estimateText).toBe('Random Forest · 69.76 %');
    expect(row.time).toBe('10:00 a. m.');
    expect(row.detailHref).toContain('back=%2Foperational-optimization');
  });
});

describe('HU-07 · asistencia y comparación', () => {
  it('sin registro y no registrable no ofrece formulario', () => {
    expect(attendanceMode(attendanceFixture(MOCK_IDS.highBoth))).toBe('blocked');
    expect(attendanceMode(attendanceFixture(MOCK_IDS.pastFinished))).toBe('form');
    expect(attendanceMode(attendanceFixture(MOCK_IDS.pastRecorded))).toBe('recorded');
    const noRuns: AttendanceState = {
      ...attendanceFixture(MOCK_IDS.pastFinished),
      registration: {
        ...attendanceFixture(MOCK_IDS.pastFinished).registration,
        availablePredictionRunIds: [],
      },
    };
    expect(attendanceMode(noRuns)).toBe('blocked');
  });

  it('usa las comparaciones guardadas por modelo, sin recalcular', () => {
    const outcome = attendanceFixture(MOCK_IDS.pastRecorded).outcome!;
    const forged = outcome.comparisons.map((item) => ({ ...item, matchesPrediction: false }));
    expect(toComparisonViews(forged).map((view) => view.matchText)).toEqual([
      'No coincidió',
      'No coincidió',
    ]);
    const views = toComparisonViews([...outcome.comparisons].reverse());
    expect(views.map((view) => view.label)).toEqual(['Random Forest', 'XGBoost']);
    expect(views[0]).toMatchObject({ thresholdText: '50.00 %', probabilityText: '69.00 %' });
  });

  it('las opciones de run provienen exclusivamente de availablePredictionRunIds', () => {
    const choices = attendanceRunChoices(
      ['00000000-0000-4000-8100-000000001015', 'desconocido'],
      [
        {
          predictionRunId: '00000000-0000-4000-8100-000000001015',
          scoredAt: '2026-10-27T14:00:00.000Z',
          models: [
            {
              modelKey: 'random_forest_full_v1',
              label: 'Random Forest',
              percentageText: '31.00 %',
            },
          ],
        },
        {
          predictionRunId: 'no-disponible',
          scoredAt: '2026-10-27T14:00:00.000Z',
          models: [],
        },
      ],
    );
    expect(choices.map((choice) => choice.predictionRunId)).toEqual([
      '00000000-0000-4000-8100-000000001015',
      'desconocido',
    ]);
    expect(choices[0]?.label).toBe('Random Forest 31.00 % (27 oct. 2026 · 9:00 a. m.)');
    expect(choices[1]?.label).toBe('Estimación registrada 2');
  });
});

describe('HU-08 · espacio recuperado', () => {
  it('true, false y null tienen textos distintos', () => {
    expect(formatSpaceRecovered(true)).toBe('Recuperado');
    expect(formatSpaceRecovered(false)).toBe('No recuperado');
    expect(formatSpaceRecovered(null)).toBe('Sin registro');
  });

  it('sin habilitación HU-06 explica el motivo; no depende de HU-07', () => {
    expect(recoveryMode(recoveryFixture(MOCK_IDS.pastNotEnabled))).toBe('requires_overbooking');
    expect(recoveryMode(recoveryFixture(MOCK_IDS.enabledFuture))).toBe('form');
    expect(recoveryMode(recoveryFixture(MOCK_IDS.pastRecorded))).toBe('recorded');
    const inconsistent: SpaceRecoveryState = {
      ...recoveryFixture(MOCK_IDS.enabledFuture),
      registrable: false,
    };
    expect(recoveryMode(inconsistent)).toBe('blocked');
  });

  it('los listados muestran «No recuperado» para false y fechas en Lima', () => {
    const recovery = recoveryFixture(MOCK_IDS.pastRecorded).outcome!;
    expect(toRecoveryRow(recovery, '/operational-optimization?x=1').resultLabel).toBe(
      'No recuperado',
    );
    const authorization = overbookingFixture(MOCK_IDS.pastRecorded).authorization!;
    const row = toAuthorizationRow(authorization, '/operational-optimization?x=1');
    expect(row.estimateText).toBe('Alto · XGBoost 92.00 %');
    expect(row.time).toBe('3:00 p. m.');
  });
});
