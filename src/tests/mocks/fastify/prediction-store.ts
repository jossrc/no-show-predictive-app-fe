import type { MockReservation, MockScore } from '@/tests/mocks/fastify/fixtures/reservations';

/**
 * Predicciones creadas por `POST …/predictions` en el backend SIMULADO. Se guardan en memoria del
 * proceso de prueba (globalThis) y nunca en una base de datos.
 */
const store = globalThis as typeof globalThis & { __mockPredictions?: Map<string, MockScore[]> };
const predictions = (store.__mockPredictions ??= new Map<string, MockScore[]>());

export function currentScores(reservation: MockReservation): MockScore[] {
  return predictions.get(reservation.id) ?? reservation.scores;
}

export function savePredictions(reservationId: string, scores: MockScore[]): void {
  predictions.set(reservationId, scores);
}
