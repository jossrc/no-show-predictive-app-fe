import type { AttendanceState } from '@/features/operational-optimization/api/attendance.contract';
import type { OverbookingState } from '@/features/operational-optimization/api/overbooking.contract';
import type { SpaceRecoveryState } from '@/features/operational-optimization/api/recovery.contract';
import type { OperationalStatus } from '@/features/operational-optimization/api/summary.contract';
import {
  appointmentAt,
  type MockReservation,
  type MockScore,
  scoreRunId,
  scoreScoredAt,
} from '@/tests/mocks/fastify/fixtures/reservations';
import type { OperationalStore } from '@/tests/mocks/fastify/operational-store';

/**
 * Reglas SIMULADAS equivalentes a las del backend (overbooking_eligibility_v1 y
 * appointment_finished_rule_v1), suficientes para ejercitar la interfaz. La autoridad real es
 * siempre el backend: el frontend nunca replica estas reglas.
 */
export const INELIGIBILITY_MESSAGES = {
  ALREADY_ENABLED: 'El horario ya está habilitado para sobreasignación',
  RESERVATION_NOT_SCHEDULED: 'La reserva no está programada (cancelada o pasada)',
  APPOINTMENT_NOT_FUTURE: 'La cita ya comenzó o pasó',
  NOT_SCORED: 'La reserva no tiene predicciones persistidas',
  EXPERIMENTAL_BAND_UNAVAILABLE: 'La predicción no tiene banda experimental research v2',
  PREDICTION_NOT_HIGH: 'La banda experimental de la predicción no es Alta',
  PREDICTION_NOT_LATEST:
    'La predicción indicada no es la última del modelo para esta reserva; vuelva a consultar',
} as const;

type Code = keyof typeof INELIGIBILITY_MESSAGES;
const reason = (code: Code) => ({ code, message: INELIGIBILITY_MESSAGES[code] });

function isFuture(reservation: MockReservation, now: Date): boolean {
  return new Date(appointmentAt(reservation, now)).getTime() > now.getTime();
}

export function overbookingState(
  reservation: MockReservation,
  scores: MockScore[],
  store: OperationalStore,
  now: Date,
): OverbookingState {
  const authorization = store.authorizations.get(reservation.id) ?? null;
  const reservationReasons = [
    ...(authorization ? [reason('ALREADY_ENABLED')] : []),
    ...(reservation.status !== 'SCHEDULED' ? [reason('RESERVATION_NOT_SCHEDULED')] : []),
    ...(!isFuture(reservation, now) ? [reason('APPOINTMENT_NOT_FUTURE')] : []),
    ...(scores.length === 0 ? [reason('NOT_SCORED')] : []),
  ];
  const candidates = scores.map((score) => {
    const reasons = !score.experimentalLevel
      ? [reason('EXPERIMENTAL_BAND_UNAVAILABLE')]
      : score.experimentalLevel !== 'HIGH'
        ? [reason('PREDICTION_NOT_HIGH')]
        : [];
    return {
      modelKey: score.model.key,
      predictionRunId: scoreRunId(reservation.id, score),
      probabilityNoShow: score.probability,
      scoredAt: scoreScoredAt(score, now),
      experimentalRiskLevel: score.experimentalLevel ?? null,
      researchPolicyHash: score.experimentalLevel ? 'c'.repeat(64) : null,
      eligible: reasons.length === 0 && reservationReasons.length === 0,
      reasons,
    };
  });
  return {
    reservationId: reservation.id,
    enabled: authorization !== null,
    status: authorization ? 'ENABLED' : 'NOT_ENABLED',
    statusLabel: authorization ? 'Habilitado para sobreasignación' : 'No habilitado',
    authorization,
    eligibility: {
      ruleVersion: 'overbooking_eligibility_v1',
      eligible: reservationReasons.length === 0 && candidates.some((item) => item.eligible),
      reasons: reservationReasons,
      candidates,
    },
  };
}

