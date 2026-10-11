// @vitest-environment node
import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { getMlHealth } from '@/features/prediction-models/api/models.server';
import { requestReservationPrediction } from '@/features/reservation-risk/api/risk.server';
import { listReservations } from '@/features/reservations/api/reservations.server';
import { defaultFilters } from '@/features/reservations/model/list-query';
import { fastifyRequest } from '@/lib/api/fastify-client';
import { MOCK_IDS } from '@/tests/support/fixtures';

const BASE = 'http://fastify.test';
const API_KEY = 'clave-interna-de-prueba-super-secreta-0123456789';
const server = setupServer();
const query = { ...defaultFilters('2026-10-11'), cursor: null, trail: [] };

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
beforeEach(() => {
  vi.stubEnv('FRONTEND_DATA_MODE', 'live');
  vi.stubEnv('FASTIFY_API_BASE_URL', BASE);
  vi.stubEnv('FASTIFY_INTERNAL_API_KEY', API_KEY);
});
afterEach(() => vi.unstubAllEnvs());

const errorBody = (code: string, extra: Record<string, unknown> = {}) => ({
  error: { code, message: 'Mensaje público', ...extra },
  requestId: 'req-from-body',
});

describe('Cliente HTTP servidor-servidor', () => {
  it('envía la credencial solo al backend y valida una respuesta 200', async () => {
    let headers: Headers | null = null;
    server.use(
      http.get(`${BASE}/api/v1/ml/models`, ({ request }) => {
        headers = request.headers;
        return HttpResponse.json({ data: { ok: true }, requestId: 'req-200' });
      }),
    );
    const result = await fastifyRequest({
      path: '/api/v1/ml/models',
      schema: z.object({ data: z.object({ ok: z.boolean() }) }),
      timeoutMs: 1000,
    });
    expect(result).toEqual({
      ok: true,
      status: 200,
      data: { data: { ok: true } },
      requestId: 'req-200',
    });
    expect(headers!.get('x-api-key')).toBe(API_KEY);
    expect(headers!.get('accept')).toBe('application/json');
    expect(headers!.get('content-type')).toBeNull();
  });

  it('no envía la credencial al endpoint público de Health y acepta su 503 contractual', async () => {
    let apiKey: string | null = 'sin-leer';
    server.use(
      http.get(`${BASE}/api/v1/health/ml`, ({ request }) => {
        apiKey = request.headers.get('x-api-key');
        return HttpResponse.json(
          {
            service: 'ml',
            status: 'error',
            message: 'No listo',
            servingStatus: null,
            operationalUseAllowed: false,
          },
          { status: 503 },
        );
      }),
    );
    const result = await getMlHealth();
    expect(apiKey).toBeNull();
    expect(result.ok && result.data.status).toBe('error');
  });

  it('procesa un 201 del POST con Content-Type JSON', async () => {
    let contentType: string | null = null;
    let body: unknown = null;
    server.use(
      http.post(
        `${BASE}/api/v1/reservations/${MOCK_IDS.notScored}/predictions`,
        async ({ request }) => {
          contentType = request.headers.get('content-type');
          body = await request.json();
          return HttpResponse.json(errorBody('INCOMPLETO'), { status: 201 });
        },
      ),
    );
    const result = await requestReservationPrediction(MOCK_IDS.notScored, { mode: 'compare' });
    expect(contentType).toBe('application/json');
    expect(body).toEqual({ mode: 'compare' });
    // Un 201 con cuerpo incompatible no se acepta silenciosamente.
    expect(!result.ok && result.error.kind).toBe('invalid_response');
  });

  it('acepta un 204 sin cuerpo cuando el contrato lo contempla', async () => {
    server.use(http.get(`${BASE}/api/v1/empty`, () => new HttpResponse(null, { status: 204 })));
    const result = await fastifyRequest({
      path: '/api/v1/empty',
      schema: z.undefined(),
      timeoutMs: 1000,
    });
    expect(result.ok && result.status).toBe(204);
  });

  it.each([
    [400, 'REQUEST_VALIDATION_ERROR'],
    [401, 'UNAUTHORIZED'],
    [404, 'RESERVATION_NOT_FOUND'],
    [409, 'NOT_SCORABLE'],
    [422, 'INVALID_CURSOR'],
    [429, 'ML_RATE_LIMITED'],
    [502, 'ML_CONTRACT_VIOLATION'],
    [503, 'SOURCE_DATA_UNAVAILABLE'],
    [504, 'ML_TIMEOUT'],
  ])(
    'conserva el estado %i y el código %s sin convertirlo en datos vacíos',
    async (status, code) => {
      server.use(
        http.get(`${BASE}/api/v1/reservations`, () =>
          HttpResponse.json(errorBody(code), { status }),
        ),
      );
      const result = await listReservations(query);
      expect(result.ok).toBe(false);
      expect(!result.ok && result.error).toMatchObject({
        kind: 'http',
        status,
        code,
        requestId: 'req-from-body',
      });
    },
  );

  it('extrae motivos tipados y errores de validación', async () => {
    server.use(
      http.get(`${BASE}/api/v1/reservations`, () =>
        HttpResponse.json(
          errorBody('NOT_SCORABLE', {
            details: {
              reasons: [{ code: 'SCHEDULED_SERVICES_NOT_POINT_IN_TIME', message: 'Sin evidencia' }],
            },
            errors: [
              { field: 'from', code: 'format', message: 'Fecha inválida', source: 'querystring' },
            ],
          }),
          { status: 409 },
        ),
      ),
    );
    const result = await listReservations(query);
    expect(!result.ok && result.error.reasons).toEqual([
      { code: 'SCHEDULED_SERVICES_NOT_POINT_IN_TIME', message: 'Sin evidencia' },
    ]);
    expect(!result.ok && result.error.fieldErrors).toEqual([
      { field: 'from', message: 'Fecha inválida' },
    ]);
  });

  it('marca como incompatible un JSON malformado o una respuesta no JSON', async () => {
    server.use(
      http.get(
        `${BASE}/api/v1/reservations`,
        () =>
          new HttpResponse('{"data": [', {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
      ),
    );
    const malformed = await listReservations(query);
    expect(!malformed.ok && malformed.error.kind).toBe('invalid_response');

    server.use(
      http.get(`${BASE}/api/v1/reservations`, () =>
        HttpResponse.text('<html>Bad gateway</html>', { status: 502 }),
      ),
    );
    const html = await listReservations(query);
    expect(!html.ok && html.error).toMatchObject({ kind: 'http', status: 502, code: 'HTTP_502' });
  });

  it('rechaza respuestas con campos incompatibles con el contrato', async () => {
    server.use(
      http.get(`${BASE}/api/v1/reservations`, () =>
        HttpResponse.json({
          data: [{ reservationId: 123 }],
          pagination: { limit: 25, nextCursor: null },
        }),
      ),
    );
    const result = await listReservations(query);
    expect(!result.ok && result.error.code).toBe('INVALID_RESPONSE');
  });

  it('usa la cabecera x-request-id cuando el cuerpo no trae requestId, o null si no existe', async () => {
    server.use(
      http.get(`${BASE}/api/v1/reservations`, () =>
        HttpResponse.json(
          { error: { code: 'X', message: 'm' } },
          { status: 503, headers: { 'x-request-id': 'req-header' } },
        ),
      ),
    );
    const withHeader = await listReservations(query);
    expect(!withHeader.ok && withHeader.error.requestId).toBe('req-header');

    server.use(
      http.get(`${BASE}/api/v1/reservations`, () =>
        HttpResponse.json({ error: { code: 'X', message: 'm' } }, { status: 503 }),
      ),
    );
    const without = await listReservations(query);
    expect(!without.ok && without.error.requestId).toBeNull();
  });

  it('distingue error de red y timeout', async () => {
    server.use(http.get(`${BASE}/api/v1/reservations`, () => HttpResponse.error()));
    const network = await listReservations(query);
    expect(!network.ok && network.error.kind).toBe('network');

    server.use(
      http.get(`${BASE}/api/v1/slow`, async () => {
        await delay(300);
        return HttpResponse.json({});
      }),
    );
    const timeout = await fastifyRequest({
      path: '/api/v1/slow',
      schema: z.object({}),
      timeoutMs: 50,
    });
    expect(!timeout.ok && timeout.error).toMatchObject({ kind: 'timeout', code: 'TIMEOUT' });
  });

  it('rechaza la configuración sin credencial sin realizar llamadas', async () => {
    vi.stubEnv('FASTIFY_INTERNAL_API_KEY', '');
    const result = await listReservations(query);
    expect(!result.ok && result.error.kind).toBe('configuration');
  });

  it('rechaza el modo LIVE en producción mientras no exista autenticación', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const result = await listReservations(query);
    expect(!result.ok && result.error.message).toContain('HU-21/HU-22');
  });

  it('nunca incluye la credencial en los resultados devueltos a la interfaz', async () => {
    server.use(
      http.get(`${BASE}/api/v1/reservations`, () =>
        HttpResponse.json(errorBody('UNAUTHORIZED'), { status: 401 }),
      ),
    );
    const results = [
      await listReservations(query),
      await (async () => {
        server.use(http.get(`${BASE}/api/v1/reservations`, () => HttpResponse.error()));
        return listReservations(query);
      })(),
    ];
    for (const result of results) expect(JSON.stringify(result)).not.toContain(API_KEY);
  });
});
