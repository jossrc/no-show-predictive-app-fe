// @vitest-environment node
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  enableOverbooking,
  getAttendanceState,
  getOverbookingState,
  getSpaceRecoveryState,
  listAttendanceOutcomes,
  listOverbookingAuthorizations,
  listSpaceRecoveryOutcomes,
  recordAttendance,
  recordSpaceRecovery,
} from '@/features/operational-optimization/api/operational.server';
import {
  attendanceFixture,
  MOCK_IDS,
  overbookingFixture,
  recoveryFixture,
} from '@/tests/support/fixtures';

const BASE = 'http://fastify.test';
const API_KEY = 'clave-interna-de-prueba-super-secreta-0123456789';
const ID = MOCK_IDS.pastRecorded;
const RUN = '00000000-0000-4000-8000-000000000001';
const server = setupServer();
const LIST_QUERY = { from: '2026-11-01', to: '2026-11-30', clinicId: '7', limit: 10, cursor: 'c1' };

interface Captured {
  method: string;
  path: string;
  search: URLSearchParams;
  apiKey: string | null;
  body: unknown;
}
let captured: Captured | null = null;

function capture(status: number, body: Record<string, unknown>) {
  return async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    captured = {
      method: request.method,
      path: url.pathname,
      search: url.searchParams,
      apiKey: request.headers.get('x-api-key'),
      body: request.method === 'POST' ? await request.json() : null,
    };
    return HttpResponse.json(body, { status });
  };
}

const page = (data: unknown[]) => ({
  data,
  pagination: { limit: 10, nextCursor: null },
  period: {
    from: '2026-11-01',
    to: '2026-11-30',
    timeZone: 'America/Lima',
    startInclusive: '2026-11-01T05:00:00.000Z',
    endExclusive: '2026-12-01T05:00:00.000Z',
  },
  requestId: 'req-list',
});
const errorBody = (code: string, details?: Record<string, unknown>) => ({
  error: { code, message: 'Mensaje público', ...(details ? { details } : {}) },
  requestId: 'req-error',
});

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  captured = null;
});
afterAll(() => server.close());
beforeEach(() => {
  vi.stubEnv('FRONTEND_DATA_MODE', 'live');
  vi.stubEnv('FASTIFY_API_BASE_URL', BASE);
  vi.stubEnv('FASTIFY_INTERNAL_API_KEY', API_KEY);
});
afterEach(() => vi.unstubAllEnvs());

describe('HTTP operativo · rutas exactas, métodos y credencial de servidor', () => {
  it.each([
    ['overbooking-authorization', () => getOverbookingState(ID), overbookingFixture(ID)],
    ['attendance-outcome', () => getAttendanceState(ID), attendanceFixture(ID)],
    ['space-recovery-outcome', () => getSpaceRecoveryState(ID), recoveryFixture(ID)],
  ] as const)('GET …/%s valida la respuesta', async (suffix, call, data) => {
    server.use(
      http.get(
        `${BASE}/api/v1/reservations/${ID}/${suffix}`,
        capture(200, { data, requestId: 'r' }),
      ),
    );
    const result = await call();
    expect(result.ok && result.data).toEqual(data);
    expect(captured).toMatchObject({ method: 'GET', apiKey: API_KEY, body: null });
  });

  it.each([
    [
      '/api/v1/overbooking-authorizations',
      listOverbookingAuthorizations,
      overbookingFixture(ID).authorization,
    ],
    ['/api/v1/attendance-outcomes', listAttendanceOutcomes, attendanceFixture(ID).outcome],
    ['/api/v1/space-recovery-outcomes', listSpaceRecoveryOutcomes, recoveryFixture(ID).outcome],
  ] as const)(
    'GET %s envía from/to/clinicId/limit/cursor (sin status)',
    async (path, call, item) => {
      server.use(http.get(`${BASE}${path}`, capture(200, page([item]))));
      const result = await call(LIST_QUERY);
      expect(result.ok && result.data.data).toHaveLength(1);
      expect(Object.fromEntries(captured!.search)).toEqual({
        from: '2026-11-01',
        to: '2026-11-30',
        clinicId: '7',
        limit: '10',
        cursor: 'c1',
      });
      expect(captured!.apiKey).toBe(API_KEY);
    },
  );

  it('POST de HU-06/07/08 con cuerpos exactos (booleano JSON en HU-08)', async () => {
    const authorization = overbookingFixture(ID).authorization!;
    const attendance = attendanceFixture(ID).outcome!;
    const recovery = recoveryFixture(ID).outcome!;
    server.use(
      http.post(
        `${BASE}/api/v1/reservations/${ID}/overbooking-authorizations`,
        capture(201, {
          data: { ...authorization, enabled: true, replayed: false },
          requestId: 'r',
        }),
      ),
    );
    const enabled = await enableOverbooking(ID, {
      modelKey: 'xgboost_full_v1',
      predictionRunId: RUN,
    });
    expect(enabled.ok && enabled.status).toBe(201);
    expect(captured).toMatchObject({
      method: 'POST',
      body: { modelKey: 'xgboost_full_v1', predictionRunId: RUN },
      apiKey: API_KEY,
    });

    server.use(
      http.post(
        `${BASE}/api/v1/reservations/${ID}/attendance-outcomes`,
        capture(200, { data: { ...attendance, replayed: true }, requestId: 'r' }),
      ),
    );
    const recorded = await recordAttendance(ID, {
      attendanceStatus: 'NO_SHOW',
      predictionRunId: RUN,
    });
    expect(recorded.ok && [recorded.status, recorded.data.replayed]).toEqual([200, true]);
    expect(captured!.body).toEqual({ attendanceStatus: 'NO_SHOW', predictionRunId: RUN });

    server.use(
      http.post(
        `${BASE}/api/v1/reservations/${ID}/space-recovery-outcomes`,
        capture(201, { data: { ...recovery, replayed: false }, requestId: 'r' }),
      ),
    );
    const saved = await recordSpaceRecovery(ID, { spaceRecovered: false });
    expect(saved.ok && saved.data.spaceRecovered).toBe(false);
    expect(captured!.body).toStrictEqual({ spaceRecovered: false });
  });
});