type Blocker = AttendanceState['registration']['blocker'];

export function attendanceBlocker(
  reservation: MockReservation,
  scores: MockScore[],
  store: OperationalStore,
  now: Date,
): Blocker {
  if (store.attendance.has(reservation.id)) return 'ALREADY_RECORDED';
  if (reservation.status === 'CANCELLED') return 'RESERVATION_CANCELLED';
  if (isFuture(reservation, now)) return 'APPOINTMENT_NOT_STARTED';
  // Sin fin acreditado por la agenda simulada: solo las reservas PAST se consideran finalizadas.
  if (reservation.status !== 'PAST') return 'APPOINTMENT_END_UNKNOWN';
  if (scores.length === 0) return 'PREDICTION_REQUIRED';
  return null;
}

export function availableRunIds(reservation: MockReservation, scores: MockScore[]): string[] {
  return [...new Set(scores.map((score) => scoreRunId(reservation.id, score)))];
}

export function attendanceState(
  reservation: MockReservation,
  scores: MockScore[],
  store: OperationalStore,
  now: Date,
): AttendanceState {
  const outcome = store.attendance.get(reservation.id) ?? null;
  const blocker = attendanceBlocker(reservation, scores, store, now);
  return {
    reservationId: reservation.id,
    recorded: outcome !== null,
    attendanceStatus: outcome?.attendanceStatus ?? null,
    outcome,
    registration: {
      ruleVersion: 'appointment_finished_rule_v1',
      registrable: blocker === null,
      blocker,
      availablePredictionRunIds: availableRunIds(reservation, scores),
    },
  };
}

export function recoveryState(
  reservation: MockReservation,
  store: OperationalStore,
): SpaceRecoveryState {
  const authorization = store.authorizations.get(reservation.id) ?? null;
  const outcome = store.recovery.get(reservation.id) ?? null;
  const blocker = outcome
    ? 'ALREADY_RECORDED'
    : authorization
      ? null
      : 'PREVENTIVE_ACTION_REQUIRED';
  return {
    reservationId: reservation.id,
    recorded: outcome !== null,
    spaceRecovered: outcome?.spaceRecovered ?? null,
    outcome,
    preventiveAction: {
      enabled: authorization !== null,
      authorizationId: authorization?.authorizationId ?? null,
    },
    registrable: blocker === null,
    blocker,
  };
}

function overbookingSummary(store: OperationalStore, reservationId: string) {
  const authorization = store.authorizations.get(reservationId);
  if (!authorization) {
    return {
      enabled: false,
      status: 'NOT_ENABLED' as const,
      statusLabel: 'No habilitado',
      authorizationId: null,
      enabledAt: null,
      modelKey: null,
      predictionRunId: null,
    };
  }
  return {
    enabled: true,
    status: 'ENABLED' as const,
    statusLabel: authorization.statusLabel,
    authorizationId: authorization.authorizationId,
    enabledAt: authorization.enabledAt,
    modelKey: authorization.modelKey,
    predictionRunId: authorization.predictionRunId,
  };
}

/** Resumen aditivo de `GET /reservations` y `GET /reservations/:id` (lectura por lote). */
export function summaryFrom(
  reservation: MockReservation,
  store: OperationalStore,
): OperationalStatus {
  const attendance = store.attendance.get(reservation.id);
  const recovery = store.recovery.get(reservation.id);
  return {
    overbooking: overbookingSummary(store, reservation.id),
    attendanceOutcome: attendance
      ? {
          recorded: true,
          attendanceStatus: attendance.attendanceStatus,
          recordedAt: attendance.recordedAt,
        }
      : { recorded: false, attendanceStatus: null, recordedAt: null },
    spaceRecoveryOutcome: recovery
      ? { recorded: true, spaceRecovered: recovery.spaceRecovered, recordedAt: recovery.recordedAt }
      : { recorded: false, spaceRecovered: null, recordedAt: null },
  };
}
