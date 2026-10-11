import type { ModelCatalog } from '@/features/prediction-models/api/contract';
import { type ScoreView, toScoreViews } from '@/features/reservation-risk/model/score-view';
import type { ReservationListItem, ReservationStatus } from '@/features/reservations/api/contract';
import { formatClinicLabel } from '@/features/reservations/model/labels';
import { buildDetailHref } from '@/features/reservations/model/list-url';
import { formatLimaDate, formatLimaTime, formatLimaWeekday } from '@/lib/dates/lima';

export interface ReservationRowView {
  reservationId: string;
  clientId: string;
  detailHref: string;
  weekday: string;
  date: string;
  time: string;
  clinicLabel: string;
  status: ReservationStatus;
  stale: boolean;
  rescheduled: boolean;
  scores: ScoreView[];
}

/** Adapta un ítem del listado a su representación visual (fechas en Lima, sin inventar datos). */
export function toReservationRowView(
  item: ReservationListItem,
  context: { selectedModelKey: string; listHref: string; catalog: ModelCatalog | null },
): ReservationRowView {
  return {
    reservationId: item.reservationId,
    clientId: item.clientId,
    detailHref: buildDetailHref(item.reservationId, context.listHref),
    weekday: formatLimaWeekday(item.appointmentAt),
    date: formatLimaDate(item.appointmentAt),
    time: formatLimaTime(item.appointmentAt),
    clinicLabel: formatClinicLabel(item.clinicId),
    status: item.reservationStatus,
    stale: item.sourceFreshness === 'STALE_CLASSIFICATION',
    rescheduled: item.hasRescheduleEvent,
    // Una probabilidad solo se muestra si existe un score persistido; nunca 0 % por omisión.
    scores: toScoreViews(item.risk.probabilities, context.selectedModelKey, context.catalog),
  };
}
