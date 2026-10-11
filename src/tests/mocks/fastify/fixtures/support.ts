import {
  MOCK_IDS,
  type MockReservation,
  RF,
  toReservationBody,
  toScoreSummary,
  XGB,
} from '@/tests/mocks/fastify/fixtures/reservations';

/** Fixtures SINTÉTICAS de soporte (catálogo, health) e historial (solo pruebas). */

export const MODEL_CATALOG = {
  featureVersion: 'BOOKING_BASELINE_V1',
  defaultModelKey: RF.key,
  models: [RF, XGB].map((model) => ({
    modelKey: model.key,
    algorithm: model === RF ? 'random_forest' : 'xgboost',
    modelVersion: `${model.key}:${model.hash}`,
    modelHash: model.hash,
    role: model === RF ? 'default_demo' : 'comparison',
    featureCount: 19,
    validationStatus: 'EXPLORATORY_NOT_VALIDATED',
    calibrationStatus: 'not_operationally_validated',
    operationalUseAllowed: false,
  })),
  riskPolicyStatus: 'pending_validation',
};

export const ML_HEALTH = {
  service: 'ml',
  status: 'ok',
  message: 'Servicio ML disponible para uso exploratorio',
  servingStatus: 'EXPLORATORY_NOT_VALIDATED',
  operationalUseAllowed: false,
};

export function reservationDetail(
  reservation: MockReservation,
  scores: MockReservation['scores'],
  now: Date,
) {
  return {
    ...toReservationBody(reservation, now),
    hasUsableSnapshot: reservation.availability !== 'NOT_SCORABLE',
    scores: scores.map((score) => toScoreSummary(score, now)),
    sourceStatus: 'SYNTHETIC_DEMO_ONLY',
  };
}

const BASE_WARNINGS = [
  'CANCELLATIONS_EXCLUDED',
  'ATTENDANCE_KNOWN_AT_SESSION_CLOSE',
  'NO_SHOW_CANDIDATE_INCLUDES_SYSTEM_TRACKED_RECORDS',
  'SOURCE_AS_OF_LAST_INGESTION',
];

const HISTORY_COUNTS: Readonly<Record<string, Record<string, [number, number]>>> = {
  [MOCK_IDS.availableBoth]: { booking_creation: [10, 0], current_known: [12, 1] },
  [MOCK_IDS.notScored]: { booking_creation: [4, 2], current_known: [5, 2] },
};

export function clientHistory(reservation: MockReservation, mode: string, now: Date) {
  const [attended, noShow] = HISTORY_COUNTS[reservation.id]?.[mode] ?? [0, 0];
  const resolved = attended + noShow;
  const isCurrent = mode === 'current_known';
  return {
    reservationId: reservation.id,
    clientId: reservation.clientId,
    historicalAsOf: mode,
    cutoffAt: isCurrent
      ? now.toISOString()
      : new Date(now.getTime() - 20 * 86_400_000).toISOString(),
    cutoffSemantics: 'known_at < cutoffAt',
    historySemantics: 'NO_SHOW_CANDIDATE',
    previousAttended: attended,
    previousNoShow: noShow,
    resolvedTotal: resolved,
    noShowRate: resolved === 0 ? null : noShow / resolved,
    lastNoShowAt: noShow > 0 ? new Date(now.getTime() - 90 * 86_400_000).toISOString() : null,
    lastAttendedAt: attended > 0 ? new Date(now.getTime() - 35 * 86_400_000).toISOString() : null,
    warnings: isCurrent
      ? [...BASE_WARNINGS, 'CURRENT_KNOWN_DOES_NOT_FEED_ORIGINAL_SCORE']
      : BASE_WARNINGS,
  };
}
