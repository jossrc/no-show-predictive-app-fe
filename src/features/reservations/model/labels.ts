import type { ExperimentalRiskLevel } from '@/features/reservation-risk/api/experimental-risk.contract';
import type { ReservationStatus } from '@/features/reservations/api/contract';
import type { ListableStatus, SortField } from '@/features/reservations/model/list-query';

export const RESERVATION_STATUS_LABELS: Readonly<Record<ReservationStatus, string>> = {
  SCHEDULED: 'Programada',
  CANCELLED: 'Cancelada',
  PAST: 'Pasada',
};

export const STATUS_FILTER_LABELS: Readonly<Record<ListableStatus, string>> = {
  SCHEDULED: 'Programadas',
  CANCELLED: 'Canceladas',
};

export const SORT_FIELD_LABELS: Readonly<Record<SortField, string>> = {
  appointmentAt: 'Fecha de la cita',
  probabilityNoShow: 'Estimación',
  experimentalRisk: 'Banda relativa',
};

export const EXPERIMENTAL_RISK_LABELS: Readonly<Record<ExperimentalRiskLevel, string>> = {
  LOW: 'Banda relativa: Bajo',
  MEDIUM: 'Banda relativa: Medio',
  HIGH: 'Banda relativa: Alto',
};

/** Opciones del filtro: el campo ya indica que son bandas relativas. */
export const RELATIVE_BAND_OPTION_LABELS: Readonly<Record<ExperimentalRiskLevel, string>> = {
  LOW: 'Bajo',
  MEDIUM: 'Medio',
  HIGH: 'Alto',
};

export function formatRelativeBand(level: ExperimentalRiskLevel): string {
  return EXPERIMENTAL_RISK_LABELS[level];
}

export const STALE_CLASSIFICATION_TEXT =
  'La información de esta cita podría requerir actualización.';

export const RESCHEDULED_TEXT = 'Reprogramación detectada';

export function formatReservationLabel(reservationId: string): string {
  return `Reserva #${reservationId}`;
}

/** El backend solo informa identificadores: nunca se inventan nombres de sedes ni clientes. */
export function formatClinicLabel(clinicId: number | string): string {
  return `Sede #${clinicId}`;
}

export function formatClientLabel(clientId: string): string {
  return `Cliente #${clientId}`;
}
