import { resolveModelIdentity } from '@/features/prediction-models/model/model-identity';
import {
  formatClinicLabel,
  SORT_FIELD_LABELS,
  STATUS_FILTER_LABELS,
} from '@/features/reservations/model/labels';
import type { ReservationListQuery } from '@/features/reservations/model/list-query';
import { formatCalendarDate } from '@/lib/dates/calendar';

/** Período del listado en fechas de calendario de Lima. */
export function describePeriod(query: Pick<ReservationListQuery, 'from' | 'to'>): string {
  return `${formatCalendarDate(query.from)} – ${formatCalendarDate(query.to)}`;
}

/** Resumen visible de lo que se está consultando: estado, período y sede. */
export function describeListScope(query: ReservationListQuery): string {
  const parts = [STATUS_FILTER_LABELS[query.status], describePeriod(query)];
  if (query.clinicId) parts.push(formatClinicLabel(query.clinicId));
  return parts.join(' · ');
}

/** Solo se describe el orden cuando no es el cronológico habitual. */
export function describeSort(query: ReservationListQuery): string | null {
  if (query.sort !== 'probabilityNoShow') return null;
  const direction = query.direction === 'desc' ? 'de mayor a menor' : 'de menor a mayor';
  return `Ordenadas por estimación de ${resolveModelIdentity(query.modelKey).label}, ${direction} (experimental)`;
}

export function reservationsCaption(query: ReservationListQuery): string {
  const direction = query.direction === 'asc' ? 'ascendente' : 'descendente';
  const clinic = query.clinicId ? `, ${formatClinicLabel(query.clinicId).toLowerCase()}` : '';
  return `Reservas ${STATUS_FILTER_LABELS[query.status].toLowerCase()} del ${describePeriod(query)}${clinic}, ordenadas por ${SORT_FIELD_LABELS[query.sort].toLowerCase()} en orden ${direction}.`;
}
