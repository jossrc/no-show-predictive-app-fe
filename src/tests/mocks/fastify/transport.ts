import { ML_HEALTH, MODEL_CATALOG } from '@/tests/mocks/fastify/fixtures/support';
import { listMockReservations } from '@/tests/mocks/fastify/list';
import { handleReservationRoute } from '@/tests/mocks/fastify/reservation-routes';
import { mockData, mockError, type MockResponse } from '@/tests/mocks/fastify/responses';

/**
 * Backend Fastify SIMULADO para pruebas (`FRONTEND_DATA_MODE=mock`). Devuelve objetos
 * `Response` reales para ejercitar el mismo parseo y validación que el modo LIVE.
 * No realiza llamadas de red ni escribe en bases de datos.
 */
let requestCounter = 0;

function route(method: string, url: URL, headers: Headers, body: string | null): MockResponse {
  if (url.pathname === '/api/v1/health/ml') return { status: 200, body: ML_HEALTH };
  if (!headers.get('x-api-key')) return mockError(401, 'UNAUTHORIZED', 'Autenticación requerida');

  const now = new Date();
  if (method === 'GET' && url.pathname === '/api/v1/ml/models') return mockData(MODEL_CATALOG);
  if (method === 'GET' && url.pathname === '/api/v1/reservations') {
    return listMockReservations(url.searchParams, now);
  }
  return handleReservationRoute(method, url, body, now);
}

export async function mockFastifyTransport(url: URL, init: RequestInit): Promise<Response> {
  const requestId = `mock-req-${++requestCounter}`;
  const body = typeof init.body === 'string' ? init.body : null;
  const result = route(init.method ?? 'GET', url, new Headers(init.headers), body);
  const isHealth = url.pathname === '/api/v1/health/ml';
  const payload = result.body ? { ...result.body, ...(isHealth ? {} : { requestId }) } : undefined;
  return new Response(payload ? JSON.stringify(payload) : null, {
    status: result.status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'x-request-id': requestId },
  });
}
