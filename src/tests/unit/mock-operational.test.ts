// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';

import {
  attendanceOutcomeListSchema,
  attendanceStateEnvelopeSchema,
  recordAttendanceResponseSchema,
} from '@/features/operational-optimization/api/attendance.contract';
import {
  enableOverbookingResponseSchema,
  overbookingAuthorizationListSchema,
  overbookingStateEnvelopeSchema,
} from '@/features/operational-optimization/api/overbooking.contract';
import {
  recordSpaceRecoveryResponseSchema,
  spaceRecoveryOutcomeListSchema,
  spaceRecoveryStateEnvelopeSchema,
} from '@/features/operational-optimization/api/recovery.contract';
import { reservationDetailEnvelopeSchema } from '@/features/reservations/api/contract';
import {
  MOCK_IDS,
  MOCK_RESERVATIONS,
  mockRunId,
} from '@/tests/mocks/fastify/fixtures/reservations';
import { resetOperationalStore } from '@/tests/mocks/fastify/operational-store';
import { mockFastifyTransport } from '@/tests/mocks/fastify/transport';

const call = async (path: string, init: RequestInit = {}) => {
  const response = await mockFastifyTransport(new URL(path, 'http://fastify.mock'), {
    ...init,
    headers: { 'x-api-key': 'k' },
  });
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
};
const post = (path: string, body: unknown) =>
  call(path, { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });
const base = (id: string) => `/api/v1/reservations/${id}`;
const PERIOD = 'from=2026-10-01&to=2026-12-31';

beforeEach(() => resetOperationalStore());

describe('Backend simulado de Sprint 02 · coherencia con los contratos', () => {
  it('los tres GET por reserva validan para todas las reservas sintéticas', async () => {
    for (const reservation of MOCK_RESERVATIONS.filter(
      (item) => item.id !== MOCK_IDS.partialErrors,
    )) {
      const id = reservation.id;
      expect(
        overbookingStateEnvelopeSchema.safeParse(
          (await call(`${base(id)}/overbooking-authorization`)).body,
        ).success,
      ).toBe(true);
      expect(
        attendanceStateEnvelopeSchema.safeParse((await call(`${base(id)}/attendance-outcome`)).body)
          .success,
      ).toBe(true);
      expect(
        spaceRecoveryStateEnvelopeSchema.safeParse(
          (await call(`${base(id)}/space-recovery-outcome`)).body,
        ).success,
      ).toBe(true);
    }
    expect((await call(`${base(MOCK_IDS.partialErrors)}/attendance-outcome`)).status).toBe(503);
  });

  it('los tres listados validan, ordenan por cita y rechazan status', async () => {
    const lists = [
      ['/api/v1/overbooking-authorizations', overbookingAuthorizationListSchema],
      ['/api/v1/attendance-outcomes', attendanceOutcomeListSchema],
      ['/api/v1/space-recovery-outcomes', spaceRecoveryOutcomeListSchema],
    ] as const;
    for (const [path, schema] of lists) {
      expect(schema.safeParse((await call(`${path}?${PERIOD}`)).body).success).toBe(true);
      expect((await call(`${path}?${PERIOD}&status=SCHEDULED`)).status).toBe(400);
      expect((await call(`${path}?from=2026-01-01&to=2026-12-31`)).status).toBe(422);
      expect((await call(`${path}?${PERIOD}&cursor=bad`)).status).toBe(422);
    }
    const first = await call(`/api/v1/overbooking-authorizations?${PERIOD}&limit=1`);
    const cursor = (first.body.pagination as { nextCursor: string }).nextCursor;
    expect(cursor).toEqual(expect.any(String));
    expect((await call(`/api/v1/attendance-outcomes?${PERIOD}&cursor=${cursor}`)).status).toBe(422);
  });
});

