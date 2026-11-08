import type { OverbookingSummary } from '@/features/operational-optimization/api/summary.contract';
import type { ModelKey } from '@/features/prediction-models/api/contract';
import { resolveModelIdentity } from '@/features/prediction-models/model/model-identity';
import type { ReservationListItem, ReservationStatus } from '@/features/reservations/api/contract';
import { formatAppointmentContext, formatClinicLabel } from '@/features/reservations/model/labels';
import { buildDetailHref } from '@/features/reservations/model/list-url';
import { formatLimaDate, formatLimaTime, formatLimaWeekday } from '@/lib/dates/lima';
import { formatPercentage } from '@/lib/format/percentage';

/**
 * Fila de «Reservas con alto riesgo». La banda y la estimación son SOLO del modelo elegido
 * (persistidas); nunca se combinan modelos ni se usa el `riskLevel` operativo (null).
 */
export interface HighRiskRowView {
  reservationId: string;
  clientId: string;
  detailHref: string;
  context: string;
  weekday: string;
  date: string;
  time: string;
  clinicLabel: string;
  status: ReservationStatus;
  /** p. ej. «Alto (exploratorio)»; null si el backend no devolvió banda para el modelo. */
  bandLabel: string | null;
  /** p. ej. «Random Forest · 47.68 %»; null sin score persistido del modelo. */
  estimateText: string | null;
  overbooking: OverbookingSummary | null;
}

export function toHighRiskRowView(
  item: ReservationListItem,
  context: { modelKey: ModelKey; backHref: string },
): HighRiskRowView {
  const score = item.risk.probabilities.find((entry) => entry.modelKey === context.modelKey);
  const model = resolveModelIdentity(context.modelKey).label;
  return {
    reservationId: item.reservationId,
    clientId: item.clientId,
    detailHref: buildDetailHref(item.reservationId, context.backHref),
    context: formatAppointmentContext(item.reservationId, item),
    weekday: formatLimaWeekday(item.appointmentAt),
    date: formatLimaDate(item.appointmentAt),
    time: formatLimaTime(item.appointmentAt),
    clinicLabel: formatClinicLabel(item.clinicId),
    status: item.reservationStatus,
    bandLabel: item.risk.experimentalRisk?.label ?? null,
    estimateText: score ? `${model} · ${formatPercentage(score.percentageNoShow)}` : null,
    overbooking: item.overbooking,
  };
}
