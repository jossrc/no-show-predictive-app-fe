import type { OverbookingAuthorization } from '@/features/operational-optimization/api/overbooking.contract';
import type { OperationalStatus } from '@/features/operational-optimization/api/summary.contract';
import {
  MOCK_IDS,
  type MockReservation,
  scoreRunId,
} from '@/tests/mocks/fastify/fixtures/reservations';
import {
  attendanceState,
  availableRunIds,
  overbookingState,
  recoveryState,
  summaryFrom,
} from '@/tests/mocks/fastify/operational-rules';
import {
  buildAttendance,
  buildAuthorization,
  buildRecovery,
  nextId,
  operationalStore,
} from '@/tests/mocks/fastify/operational-store';
import { currentScores } from '@/tests/mocks/fastify/prediction-store';
import { mockData, mockError, type MockResponse } from '@/tests/mocks/fastify/responses';

/**
 * Rutas operativas por reserva del backend SIMULADO (HU-06/07/08), con las mismas rutas,
 * cuerpos estrictos y códigos del contrato `feature/sprint-02`. Solo pruebas.
 */
const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const MODEL_KEYS = ['random_forest_full_v1', 'xgboost_full_v1'];

type Validators = Record<string, (value: unknown) => boolean>;

/** JSON estricto: sin coerción de tipos ni propiedades adicionales (como el backend). */
function parseStrict(raw: string | null, validators: Validators): Record<string, unknown> | null {
  let value: unknown;
  try {
    value = JSON.parse(raw ?? '');
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const keys = Object.keys(body);
  const expected = Object.keys(validators);
  const valid =
    keys.length === expected.length &&
    expected.every((key) => key in body && validators[key]?.(body[key]));
  return valid ? body : null;
}

const invalidBody = () =>
  mockError(400, 'REQUEST_VALIDATION_ERROR', 'La solicitud contiene datos inválidos');
const unavailable = () =>
  mockError(503, 'PERSISTENCE_UNAVAILABLE', 'Servicio temporalmente no disponible');

/** Ya existe una marca: 200 si el reintento es idéntico; 409 si usa otra predicción. */
function replayOrConflict(
  existing: OverbookingAuthorization,
  body: Record<string, unknown>,
): MockResponse {
  if (existing.modelKey === body.modelKey && existing.predictionRunId === body.predictionRunId) {
    return mockData({ ...existing, enabled: true, replayed: true }, 200);
  }
  return mockError(
    409,
    'OVERBOOKING_ALREADY_ENABLED_CONFLICT',
    'El horario ya fue habilitado con otra predicción; la marca no se reemplaza',
    {
      authorizationId: existing.authorizationId,
      modelKey: existing.modelKey,
      predictionRunId: existing.predictionRunId,
    },
  );
}

function enable(reservation: MockReservation, rawBody: string | null, now: Date): MockResponse {
  const body = parseStrict(rawBody, {
    modelKey: (value) => typeof value === 'string' && MODEL_KEYS.includes(value),
    predictionRunId: (value) => typeof value === 'string' && UUID.test(value),
  });
  if (!body) return invalidBody();
  const store = operationalStore(now);
  const scores = currentScores(reservation);
  const existing = store.authorizations.get(reservation.id);
  if (existing) return replayOrConflict(existing, body);
  const score = scores.find((item) => item.model.key === body.modelKey);
  if (!score || scoreRunId(reservation.id, score) !== body.predictionRunId) {
    return mockError(
      409,
      'PREDICTION_RESERVATION_MISMATCH',
      'La predicción no pertenece a esta reserva',
    );
  }
  if (reservation.id === MOCK_IDS.raceConflict) {
    // Simula otra habilitación concurrente con el otro modelo entre el GET y el POST.
    const other = scores.find((item) => item !== score) ?? score;
    const enabledAt = now.toISOString();
    store.authorizations.set(
      reservation.id,
      buildAuthorization(reservation, other, { authorizationId: nextId(store), enabledAt }, now),
    );
    return enable(reservation, rawBody, now);
  }
  const state = overbookingState(reservation, scores, store, now);
  const candidate = state.eligibility.candidates.find((item) => item.modelKey === body.modelKey);
  if (!state.eligibility.eligible || !candidate?.eligible) {
    return mockError(
      409,
      'OVERBOOKING_NOT_ELIGIBLE',
      'El horario no cumple las condiciones de habilitación',
      {
        reasons: [...state.eligibility.reasons, ...(candidate?.reasons ?? [])],
      },
    );
  }
  const authorization = buildAuthorization(
    reservation,
    score,
    { authorizationId: nextId(store), enabledAt: now.toISOString() },
    now,
  );
  store.authorizations.set(reservation.id, authorization);
  return mockData({ ...authorization, enabled: true, replayed: false }, 201);
}

const NOT_FINISHED = new Set([
  'APPOINTMENT_NOT_STARTED',
  'APPOINTMENT_IN_PROGRESS',
  'APPOINTMENT_END_UNKNOWN',
]);

function recordAttendance(
  reservation: MockReservation,
  rawBody: string | null,
  now: Date,
): MockResponse {
  const body = parseStrict(rawBody, {
    attendanceStatus: (value) => value === 'ATTENDED' || value === 'NO_SHOW',
    predictionRunId: (value) => typeof value === 'string' && UUID.test(value),
  });
  if (!body) return invalidBody();
  const store = operationalStore(now);
  const scores = currentScores(reservation);
  const status = body.attendanceStatus as 'ATTENDED' | 'NO_SHOW';
  const runId = body.predictionRunId as string;
  const existing = store.attendance.get(reservation.id);
  if (existing) {
    if (existing.attendanceStatus === status && existing.predictionRunId === runId) {
      return mockData({ ...existing, replayed: true }, 200);
    }
    return mockError(
      409,
      'ATTENDANCE_ALREADY_RECORDED_CONFLICT',
      'La asistencia ya fue registrada con otro valor',
      {
        attendanceStatus: existing.attendanceStatus,
        predictionRunId: existing.predictionRunId,
      },
    );
  }
  const blocker = attendanceState(reservation, scores, store, now).registration.blocker;
  if (blocker === 'RESERVATION_CANCELLED')
    return mockError(409, 'RESERVATION_CANCELLED', 'La reserva está cancelada');
  if (blocker && NOT_FINISHED.has(blocker)) {
    return mockError(409, 'APPOINTMENT_NOT_FINISHED', 'La cita aún no ha finalizado', {
      reason: blocker,
    });
  }
  if (blocker === 'PREDICTION_REQUIRED')
    return mockError(409, 'PREDICTION_REQUIRED', 'La reserva no tiene predicciones');
  if (!availableRunIds(reservation, scores).includes(runId)) {
    return mockError(409, 'PREDICTION_RESERVATION_MISMATCH', 'El run no pertenece a esta reserva');
  }
  const outcome = buildAttendance(
    reservation,
    scores,
    { status, runId, id: nextId(store), recordedAt: now.toISOString() },
    now,
  );
  store.attendance.set(reservation.id, outcome);
  return mockData({ ...outcome, replayed: false }, 201);
}

function recordRecovery(
  reservation: MockReservation,
  rawBody: string | null,
  now: Date,
): MockResponse {
  const body = parseStrict(rawBody, { spaceRecovered: (value) => typeof value === 'boolean' });
  if (!body) return invalidBody();
  const store = operationalStore(now);
  const spaceRecovered = body.spaceRecovered as boolean;
  const authorization = store.authorizations.get(reservation.id);
  if (!authorization) {
    return mockError(
      409,
      'PREVENTIVE_ACTION_REQUIRED',
      'El horario no tiene una habilitación previa',
    );
  }
  const existing = store.recovery.get(reservation.id);
  if (existing) {
    if (existing.spaceRecovered === spaceRecovered)
      return mockData({ ...existing, replayed: true }, 200);
    return mockError(
      409,
      'SPACE_RECOVERY_ALREADY_RECORDED_CONFLICT',
      'La recuperación ya fue registrada',
      {
        spaceRecovered: existing.spaceRecovered,
      },
    );
  }
  const outcome = buildRecovery(authorization, {
    id: nextId(store),
    spaceRecovered,
    recordedAt: now.toISOString(),
  });
  store.recovery.set(reservation.id, outcome);
  return mockData({ ...outcome, replayed: false }, 201);
}

/** null si la ruta no es operativa (la resuelve el enrutador de Sprint 01). */
export function handleOperationalReservationRoute(
  method: string,
  suffix: string,
  reservation: MockReservation,
  rawBody: string | null,
  now: Date,
): MockResponse | null {
  const route = `${method} ${suffix}`;
  const reads = [
    'GET /overbooking-authorization',
    'GET /attendance-outcome',
    'GET /space-recovery-outcome',
  ];
  if (reads.includes(route) && reservation.id === MOCK_IDS.partialErrors) return unavailable();
  const store = () => operationalStore(now);
  const scores = () => currentScores(reservation);
  switch (route) {
    case 'GET /overbooking-authorization':
      return mockData(overbookingState(reservation, scores(), store(), now));
    case 'POST /overbooking-authorizations':
      return enable(reservation, rawBody, now);
    case 'GET /attendance-outcome':
      return mockData(attendanceState(reservation, scores(), store(), now));
    case 'POST /attendance-outcomes':
      return recordAttendance(reservation, rawBody, now);
    case 'GET /space-recovery-outcome':
      return mockData(recoveryState(reservation, store()));
    case 'POST /space-recovery-outcomes':
      return recordRecovery(reservation, rawBody, now);
    default:
      return null;
  }
}

export function operationalStatusFor(reservation: MockReservation, now: Date): OperationalStatus {
  return summaryFrom(reservation, operationalStore(now));
}
