import type { AttendanceStatus } from '@/features/operational-optimization/api/summary.contract';
import type { ExperimentalRiskLevel } from '@/features/reservation-risk/api/experimental-risk.contract';
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
  // Sprint 02 (HU-06/07/08). Futuras: a partir del día 15 (fuera del rango inicial del listado).
  highBoth: '900000000001010',
  highRfOnly: '900000000001011',
  enabledFuture: '900000000001012',
  raceConflict: '900000000001016',
  // Pasadas (estado PAST): no aparecen en el listado de reservas programadas/canceladas.
  pastFinished: '900000000001013',
  pastRecorded: '900000000001014',
  pastNotEnabled: '900000000001015',
  pastNoScores: '900000000001017',
} as const;

/** Clínicas con comportamiento especial en el listado mock. */
export const MOCK_CLINICS = { unknown: '999', unavailable: '503', unauthorized: '401' } as const;

export const RF = { key: 'random_forest_full_v1', hash: '4e3c86a17005' } as const;
export const XGB = { key: 'xgboost_full_v1', hash: '376d3db9d4d3' } as const;

export function limaInstant(dayOffset: number, time: string, now: Date): string {
  const day = addCalendarDays(todayInLima(now), dayOffset);
  return new Date(`${day}T${time}:00-05:00`).toISOString();
}

export interface MockScore {
  model: typeof RF | typeof XGB;
  probability: number;
  experimentalLevel?: ExperimentalRiskLevel;
  /** UUID sintético del run; por defecto, uno por reserva (modo compare). */
  runId?: string;
  /** Día (relativo a hoy) en que se registró el score; por defecto, ayer. */
  scoredDayOffset?: number;
}

/** UUID sintético VÁLIDO y determinista (los endpoints de Sprint 02 exigen UUID). */
export function mockRunId(reservationId: string, variant = 0): string {
  return `00000000-0000-4000-8${variant}00-${reservationId.slice(-12).padStart(12, '0')}`;
}

export function scoreRunId(reservationId: string, score: MockScore): string {
  return score.runId ?? mockRunId(reservationId);
}

export function scoreScoredAt(score: MockScore, now: Date): string {
  return limaInstant(score.scoredDayOffset ?? -1, '09:00', now);
}

/** Gestión operativa inicial (semilla del almacén simulado de Sprint 02). */
export interface MockOperationalSeed {
  enabledModel?: typeof RF | typeof XGB;
  attendance?: AttendanceStatus;
  spaceRecovered?: boolean;
}

export interface MockReservation {
  id: string;
  clientId: string;
  clinicId: number;
  dayOffset: number;
  time: string;
  status: 'SCHEDULED' | 'CANCELLED' | 'PAST';
  availability: 'AVAILABLE_EXPLORATORY' | 'NOT_SCORED' | 'NOT_SCORABLE';
  reasons: string[];
  scores: MockScore[];
  stale?: boolean;
  rescheduled?: boolean;
  operational?: MockOperationalSeed;
}

export function appointmentAt(reservation: MockReservation, now: Date): string {
  return limaInstant(reservation.dayOffset, reservation.time, now);
}
