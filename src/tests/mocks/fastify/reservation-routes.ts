import {
  MOCK_IDS,
  MOCK_RESERVATIONS,
  type MockReservation,
  type MockScore,
  RF,
  toReasons,
  XGB,
} from '@/tests/mocks/fastify/fixtures/reservations';
import { riskAssessment, riskFactors } from '@/tests/mocks/fastify/fixtures/risk';
import { clientHistory, reservationDetail } from '@/tests/mocks/fastify/fixtures/support';
import { mockData, mockError, type MockResponse } from '@/tests/mocks/fastify/responses';

/**
 * Rutas por reserva del backend simulado. Las predicciones creadas por POST se guardan en
 * memoria del proceso de prueba (globalThis) y nunca en una base de datos.
 */
const store = globalThis as typeof globalThis & { __mockPredictions?: Map<string, MockScore[]> };
const predictions = (store.__mockPredictions ??= new Map<string, MockScore[]>());

const NOT_SCORABLE_IDS = new Set<string>([
  MOCK_IDS.notScorable,
  MOCK_IDS.stale,
  MOCK_IDS.cancelled,
]);

function currentScores(reservation: MockReservation): MockScore[] {
  return predictions.get(reservation.id) ?? reservation.scores;
}

function notFound(): MockResponse {
  return mockError(404, 'RESERVATION_NOT_FOUND', 'Reserva no encontrada');
}

function parseBody(raw: string | null): { mode?: unknown; modelKey?: unknown } | null {
  try {
    const value: unknown = JSON.parse(raw ?? '');
    return typeof value === 'object' && value !== null ? value : null;
  } catch {
    return null;
  }
}

function requestedScores(body: { mode?: unknown; modelKey?: unknown }): MockScore[] | null {
  if (body.mode === 'compare' && body.modelKey === undefined) {
    return [
      { model: RF, probability: 0.42 },
      { model: XGB, probability: 0.391 },
    ];
  }
  if (body.mode === 'single' && body.modelKey === RF.key) return [{ model: RF, probability: 0.42 }];
  if (body.mode === 'single' && body.modelKey === XGB.key)
    return [{ model: XGB, probability: 0.391 }];
  return null;
}

function predict(reservation: MockReservation, rawBody: string | null, now: Date): MockResponse {
  const body = parseBody(rawBody);
  const requested = body ? requestedScores(body) : null;
  if (!body || !requested)
    return mockError(400, 'REQUEST_VALIDATION_ERROR', 'La solicitud no pudo ser procesada');
  if (NOT_SCORABLE_IDS.has(reservation.id)) {
    return mockError(
      409,
      'NOT_SCORABLE',
      'La reserva no es evaluable con evidencia temporal de su creación',
      {
        reasons: toReasons(reservation.reasons),
      },
    );
  }
  if (reservation.id === MOCK_IDS.partialErrors) {
    return mockError(504, 'ML_TIMEOUT', 'Un servicio dependiente excedió el tiempo permitido');
  }
  const existing = currentScores(reservation);
  const replayed = existing.length > 0;
  const scores = replayed ? existing : requested;
  if (!replayed) predictions.set(reservation.id, scores);
  const run = {
    predictionRunId: replayed ? null : `run-mock-${reservation.id}`,
    replayed,
    requestedModelKeys: requested.map((score) => score.model.key),
    snapshotCreated: !replayed,
  };
  return mockData(
    { ...riskAssessment(reservation, scores, now), run, featureWarnings: [] },
    replayed ? 200 : 201,
  );
}

function factors(reservation: MockReservation, params: URLSearchParams, now: Date): MockResponse {
  if (NOT_SCORABLE_IDS.has(reservation.id)) {
    return mockError(
      409,
      'EXPLANATION_SNAPSHOT_UNAVAILABLE',
      'No existe instantánea original de la reserva para explicar la estimación',
      {
        reasons: toReasons(reservation.reasons),
      },
    );
  }
  if (reservation.id === MOCK_IDS.partialErrors) {
    return mockError(503, 'EXPLANATION_UNAVAILABLE', 'Servicio temporalmente no disponible');
  }
  const modelKey = params.get('modelKey') ?? RF.key;
  const topK = Number(params.get('topK') ?? '5');
  const emptyFactors = reservation.id === MOCK_IDS.rfOnlyZero;
  return mockData(riskFactors(reservation, modelKey, topK, now, { emptyFactors }));
}

function history(reservation: MockReservation, params: URLSearchParams, now: Date): MockResponse {
  if (reservation.id === MOCK_IDS.partialErrors) {
    return mockError(503, 'SOURCE_DATA_UNAVAILABLE', 'Servicio temporalmente no disponible');
  }
  if (reservation.id === MOCK_IDS.stale) {
    return mockError(
      409,
      'HISTORY_CUTOFF_UNAVAILABLE',
      'No se puede establecer el corte temporal del historial',
    );
  }
  const mode = params.get('historicalAsOf') ?? 'booking_creation';
  return mockData(clientHistory(reservation, mode, now));
}

export function handleReservationRoute(
  method: string,
  url: URL,
  rawBody: string | null,
  now: Date,
): MockResponse {
  const match =
    /^\/api\/v1\/reservations\/(\d+)(\/risk|\/risk\/factors|\/predictions|\/client-history)?$/.exec(
      url.pathname,
    );
  const reservation = MOCK_RESERVATIONS.find((item) => item.id === match?.[1]);
  if (!match || !reservation) return notFound();

  const route = `${method} ${match[2] ?? ''}`;
  if (route === 'GET ')
    return mockData(reservationDetail(reservation, currentScores(reservation), now));
  if (route === 'GET /risk') {
    if (reservation.id === MOCK_IDS.partialErrors) {
      return mockError(503, 'PERSISTENCE_UNAVAILABLE', 'Servicio temporalmente no disponible');
    }
    return mockData(riskAssessment(reservation, currentScores(reservation), now));
  }
  if (route === 'POST /predictions') return predict(reservation, rawBody, now);
  if (route === 'GET /risk/factors') return factors(reservation, url.searchParams, now);
  if (route === 'GET /client-history') return history(reservation, url.searchParams, now);
  return mockError(404, 'NOT_FOUND', 'Ruta no encontrada');
}
