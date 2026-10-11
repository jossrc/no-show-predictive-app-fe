// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { clientHistoryEnvelopeSchema } from '@/features/client-history/api/contract';
import {
  mlHealthSchema,
  modelCatalogEnvelopeSchema,
} from '@/features/prediction-models/api/contract';
import { riskFactorsEnvelopeSchema } from '@/features/reservation-risk/api/factors.contract';
import {
  predictionResponseEnvelopeSchema,
  riskAssessmentEnvelopeSchema,
} from '@/features/reservation-risk/api/risk.contract';
import {
  reservationDetailEnvelopeSchema,
  reservationListSchema,
} from '@/features/reservations/api/contract';
import { isLoopbackHost } from '@/lib/security/loopback-host';
import { MOCK_IDS, MOCK_RESERVATIONS } from '@/tests/mocks/fastify/fixtures/reservations';
import { mockFastifyTransport } from '@/tests/mocks/fastify/transport';

const call = async (path: string, init: RequestInit = {}) => {
  const response = await mockFastifyTransport(new URL(path, 'http://fastify.mock'), {
    ...init,
    headers: { 'x-api-key': 'k', ...(init.headers as Record<string, string>) },
  });
  return { status: response.status, body: (await response.json()) as unknown };
};

describe('Backend simulado: coherencia con los contratos', () => {
  it('las respuestas exitosas validan contra los schemas del cliente', async () => {
    expect(
      reservationListSchema.safeParse(
        (await call('/api/v1/reservations?from=2026-10-01&to=2026-12-31')).body,
      ).success,
    ).toBe(true);
    expect(
      modelCatalogEnvelopeSchema.safeParse((await call('/api/v1/ml/models')).body).success,
    ).toBe(true);
    expect(mlHealthSchema.safeParse((await call('/api/v1/health/ml')).body).success).toBe(true);
    for (const reservation of MOCK_RESERVATIONS.filter(
      (item) => item.id !== MOCK_IDS.partialErrors,
    )) {
      const base = `/api/v1/reservations/${reservation.id}`;
      expect(reservationDetailEnvelopeSchema.safeParse((await call(base)).body).success).toBe(true);
      expect(
        riskAssessmentEnvelopeSchema.safeParse((await call(`${base}/risk`)).body).success,
      ).toBe(true);
    }
    const factors = await call(
      `/api/v1/reservations/${MOCK_IDS.availableBoth}/risk/factors?modelKey=xgboost_full_v1&topK=3`,
    );
    expect(riskFactorsEnvelopeSchema.safeParse(factors.body).success).toBe(true);
    const history = await call(
      `/api/v1/reservations/${MOCK_IDS.availableBoth}/client-history?historicalAsOf=current_known`,
    );
    expect(clientHistoryEnvelopeSchema.safeParse(history.body).success).toBe(true);
  });

  it('responde 409 RISK_POLICY_UNAVAILABLE ante riskLevel, igual que Fastify', async () => {
    const { status, body } = await call(
      '/api/v1/reservations?from=2026-10-01&to=2026-10-10&riskLevel=LOW',
    );
    expect(status).toBe(409);
    expect(body).toMatchObject({ error: { code: 'RISK_POLICY_UNAVAILABLE' } });
  });

  it('el POST crea una vez (201) y luego reutiliza (200)', async () => {
    const init = { method: 'POST', body: JSON.stringify({ mode: 'compare' }) };
    const first = await call(`/api/v1/reservations/${MOCK_IDS.notScored}/predictions`, init);
    const second = await call(`/api/v1/reservations/${MOCK_IDS.notScored}/predictions`, init);
    expect([first.status, second.status]).toEqual([201, 200]);
    expect(predictionResponseEnvelopeSchema.safeParse(first.body).success).toBe(true);
  });

  it('exige la credencial en rutas de negocio', async () => {
    const response = await mockFastifyTransport(
      new URL('http://fastify.mock/api/v1/ml/models'),
      {},
    );
    expect(response.status).toBe(401);
  });
});

describe('Restricción a loopback', () => {
  it.each([
    ['127.0.0.1:3001', true],
    ['localhost:3001', true],
    ['[::1]:3001', true],
    ['192.168.1.20:3001', false],
    ['evil.example.com', false],
    [null, false],
  ])('%s → %s', (host, expected) => {
    expect(isLoopbackHost(host)).toBe(expected);
  });
});
