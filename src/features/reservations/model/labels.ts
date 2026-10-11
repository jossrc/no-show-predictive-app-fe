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
  probabilityNoShow: 'Probabilidad (exploratoria)',
};

export const STALE_CLASSIFICATION_TEXT =
  'Clasificación desactualizada: la cita ya pasó respecto del último corte de clasificación.';

export function formatReservationLabel(reservationId: string): string {
  return `Reserva #${reservationId}`;
}

export function formatClinicLabel(clinicId: number): string {
  return `Clínica #${clinicId}`;
}
