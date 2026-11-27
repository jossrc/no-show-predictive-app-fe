// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  enableOverbooking: vi.fn(),
  recordAttendance: vi.fn(),
  recordSpaceRecovery: vi.fn(),
  getOverbookingState: vi.fn(),
  getAttendanceState: vi.fn(),
  getSpaceRecoveryState: vi.fn(),
  getReservationRisk: vi.fn(),
}));

vi.mock('next/cache', () => ({ refresh: mocks.refresh }));
vi.mock('@/features/operational-optimization/api/operational.server', () => ({
  enableOverbooking: mocks.enableOverbooking,
  recordAttendance: mocks.recordAttendance,
  recordSpaceRecovery: mocks.recordSpaceRecovery,
  getOverbookingState: mocks.getOverbookingState,
  getAttendanceState: mocks.getAttendanceState,
  getSpaceRecoveryState: mocks.getSpaceRecoveryState,
}));
vi.mock('@/features/reservation-risk/api/risk.server', () => ({
  getReservationRisk: mocks.getReservationRisk,
}));

const actions = await import('@/features/operational-optimization/api/operational.actions');
const fixtures = await import('@/tests/support/fixtures');
const { httpError, MOCK_IDS, ok } = fixtures;

const ID = MOCK_IDS.pastFinished;
const RUN = '00000000-0000-4000-8000-000000001013';

beforeEach(() => vi.clearAllMocks());

describe('Server Actions operativas · validación previa', () => {
  it.each([
    ['abc', { modelKey: 'random_forest_full_v1', predictionRunId: RUN }],
    [ID, { modelKey: 'random_forest_full_v1', predictionRunId: 'run-mock-1' }],
    [ID, { modelKey: 'random_forest_full_v1', predictionRunId: RUN, probability: 0.9 }],
    [ID, { modelKey: 'otro', predictionRunId: RUN }],
  ])('HU-06 rechaza %s / %o sin contactar al backend', async (id, body) => {
    const result = await actions.enableOverbookingAction(id, body);
    expect(!result.ok && result.error.code).toBe('INVALID_INPUT');
    expect(mocks.enableOverbooking).not.toHaveBeenCalled();
  });

  it.each([
    { attendanceStatus: 'CANCELLED', predictionRunId: RUN },
    { attendanceStatus: 'NO_SHOW', predictionRunId: 'x' },
    { attendanceStatus: 'NO_SHOW' },
  ])('HU-07 rechaza %o', async (body) => {
    expect((await actions.recordAttendanceAction(ID, body)).ok).toBe(false);
    expect(mocks.recordAttendance).not.toHaveBeenCalled();
  });

  it.each(['true', 1, null])('HU-08 rechaza spaceRecovered=%o (solo booleanos)', async (value) => {
    expect((await actions.recordSpaceRecoveryAction(ID, { spaceRecovered: value })).ok).toBe(false);
    expect(mocks.recordSpaceRecovery).not.toHaveBeenCalled();
  });

  it('las lecturas bajo demanda validan el identificador', async () => {
    expect((await actions.loadOverbookingStateAction('1; drop')).ok).toBe(false);
    const states = await actions.loadOutcomeStatesAction('x');
    expect([states.attendance.ok, states.recovery.ok, states.runs]).toEqual([false, false, []]);
    expect(mocks.getAttendanceState).not.toHaveBeenCalled();
  });
});

describe('Server Actions operativas · resultados y actualización', () => {
  const authorization = () => fixtures.overbookingFixture(MOCK_IDS.pastRecorded).authorization!;

  it('201 y 200 (replayed) son éxito y refrescan la ruta', async () => {
    mocks.enableOverbooking.mockResolvedValue(
      ok({ ...authorization(), enabled: true, replayed: false }, 201),
    );
    const created = await actions.enableOverbookingAction(ID, {
      modelKey: 'random_forest_full_v1',
      predictionRunId: RUN,
    });
    expect(created.ok && created.data).toMatchObject({ created: true, replayed: false });
    expect(mocks.enableOverbooking).toHaveBeenCalledWith(ID, {
      modelKey: 'random_forest_full_v1',
      predictionRunId: RUN,
    });

    mocks.recordSpaceRecovery.mockResolvedValue(
      ok({ ...fixtures.recoveryFixture(MOCK_IDS.pastRecorded).outcome!, replayed: true }, 200),
    );
    const replayed = await actions.recordSpaceRecoveryAction(ID, { spaceRecovered: false });
    expect(replayed.ok && replayed.data).toMatchObject({
      created: false,
      replayed: true,
      spaceRecovered: false,
    });
    expect(mocks.recordSpaceRecovery).toHaveBeenCalledWith(ID, { spaceRecovered: false });
    expect(mocks.refresh).toHaveBeenCalledTimes(2);
  });

  it.each([
    'OVERBOOKING_NOT_ELIGIBLE',
    'OVERBOOKING_ALREADY_ENABLED_CONFLICT',
    'PREDICTION_RESERVATION_MISMATCH',
  ])('409 %s relee el estado (refresh) sin reintentar el POST', async (code) => {
    mocks.enableOverbooking.mockResolvedValue(httpError(409, code));
    const result = await actions.enableOverbookingAction(ID, {
      modelKey: 'xgboost_full_v1',
      predictionRunId: RUN,
    });
    expect(!result.ok && result.error.code).toBe(code);
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(mocks.enableOverbooking).toHaveBeenCalledTimes(1);
  });

  it('503 no refresca ni reintenta; el timeout sí relee el estado', async () => {
    mocks.recordAttendance.mockResolvedValue(httpError(503, 'PERSISTENCE_UNAVAILABLE'));
    await actions.recordAttendanceAction(ID, {
      attendanceStatus: 'ATTENDED',
      predictionRunId: RUN,
    });
    expect(mocks.refresh).not.toHaveBeenCalled();
    mocks.recordAttendance.mockResolvedValue({
      ok: false,
      error: { ...httpError(504, 'TIMEOUT').error, kind: 'timeout', status: null },
    });
    await actions.recordAttendanceAction(ID, {
      attendanceStatus: 'ATTENDED',
      predictionRunId: RUN,
    });
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(mocks.recordAttendance).toHaveBeenCalledTimes(2);
  });

  it('carga los dos estados y describe los runs con la estimación visible', async () => {
    mocks.getAttendanceState.mockResolvedValue(ok(fixtures.attendanceFixture(ID)));
    mocks.getSpaceRecoveryState.mockResolvedValue(ok(fixtures.recoveryFixture(ID)));
    mocks.getReservationRisk.mockResolvedValue(ok(fixtures.riskFixture(ID)));
    const states = await actions.loadOutcomeStatesAction(ID);
    expect(states.attendance.ok && states.recovery.ok).toBe(true);
    expect(states.runs).toHaveLength(1);
    expect(states.runs[0]?.models.map((model) => model.label)).toEqual([
      'Random Forest',
      'XGBoost',
    ]);
  });
});