describe('HTTP operativo · errores tipados (nunca listas vacías)', () => {
  it.each([
    [400, 'REQUEST_VALIDATION_ERROR'],
    [401, 'UNAUTHORIZED'],
    [404, 'RESERVATION_NOT_FOUND'],
    [503, 'PERSISTENCE_UNAVAILABLE'],
  ])('GET de estado %i → %s', async (status, code) => {
    server.use(
      http.get(`${BASE}/api/v1/reservations/${ID}/attendance-outcome`, () =>
        HttpResponse.json(errorBody(code), { status }),
      ),
    );
    const result = await getAttendanceState(ID);
    expect(!result.ok && [result.error.status, result.error.code, result.error.requestId]).toEqual([
      status,
      code,
      'req-error',
    ]);
  });

  it.each(['INVALID_PERIOD', 'UNKNOWN_CLINIC', 'INVALID_CURSOR'])(
    'listado 422 %s',
    async (code) => {
      server.use(
        http.get(`${BASE}/api/v1/space-recovery-outcomes`, () =>
          HttpResponse.json(errorBody(code), { status: 422 }),
        ),
      );
      const result = await listSpaceRecoveryOutcomes(LIST_QUERY);
      expect(!result.ok && result.error.code).toBe(code);
    },
  );

  it('409 conserva el código y los motivos de no elegibilidad', async () => {
    server.use(
      http.post(`${BASE}/api/v1/reservations/${ID}/overbooking-authorizations`, () =>
        HttpResponse.json(
          errorBody('OVERBOOKING_NOT_ELIGIBLE', {
            reasons: [{ code: 'PREDICTION_NOT_LATEST', message: 'Vuelva a consultar' }],
          }),
          { status: 409 },
        ),
      ),
    );
    const result = await enableOverbooking(ID, {
      modelKey: 'random_forest_full_v1',
      predictionRunId: RUN,
    });
    expect(!result.ok && result.error).toMatchObject({
      status: 409,
      code: 'OVERBOOKING_NOT_ELIGIBLE',
      reasons: [{ code: 'PREDICTION_NOT_LATEST', message: 'Vuelva a consultar' }],
    });
  });

  it('una respuesta fuera de contrato es INVALID_RESPONSE (p. ej. spaceRecovered como texto)', async () => {
    const state = { ...recoveryFixture(ID), spaceRecovered: 'false' };
    server.use(
      http.get(`${BASE}/api/v1/reservations/${ID}/space-recovery-outcome`, () =>
        HttpResponse.json({ data: state, requestId: 'r' }),
      ),
    );
    const result = await getSpaceRecoveryState(ID);
    expect(!result.ok && result.error.code).toBe('INVALID_RESPONSE');
  });

  it('un identificador no decimal nunca llega al backend', async () => {
    await expect(getOverbookingState('../ml/models')).rejects.toThrow(RangeError);
    expect(captured).toBeNull();
  });
});
