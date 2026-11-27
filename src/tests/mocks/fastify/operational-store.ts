import type {
  AttendanceComparison,
  AttendanceOutcome,
} from '@/features/operational-optimization/api/attendance.contract';
import type { OverbookingAuthorization } from '@/features/operational-optimization/api/overbooking.contract';
import type { SpaceRecoveryOutcome } from '@/features/operational-optimization/api/recovery.contract';
import type { AttendanceStatus } from '@/features/operational-optimization/api/summary.contract';
import {
  appointmentAt,
  MOCK_RESERVATIONS,
  type MockReservation,
  type MockScore,
  scoreRunId,
  scoreScoredAt,
  seedInstants,
} from '@/tests/mocks/fastify/fixtures/reservations';

/**
 * Almacén operativo SIMULADO de Sprint 02 (marcas HU-06, asistencias HU-07, recuperaciones
 * HU-08). Vive solo en la memoria del proceso de prueba (globalThis): los POST simulados
 * persisten aquí para que el GET posterior muestre el nuevo estado. Nunca toca datos reales.
 */
export interface OperationalStore {
  authorizations: Map<string, OverbookingAuthorization>;
  attendance: Map<string, AttendanceOutcome>;
  recovery: Map<string, SpaceRecoveryOutcome>;
  sequence: number;
}

const holder = globalThis as typeof globalThis & { __mockOperational?: OperationalStore };

export const COMPARISON_NOTICE =
  'Comparación descriptiva por algoritmo (binary_outcome_threshold_v1: probabilityNoShow >= 0.5 ⇒ inasistencia predicha). Umbral técnico provisional, no validado; no es evaluación científica final del modelo.';

export function nextId(store: OperationalStore): string {
  store.sequence += 1;
  return String(store.sequence);
}

export function buildAuthorization(
  reservation: MockReservation,
  score: MockScore,
  ids: { authorizationId: string; enabledAt: string },
  now: Date,
): OverbookingAuthorization {
  return {
    authorizationId: ids.authorizationId,
    reservationId: reservation.id,
    clinicId: reservation.clinicId,
    appointmentAt: appointmentAt(reservation, now),
    status: 'ENABLED',
    statusLabel: 'Habilitado para sobreasignación',
    enabledAt: ids.enabledAt,
    modelKey: score.model.key,
    modelVersion: `${score.model.key}:${score.model.hash}`,
    predictionRunId: scoreRunId(reservation.id, score),
    riskBandAtAuthorization: 'HIGH',
    probabilityNoShowAtAuthorization: score.probability,
    researchPolicyHash: (score.model.key === 'random_forest_full_v1' ? 'a' : 'b').repeat(64),
    researchPolicyVersion: 'synthetic-research-v2',
    scoredAt: scoreScoredAt(score, now),
    eligibilityRuleVersion: 'overbooking_eligibility_v1',
    actorKind: 'INTERNAL_SERVICE',
    actorUserId: null,
  };
}

/** Comparación por modelo del run (regla provisional p ≥ 0,5), como la guarda el backend. */
function comparison(score: MockScore, observedNoShow: boolean, now: Date): AttendanceComparison {
  const predictedNoShow = score.probability >= 0.5;
  return {
    modelKey: score.model.key,
    modelVersion: `${score.model.key}:${score.model.hash}`,
    probabilityNoShow: score.probability,
    scoredAt: scoreScoredAt(score, now),
    experimentalRiskLevel: score.experimentalLevel ?? null,
    comparisonRuleVersion: 'binary_outcome_threshold_v1',
    threshold: 0.5,
    predictedNoShow,
    observedNoShow,
    matchesPrediction: predictedNoShow === observedNoShow,
  };
}

export function buildAttendance(
  reservation: MockReservation,
  scores: MockScore[],
  input: { status: AttendanceStatus; runId: string; id: string; recordedAt: string },
  now: Date,
): AttendanceOutcome {
  const observedNoShow = input.status === 'NO_SHOW';
  const appointment = appointmentAt(reservation, now);
  return {
    attendanceOutcomeId: input.id,
    reservationId: reservation.id,
    clinicId: reservation.clinicId,
    appointmentAt: appointment,
    appointmentEndAt: new Date(new Date(appointment).getTime() + 40 * 60_000).toISOString(),
    attendanceStatus: input.status,
    observedNoShow,
    recordedAt: input.recordedAt,
    predictionRunId: input.runId,
    finishedRuleVersion: 'appointment_finished_rule_v1',
    comparisons: scores
      .filter((score) => scoreRunId(reservation.id, score) === input.runId)
      .map((score) => comparison(score, observedNoShow, now)),
    comparisonNotice: COMPARISON_NOTICE,
    actorKind: 'INTERNAL_SERVICE',
    actorUserId: null,
  };
}

export function buildRecovery(
  authorization: OverbookingAuthorization,
  input: { id: string; spaceRecovered: boolean; recordedAt: string },
): SpaceRecoveryOutcome {
  return {
    recoveryOutcomeId: input.id,
    authorizationId: authorization.authorizationId,
    reservationId: authorization.reservationId,
    clinicId: authorization.clinicId,
    appointmentAt: authorization.appointmentAt,
    spaceRecovered: input.spaceRecovered,
    recordedAt: input.recordedAt,
    actorKind: 'INTERNAL_SERVICE',
    actorUserId: null,
  };
}

function seed(store: OperationalStore, reservation: MockReservation, now: Date) {
  const plan = reservation.operational;
  const score = reservation.scores.find((item) => item.model === plan?.enabledModel);
  if (!plan || !score) return;
  const { enabledAt, recordedAt } = seedInstants(reservation, now);
  const authorization = buildAuthorization(
    reservation,
    score,
    { authorizationId: `7${reservation.id.slice(-4)}`, enabledAt },
    now,
  );
  store.authorizations.set(reservation.id, authorization);
  if (plan.attendance) {
    const input = { status: plan.attendance, runId: authorization.predictionRunId, recordedAt };
    store.attendance.set(
      reservation.id,
      buildAttendance(reservation, reservation.scores, { ...input, id: nextId(store) }, now),
    );
  }
  if (plan.spaceRecovered !== undefined) {
    const input = { id: nextId(store), spaceRecovered: plan.spaceRecovered, recordedAt };
    store.recovery.set(reservation.id, buildRecovery(authorization, input));
  }
}

/** Almacén nuevo con la gestión semilla (sin compartir estado con otras pruebas). */
export function seededStore(now: Date): OperationalStore {
  const store: OperationalStore = {
    authorizations: new Map(),
    attendance: new Map(),
    recovery: new Map(),
    sequence: 100,
  };
  for (const reservation of MOCK_RESERVATIONS) seed(store, reservation, now);
  return store;
}

export function operationalStore(now: Date): OperationalStore {
  holder.__mockOperational ??= seededStore(now);
  return holder.__mockOperational;
}

/** Solo pruebas: vuelve al estado sembrado. */
export function resetOperationalStore(): void {
  holder.__mockOperational = undefined;
}
