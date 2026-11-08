import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/shared/PageHeader';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { OverbookingMarkBadge } from '@/features/operational-optimization/components/OverbookingMarkBadge';
import type { ReservationDetail } from '@/features/reservations/api/contract';
import { ReservationStatusBadge } from '@/features/reservations/components/ReservationStatusBadge';
import { formatClinicLabel } from '@/features/reservations/model/labels';
import { backLinkLabel } from '@/features/reservations/model/list-url';
import type { ApiResult } from '@/lib/api/result';
import { formatLimaLongDate, formatLimaTime } from '@/lib/dates/lima';

interface Props {
  reservationId: string;
  backHref: string;
  detail: ApiResult<ReservationDetail>;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Encabezado compacto: lo esencial de la cita (fecha, hora, sede y estado) a primera vista. */
export function ReservationDetailHeader({ reservationId, backHref, detail }: Props) {
  const reservation = detail.ok ? detail.data : null;
  return (
    <PageHeader
      eyebrow={
        <Link
          href={backHref}
          className="mb-1 inline-flex items-center gap-1.5 rounded-sm text-[13px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {backLinkLabel(backHref)}
        </Link>
      }
      title={
        <>
          Reserva <span className="break-all tabular-nums">#{reservationId}</span>
        </>
      }
      titleAddon={
        reservation && (
          <>
            <ReservationStatusBadge
              status={reservation.reservationStatus}
              stale={reservation.sourceFreshness === 'STALE_CLASSIFICATION'}
              rescheduled={reservation.hasRescheduleEvent}
            />
            <OverbookingMarkBadge summary={reservation.overbooking} onlyWhenEnabled />
          </>
        )
      }
      actions={<RefreshButton />}
    >
      {reservation && (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <CalendarDays aria-hidden="true" className="size-4" />
            {capitalize(formatLimaLongDate(reservation.appointmentAt))} ·{' '}
            {formatLimaTime(reservation.appointmentAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="size-4" />
            {formatClinicLabel(reservation.clinicId)}
          </span>
        </p>
      )}
    </PageHeader>
  );
}
