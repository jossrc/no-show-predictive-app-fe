// @vitest-environment node
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { listReservations } from '@/features/reservations/api/reservations.server';
import { parseReservationListParams } from '@/features/reservations/model/list-query';

const BASE = 'http://fastify.test';
const server = setupServer();
let captured: URL | null = null;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => {
  vi.stubEnv('FRONTEND_DATA_MODE', 'live');
  vi.stubEnv('FASTIFY_API_BASE_URL', BASE);
  vi.stubEnv('FASTIFY_INTERNAL_API_KEY', 'clave-interna-de-prueba-0123456789-abcdef');
  captured = null;
  server.use(
    http.get(`${BASE}/api/v1/reservations`, ({ request }) => {
      captured = new URL(request.url);
      return HttpResponse.json(
        { error: { code: 'X', message: 'm' }, requestId: 'r' },
        { status: 503 },
      );
    }),
  );
});
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
});

async function sentParams(raw: Record<string, string>) {
  const { query } = parseReservationListParams(raw, '2026-10-11');
  await listReservations(query);
  return captured!.searchParams;
}

describe('Serialización de filtros hacia Fastify (HU-03)', () => {
  it.each(['LOW', 'MEDIUM', 'HIGH'])(
    'envía la banda %s y el modelo sin convertirlos en riesgo operativo',
    async (level) => {
      const params = await sentParams({
        experimentalRiskLevel: level,
        modelKey: 'xgboost_full_v1',
        sort: 'experimentalRisk',
      });
      expect(params.get('experimentalRiskLevel')).toBe(level);
      expect(params.get('modelKey')).toBe('xgboost_full_v1');
      expect(params.get('sort')).toBe('experimentalRisk');
      expect(params.has('riskLevel')).toBe(false);
    },
  );

  it('nunca envía riskLevel aunque la URL lo contenga', async () => {
    const params = await sentParams({ from: '2026-12-01', to: '2026-12-31', riskLevel: 'LOW' });
    expect(params.has('riskLevel')).toBe(false);
    expect(captured!.search).not.toContain('riskLevel');
  });

  it('nunca envía sort=riskLevel', async () => {
    const params = await sentParams({ from: '2026-12-01', to: '2026-12-31', sort: 'riskLevel' });
    expect(params.get('sort')).toBe('appointmentAt');
  });

  it('envía exactamente los parámetros admitidos, sin opcionales vacíos', async () => {
    const params = await sentParams({
      from: '2026-12-01',
      to: '2026-12-31',
      clinicId: '',
      cursor: '',
    });
    expect([...params.keys()].sort()).toEqual([
      'direction',
      'from',
      'limit',
      'modelKey',
      'sort',
      'status',
      'to',
    ]);
  });

  it('serializa fechas, estado, clínica, orden, modelo, límite y cursor', async () => {
    const params = await sentParams({
      from: '2026-12-01',
      to: '2026-12-31',
      status: 'CANCELLED',
      clinicId: '11',
      sort: 'probabilityNoShow',
      direction: 'desc',
      modelKey: 'xgboost_full_v1',
      limit: '50',
      cursor: 'opaque_CURSOR-1',
    });
    expect(Object.fromEntries(params)).toEqual({
      from: '2026-12-01',
      to: '2026-12-31',
      status: 'CANCELLED',
      clinicId: '11',
      sort: 'probabilityNoShow',
      direction: 'desc',
      modelKey: 'xgboost_full_v1',
      limit: '50',
      cursor: 'opaque_CURSOR-1',
    });
  });
});
