// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  requestReservationPrediction: vi.fn(),
  getRiskFactors: vi.fn(),
  getClientHistory: vi.fn(),
}));

vi.mock('next/cache', () => ({ refresh: mocks.refresh }));
vi.mock('@/features/reservation-risk/api/risk.server', () => ({
  requestReservationPrediction: mocks.requestReservationPrediction,
  getRiskFactors: mocks.getRiskFactors,
}));
vi.mock('@/features/client-history/api/history.server', () => ({
  getClientHistory: mocks.getClientHistory,
}));

const { loadClientHistoryAction } = await import('@/features/client-history/api/history.actions');
const { loadRiskFactorsAction, requestPredictionAction } =
  await import('@/features/reservation-risk/api/risk.actions');
const { httpError, MOCK_IDS, ok, riskFixture } = await import('@/tests/support/fixtures');

const run = (replayed: boolean) => ({
  ...riskFixture(MOCK_IDS.availableBoth),
  run: {
    predictionRunId: replayed ? null : 'run-1',
    replayed,
    requestedModelKeys: ['random_forest_full_v1'],
    snapshotCreated: !replayed,
  },
  featureWarnings: [],
});

beforeEach(() => vi.clearAllMocks());

describe('Server Action de predicción (HU-02)', () => {
  it.each([
    ['abc', { mode: 'compare' }],
    ['0123', { mode: 'compare' }],
    [MOCK_IDS.notScored, { mode: 'compare', modelKey: 'random_forest_full_v1' }],
    [MOCK_IDS.notScored, { mode: 'single' }],
    [MOCK_IDS.notScored, { mode: 'single', modelKey: 'otro_modelo' }],
  ])('rechaza entradas inválidas (%s) sin contactar al backend', async (id, body) => {
    const result = await requestPredictionAction(id, body);
    expect(!result.ok && result.error.code).toBe('INVALID_INPUT');
    expect(mocks.requestReservationPrediction).not.toHaveBeenCalled();
  });

  it('201: informa la creación y actualiza la ruta', async () => {
    mocks.requestReservationPrediction.mockResolvedValue(ok(run(false), 201));
    const result = await requestPredictionAction(MOCK_IDS.notScored, {
      mode: 'single',
      modelKey: 'random_forest_full_v1',
    });
    expect(result.ok && result.data).toMatchObject({ created: true, replayed: false });
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it('200 idempotente: respeta run.replayed', async () => {
    mocks.requestReservationPrediction.mockResolvedValue(ok(run(true), 200));
    const result = await requestPredictionAction(MOCK_IDS.availableBoth, { mode: 'compare' });
    expect(result.ok && result.data).toMatchObject({ created: false, replayed: true });
  });

  it('un error no refresca la ruta ni se reintenta', async () => {
    mocks.requestReservationPrediction.mockResolvedValue(httpError(504, 'ML_TIMEOUT'));
    const result = await requestPredictionAction(MOCK_IDS.notScored, { mode: 'compare' });
    expect(!result.ok && result.error.code).toBe('ML_TIMEOUT');
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(mocks.requestReservationPrediction).toHaveBeenCalledTimes(1);
  });
});

describe('Server Actions de lectura (HU-05/HU-06)', () => {
  it('valida modelo y topK de la explicación', async () => {
    expect(
      (await loadRiskFactorsAction(MOCK_IDS.availableBoth, 'random_forest_full_v1', 11)).ok,
    ).toBe(false);
    expect((await loadRiskFactorsAction(MOCK_IDS.availableBoth, 'otro', 5)).ok).toBe(false);
    expect(mocks.getRiskFactors).not.toHaveBeenCalled();
    mocks.getRiskFactors.mockResolvedValue(httpError(409, 'EXPLANATION_SNAPSHOT_UNAVAILABLE'));
    await loadRiskFactorsAction(MOCK_IDS.availableBoth, 'xgboost_full_v1', 5);
    expect(mocks.getRiskFactors).toHaveBeenCalledWith(MOCK_IDS.availableBoth, 'xgboost_full_v1', 5);
  });

  it('valida el modo del historial', async () => {
    expect((await loadClientHistoryAction(MOCK_IDS.availableBoth, 'todo')).ok).toBe(false);
    mocks.getClientHistory.mockResolvedValue(httpError(503, 'SOURCE_DATA_UNAVAILABLE'));
    await loadClientHistoryAction(MOCK_IDS.availableBoth, 'current_known');
    expect(mocks.getClientHistory).toHaveBeenCalledWith(MOCK_IDS.availableBoth, 'current_known');
  });
});