describe('Backend simulado de Sprint 02 · persistencia en memoria', () => {
  it('HU-06: 201 → GET habilitado → 200 replayed → 409 con otra predicción', async () => {
    const id = MOCK_IDS.highBoth;
    const body = { modelKey: 'xgboost_full_v1', predictionRunId: mockRunId(id) };
    const created = await post(`${base(id)}/overbooking-authorizations`, body);
    expect(created.status).toBe(201);
    expect(enableOverbookingResponseSchema.safeParse(created.body).success).toBe(true);
    const state = await call(`${base(id)}/overbooking-authorization`);
    expect(state.body.data).toMatchObject({
      enabled: true,
      statusLabel: 'Habilitado para sobreasignación',
    });
    const detail = await call(base(id));
    expect(reservationDetailEnvelopeSchema.parse(detail.body).data.overbooking?.enabled).toBe(true);
    expect((await post(`${base(id)}/overbooking-authorizations`, body)).status).toBe(200);
    const other = { modelKey: 'random_forest_full_v1', predictionRunId: mockRunId(id) };
    const conflict = await post(`${base(id)}/overbooking-authorizations`, other);
    expect([conflict.status, (conflict.body.error as { code: string }).code]).toEqual([
      409,
      'OVERBOOKING_ALREADY_ENABLED_CONFLICT',
    ]);
  });

  it('HU-06 rechaza no elegibles, runs ajenos y cuerpos no estrictos', async () => {
    const run = mockRunId(MOCK_IDS.highRfOnly);
    const notHigh = await post(`${base(MOCK_IDS.highRfOnly)}/overbooking-authorizations`, {
      modelKey: 'xgboost_full_v1',
      predictionRunId: run,
    });
    expect((notHigh.body.error as { code: string }).code).toBe('OVERBOOKING_NOT_ELIGIBLE');
    const mismatch = await post(`${base(MOCK_IDS.highRfOnly)}/overbooking-authorizations`, {
      modelKey: 'random_forest_full_v1',
      predictionRunId: mockRunId(MOCK_IDS.highBoth),
    });
    expect((mismatch.body.error as { code: string }).code).toBe('PREDICTION_RESERVATION_MISMATCH');
    const extra = await post(`${base(MOCK_IDS.highRfOnly)}/overbooking-authorizations`, {
      modelKey: 'random_forest_full_v1',
      predictionRunId: run,
      riskLevel: 'HIGH',
    });
    expect(extra.status).toBe(400);
  });

  it('HU-07: bloqueo antes de la cita, 201 después y 409 si cambia el valor', async () => {
    const future = await post(`${base(MOCK_IDS.highBoth)}/attendance-outcomes`, {
      attendanceStatus: 'NO_SHOW',
      predictionRunId: mockRunId(MOCK_IDS.highBoth),
    });
    expect((future.body.error as { code: string }).code).toBe('APPOINTMENT_NOT_FINISHED');
    const body = {
      attendanceStatus: 'ATTENDED',
      predictionRunId: mockRunId(MOCK_IDS.pastFinished),
    };
    const created = await post(`${base(MOCK_IDS.pastFinished)}/attendance-outcomes`, body);
    expect(created.status).toBe(201);
    const outcome = recordAttendanceResponseSchema.parse(created.body).data;
    expect(outcome.comparisons.map((item) => [item.modelKey, item.matchesPrediction])).toEqual([
      ['random_forest_full_v1', false],
      ['xgboost_full_v1', true],
    ]);
    const conflict = await post(`${base(MOCK_IDS.pastFinished)}/attendance-outcomes`, {
      ...body,
      attendanceStatus: 'NO_SHOW',
    });
    expect((conflict.body.error as { code: string }).code).toBe(
      'ATTENDANCE_ALREADY_RECORDED_CONFLICT',
    );
  });

  it('HU-08: requiere HU-06, no requiere HU-07 y guarda false como registro', async () => {
    const blocked = await post(`${base(MOCK_IDS.pastNotEnabled)}/space-recovery-outcomes`, {
      spaceRecovered: true,
    });
    expect((blocked.body.error as { code: string }).code).toBe('PREVENTIVE_ACTION_REQUIRED');
    expect(
      (
        await post(
          `${base(MOCK_IDS.enabledFuture)}/space-recovery-outcomes`,
          '{"spaceRecovered":"false"}',
        )
      ).status,
    ).toBe(400);
    const saved = await post(`${base(MOCK_IDS.enabledFuture)}/space-recovery-outcomes`, {
      spaceRecovered: false,
    });
    expect(recordSpaceRecoveryResponseSchema.parse(saved.body).data.spaceRecovered).toBe(false);
    const state = await call(`${base(MOCK_IDS.enabledFuture)}/space-recovery-outcome`);
    expect(state.body.data).toMatchObject({
      recorded: true,
      spaceRecovered: false,
      registrable: false,
    });
    const attendance = await call(`${base(MOCK_IDS.enabledFuture)}/attendance-outcome`);
    expect(attendance.body.data).toMatchObject({ recorded: false });
  });
});
