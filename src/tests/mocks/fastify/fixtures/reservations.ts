import type { ReservationListItem } from '@/features/reservations/api/contract';
import { addCalendarDays, todayInLima } from '@/lib/dates/calendar';

/**
 * Fixtures SINTÉTICAS de prueba, coherentes con el contrato de Fastify. Los identificadores
 * usan el rango sintético 9000… del backend; no corresponden a clientes ni reservas reales.
 * Las fechas son relativas a «hoy» en Lima para caer en el rango predeterminado del listado.
 */
export const MOCK_IDS = {
  availableBoth: '900000000001001',
  notScorable: '900000000001002',
  notScored: '900000000001003',
  rfOnlyZero: '900000000001004',
  stale: '900000000001005',
  cancelled: '900000000001006',
  xgbOnly: '900000000001007',
  partialErrors: '900000000001009',
} as const;

/** Clínicas con comportamiento especial en el listado mock. */
export const MOCK_CLINICS = { unknown: '999', unavailable: '503', unauthorized: '401' } as const;

const CUTOFF = '2026-10-08T01:58:00.000Z';
export const RF = { key: 'random_forest_full_v1', hash: '4e3c86a17005' } as const;
export const XGB = { key: 'xgboost_full_v1', hash: '376d3db9d4d3' } as const;

function limaInstant(dayOffset: number, time: string, now: Date): string {
  const day = addCalendarDays(todayInLima(now), dayOffset);
  return new Date(`${day}T${time}:00-05:00`).toISOString();
}

export interface MockScore {
  model: typeof RF | typeof XGB;
  probability: number;
}

export interface MockReservation {
  id: string;
  clientId: string;
  clinicId: number;
  dayOffset: number;
  time: string;
  status: 'SCHEDULED' | 'CANCELLED';
  availability: 'AVAILABLE_EXPLORATORY' | 'NOT_SCORED' | 'NOT_SCORABLE';
  reasons: string[];
  scores: MockScore[];
  stale?: boolean;
  rescheduled?: boolean;
}

export const MOCK_RESERVATIONS: readonly MockReservation[] = [
  {
    id: MOCK_IDS.availableBoth,
    clientId: '900000000002001',
    clinicId: 2,
    dayOffset: 1,
    time: '10:00',
    status: 'SCHEDULED',
    availability: 'AVAILABLE_EXPLORATORY',
    reasons: [],
    scores: [
      { model: RF, probability: 0.31 },
      { model: XGB, probability: 0.274 },
    ],
  },
  {
    id: MOCK_IDS.notScorable,
    clientId: '900000000002002',
    clinicId: 2,
    dayOffset: 1,
    time: '15:30',
    status: 'SCHEDULED',
    availability: 'NOT_SCORABLE',
    reasons: ['SCHEDULED_SERVICES_NOT_POINT_IN_TIME', 'CATALOG_NOT_POINT_IN_TIME'],
    scores: [],
  },
  {
    id: MOCK_IDS.notScored,
    clientId: '900000000002003',
    clinicId: 5,
    dayOffset: 2,
    time: '09:00',
    status: 'SCHEDULED',
    availability: 'NOT_SCORED',
    reasons: [],
    scores: [],
  },
  {
    id: MOCK_IDS.rfOnlyZero,
    clientId: '900000000002004',
    clinicId: 5,
    dayOffset: 3,
    time: '11:00',
    status: 'SCHEDULED',
    availability: 'AVAILABLE_EXPLORATORY',
    reasons: [],
    scores: [{ model: RF, probability: 0 }],
  },
  {
    id: MOCK_IDS.stale,
    clientId: '900000000002005',
    clinicId: 11,
    dayOffset: 0,
    time: '08:00',
    status: 'SCHEDULED',
    availability: 'NOT_SCORABLE',
    reasons: ['RESCHEDULED_WITHOUT_ORIGINAL_SNAPSHOT'],
    scores: [],
    stale: true,
    rescheduled: true,
  },
  {
    id: MOCK_IDS.cancelled,
    clientId: '900000000002006',
    clinicId: 2,
    dayOffset: 2,
    time: '12:00',
    status: 'CANCELLED',
    availability: 'NOT_SCORABLE',
    reasons: ['RESERVATION_NOT_SCHEDULED'],
    scores: [],
  },
  {
    id: MOCK_IDS.xgbOnly,
    clientId: '900000000002007',
    clinicId: 11,
    dayOffset: 5,
    time: '16:00',
    status: 'SCHEDULED',
    availability: 'AVAILABLE_EXPLORATORY',
    reasons: [],
    scores: [{ model: XGB, probability: 1 }],
  },
  {
    id: MOCK_IDS.partialErrors,
    clientId: '900000000002009',
    clinicId: 11,
    dayOffset: 4,
    time: '17:00',
    status: 'SCHEDULED',
    availability: 'NOT_SCORED',
    reasons: [],
    scores: [],
  },
];

export const REASON_MESSAGES: Readonly<Record<string, string>> = {
  SCHEDULED_SERVICES_NOT_POINT_IN_TIME:
    'Los servicios programados provienen de la réplica actual sin evidencia temporal de la reserva',
  CATALOG_NOT_POINT_IN_TIME:
    'El catálogo de servicios cambió (o no es verificable) después de la reserva',
  RESCHEDULED_WITHOUT_ORIGINAL_SNAPSHOT:
    'La cita fue reprogramada y no existe instantánea original de la reserva',
  RESERVATION_NOT_SCHEDULED: 'La reserva no está programada (cancelada, pasada o excluida)',
};

export function toReasons(codes: readonly string[]) {
  return codes.map((code) => ({ code, message: REASON_MESSAGES[code] ?? code }));
}

export function appointmentAt(reservation: MockReservation, now: Date): string {
  return limaInstant(reservation.dayOffset, reservation.time, now);
}

export function toScoreSummary(score: MockScore, now: Date) {
  return {
    modelKey: score.model.key,
    modelVersion: `${score.model.key}:${score.model.hash}`,
    modelHash: score.model.hash,
    probabilityNoShow: score.probability,
    percentageNoShow: score.probability * 100,
    scoredAt: limaInstant(-1, '09:00', now),
    predictionRunId: `run-${score.model.hash}`,
    riskLevel: null,
  };
}

export function toReservationBody(reservation: MockReservation, now: Date) {
  return {
    reservationId: reservation.id,
    clientId: reservation.clientId,
    clinicId: reservation.clinicId,
    appointmentAt: appointmentAt(reservation, now),
    bookingCreatedAt: limaInstant(-20, '16:00', now),
    reservationStatus: reservation.status,
    sourceClassification:
      reservation.status === 'CANCELLED' ? 'FUTURE_CANCELLED' : 'FUTURE_PENDING',
    hasRescheduleEvent: reservation.rescheduled ?? false,
    classificationCutoffAt: CUTOFF,
    sourceFreshness: reservation.stale ? 'STALE_CLASSIFICATION' : 'CURRENT',
  } as const;
}

export function toListItem(reservation: MockReservation, now: Date): ReservationListItem {
  return {
    ...toReservationBody(reservation, now),
    risk: {
      predictionAvailability: reservation.availability,
      notScorableReasons: toReasons(reservation.reasons),
      riskLevel: null,
      riskPolicyStatus: 'pending_validation',
      classificationUnavailable: true,
      validationStatus: 'EXPLORATORY_NOT_VALIDATED',
      probabilities: reservation.scores.map((score) => toScoreSummary(score, now)),
    },
  };
}
