// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  attendanceStateSchema,
  recordAttendanceRequestSchema,
} from '@/features/operational-optimization/api/attendance.contract';
import {
  enableOverbookingRequestSchema,
  overbookingStateSchema,
} from '@/features/operational-optimization/api/overbooking.contract';
import { toRecordListParams } from '@/features/operational-optimization/api/records.contract';
import {
  recordSpaceRecoveryRequestSchema,
  spaceRecoveryStateSchema,
} from '@/features/operational-optimization/api/recovery.contract';
import { reservationListItemSchema } from '@/features/reservations/api/contract';
import { listItemFixture, MOCK_IDS } from '@/tests/support/fixtures';

const RUN = '00000000-0000-4000-8000-000000000001';

describe('Contratos de petición estrictos (sin coerción)', () => {
  it('HU-06 solo admite modelKey del contrato y predictionRunId UUID', () => {
    expect(
      enableOverbookingRequestSchema.safeParse({
        modelKey: 'xgboost_full_v1',
        predictionRunId: RUN,
      }).success,
    ).toBe(true);
    for (const body of [
      { modelKey: 'ensemble', predictionRunId: RUN },
      { modelKey: 'random_forest_full_v1', predictionRunId: 'run-mock-1' },
      { modelKey: 'random_forest_full_v1', predictionRunId: RUN, probability: 0.9 },
      { modelKey: 'random_forest_full_v1', predictionRunId: RUN, clinicId: 2 },
      { modelKey: 'random_forest_full_v1' },
    ]) {
      expect(enableOverbookingRequestSchema.safeParse(body).success).toBe(false);
    }
  });

  it('HU-07 solo ATTENDED/NO_SHOW (una cancelación no es un resultado)', () => {
    expect(
      recordAttendanceRequestSchema.safeParse({ attendanceStatus: 'NO_SHOW', predictionRunId: RUN })
        .success,
    ).toBe(true);
    for (const attendanceStatus of ['CANCELLED', 'no_show', ['NO_SHOW'], null]) {
      expect(
        recordAttendanceRequestSchema.safeParse({ attendanceStatus, predictionRunId: RUN }).success,
      ).toBe(false);
    }
  });

  it('HU-08 exige un booleano JSON: nunca "true", 1 ni null', () => {
    expect(recordSpaceRecoveryRequestSchema.safeParse({ spaceRecovered: false }).success).toBe(
      true,
    );
    expect(recordSpaceRecoveryRequestSchema.safeParse({ spaceRecovered: true }).success).toBe(true);
    for (const spaceRecovered of ['true', 'false', 1, 0, null, undefined]) {
      expect(recordSpaceRecoveryRequestSchema.safeParse({ spaceRecovered }).success).toBe(false);
    }
  });

  it('los listados persistidos no envían status ni modelKey', () => {
    expect(
      toRecordListParams({
        from: '2026-11-01',
        to: '2026-11-30',
        clinicId: '7',
        limit: 25,
        cursor: 'abc',
      }),
    ).toEqual({ from: '2026-11-01', to: '2026-11-30', clinicId: '7', limit: '25', cursor: 'abc' });
    expect(
      toRecordListParams({
        from: '2026-11-01',
        to: '2026-11-30',
        clinicId: null,
        limit: 10,
        cursor: null,
      }),
    ).toEqual({ from: '2026-11-01', to: '2026-11-30', limit: '10' });
  });
});

describe('Respuestas: null frente a false', () => {
  it('el listado de reservas acepta los resúmenes aditivos y null (almacén no disponible)', () => {
    const item = listItemFixture(MOCK_IDS.pastRecorded);
    expect(item.overbooking?.enabled).toBe(true);
    expect(item.spaceRecoveryOutcome).toEqual(
      expect.objectContaining({ recorded: true, spaceRecovered: false }),
    );
    const unavailable = {
      ...item,
      overbooking: null,
      attendanceOutcome: null,
      spaceRecoveryOutcome: null,
    };
    expect(reservationListItemSchema.safeParse(unavailable).success).toBe(true);
    const withoutField: Partial<typeof item> = { ...item };
    delete withoutField.overbooking;
    expect(reservationListItemSchema.safeParse(withoutField).success).toBe(false);
  });

  it('HU-08: spaceRecovered null (sin registro) y false (registrado) son estados distintos', () => {
    const base = {
      reservationId: MOCK_IDS.pastFinished,
      outcome: null,
      preventiveAction: { enabled: true, authorizationId: '1' },
      blocker: null,
    };
    expect(
      spaceRecoveryStateSchema.parse({
        ...base,
        recorded: false,
        spaceRecovered: null,
        registrable: true,
      }).spaceRecovered,
    ).toBeNull();
    expect(
      spaceRecoveryStateSchema.safeParse({
        ...base,
        recorded: false,
        spaceRecovered: 'false',
        registrable: true,
      }).success,
    ).toBe(false);
  });

  it('rechaza bloqueos y reglas fuera del contrato', () => {
    const attendance = {
      reservationId: MOCK_IDS.pastFinished,
      recorded: false,
      attendanceStatus: null,
      outcome: null,
      registration: {
        ruleVersion: 'appointment_finished_rule_v1',
        registrable: false,
        blocker: 'APPOINTMENT_NOT_STARTED',
        availablePredictionRunIds: [RUN],
      },
    };
    expect(attendanceStateSchema.safeParse(attendance).success).toBe(true);
    expect(
      attendanceStateSchema.safeParse({
        ...attendance,
        registration: { ...attendance.registration, blocker: 'CUSTOM' },
      }).success,
    ).toBe(false);
    expect(
      overbookingStateSchema.safeParse({
        reservationId: '1',
        enabled: false,
        status: 'NOT_ENABLED',
        statusLabel: 'No habilitado',
        authorization: null,
        eligibility: { ruleVersion: 'otra_regla', eligible: true, reasons: [], candidates: [] },
      }).success,
    ).toBe(false);
  });
});
