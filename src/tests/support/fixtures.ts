import { clientHistorySchema } from '@/features/client-history/api/contract';
import { modelCatalogSchema } from '@/features/prediction-models/api/contract';
import { riskFactorsSchema } from '@/features/reservation-risk/api/factors.contract';
import { riskAssessmentSchema } from '@/features/reservation-risk/api/risk.contract';
import { reservationListItemSchema } from '@/features/reservations/api/contract';
import type { ApiFailure, ApiResult } from '@/lib/api/result';
import {
  MOCK_IDS,
  MOCK_RESERVATIONS,
  type MockReservation,
  type MockScore,
  toListItem,
} from '@/tests/mocks/fastify/fixtures/reservations';
import { riskAssessment, riskFactors } from '@/tests/mocks/fastify/fixtures/risk';
import { clientHistory, MODEL_CATALOG } from '@/tests/mocks/fastify/fixtures/support';

/**
 * Fixtures tipadas para pruebas de componentes. Se validan con los mismos contratos Zod que
 * usa el cliente HTTP, de modo que una fixture incoherente con el contrato falla de inmediato.
 */
export const NOW = new Date('2026-10-11T15:00:00.000Z');
export { MOCK_IDS };

export function mockReservation(id: string): MockReservation {
  const found = MOCK_RESERVATIONS.find((item) => item.id === id);
  if (!found) throw new Error(`Fixture inexistente: ${id}`);
  return found;
}

export function listItemFixture(id: string) {
  return reservationListItemSchema.parse(toListItem(mockReservation(id), NOW));
}

export function riskFixture(id: string, scores?: MockScore[]) {
  const reservation = mockReservation(id);
  return riskAssessmentSchema.parse(riskAssessment(reservation, scores ?? reservation.scores, NOW));
}

export function factorsFixture(id: string, modelKey: string, topK = 5, emptyFactors = false) {
  return riskFactorsSchema.parse(
    riskFactors(mockReservation(id), modelKey, topK, NOW, { emptyFactors }),
  );
}

export function historyFixture(id: string, mode: 'booking_creation' | 'current_known') {
  return clientHistorySchema.parse(clientHistory(mockReservation(id), mode, NOW));
}

export const catalogFixture = modelCatalogSchema.parse(MODEL_CATALOG);

export function ok<T>(data: T, status = 200, requestId = 'req-test-1'): ApiResult<T> {
  return { ok: true, status, data, requestId };
}

export function httpError(
  status: number,
  code: string,
  extra: Partial<ApiFailure['error']> = {},
): ApiFailure {
  return {
    ok: false,
    error: {
      kind: 'http',
      status,
      code,
      message: 'Mensaje público del backend',
      requestId: 'req-error-1',
      reasons: [],
      fieldErrors: [],
      ...extra,
    },
  };
}
