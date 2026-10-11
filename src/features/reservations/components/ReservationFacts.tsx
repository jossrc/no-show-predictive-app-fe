import { ApiErrorNotice } from '@/components/shared/ApiErrorNotice';
import { DescriptionList } from '@/components/shared/DescriptionList';
import { Notice } from '@/components/shared/Notice';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { SectionCard } from '@/components/shared/SectionCard';
import { describeSourceStatus } from '@/features/reservation-risk/model/availability';
import type { ReservationDetail } from '@/features/reservations/api/contract';
import {
  formatClinicLabel,
  RESERVATION_STATUS_LABELS,
  STALE_CLASSIFICATION_TEXT,
} from '@/features/reservations/model/labels';
import type { ApiResult } from '@/lib/api/result';
import { formatLimaDateTime } from '@/lib/dates/lima';

const TITLE = 'Información de la cita';

function optionalDate(value: string | null): string {
  return value ? formatLimaDateTime(value) : 'No registrada';
}

/** Datos factuales de la reserva. Solo campos del contrato: sin nombres ni servicios. */
export function ReservationFacts({ detail }: { detail: ApiResult<ReservationDetail> }) {
  if (!detail.ok) {
    return (
      <SectionCard title={TITLE}>
        <ApiErrorNotice error={detail.error} action={<RefreshButton label="Reintentar" />} />
      </SectionCard>
    );
  }

  const reservation = detail.data;
  const stale = reservation.sourceFreshness === 'STALE_CLASSIFICATION';
  return (
    <SectionCard title={TITLE} description="Datos registrados en la fuente">
      <div className="space-y-3">
        {stale && <Notice tone="warning">{STALE_CLASSIFICATION_TEXT}</Notice>}
        <DescriptionList
          items={[
            {
              term: 'Cliente',
              value: <span className="font-mono text-[13px]">#{reservation.clientId}</span>,
            },
            { term: 'Clínica', value: formatClinicLabel(reservation.clinicId) },
            { term: 'Cita', value: formatLimaDateTime(reservation.appointmentAt) },
            { term: 'Creación de la reserva', value: optionalDate(reservation.bookingCreatedAt) },
            { term: 'Estado', value: RESERVATION_STATUS_LABELS[reservation.reservationStatus] },
            {
              term: 'Reprogramación detectada',
              value: reservation.hasRescheduleEvent ? 'Sí' : 'No',
            },
            {
              term: 'Corte de clasificación',
              value: optionalDate(reservation.classificationCutoffAt),
            },
            { term: 'Clasificación', value: stale ? 'Desactualizada' : 'Vigente según el corte' },
            { term: 'Snapshot utilizable', value: reservation.hasUsableSnapshot ? 'Sí' : 'No' },
          ]}
        />
        <p className="text-[11px] text-muted-foreground">
          Fuente: {describeSourceStatus(reservation.sourceStatus)}. «Vigente» se refiere al último
          corte de clasificación, no a una sincronización en tiempo real.
        </p>
      </div>
    </SectionCard>
  );
}
