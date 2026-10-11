import { SORT_FIELD_LABELS, STATUS_FILTER_LABELS } from '@/features/reservations/model/labels';
import type { ReservationListQuery } from '@/features/reservations/model/list-query';
import { formatCalendarDate } from '@/lib/dates/calendar';

/** Descripción textual del listado para lectores de pantalla y para el subtítulo. */
export function describePeriod(query: Pick<ReservationListQuery, 'from' | 'to'>): string {
  return `${formatCalendarDate(query.from)} – ${formatCalendarDate(query.to)}`;
}

export function reservationsCaption(query: ReservationListQuery): string {
  const direction = query.direction === 'asc' ? 'ascendente' : 'descendente';
  const clinic = query.clinicId ? `, clínica #${query.clinicId}` : '';
  return `Reservas ${STATUS_FILTER_LABELS[query.status].toLowerCase()} del ${describePeriod(query)}${clinic}, ordenadas por ${SORT_FIELD_LABELS[query.sort].toLowerCase()} en orden ${direction}.`;
}
