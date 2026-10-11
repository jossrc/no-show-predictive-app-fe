import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/shared/PageHeader';
import { RefreshButton } from '@/components/shared/RefreshButton';
import type { ReservationDetail } from '@/features/reservations/api/contract';
import { ReservationStatusBadge } from '@/features/reservations/components/ReservationStatusBadge';
import { formatClinicLabel } from '@/features/reservations/model/labels';
import type { ApiResult } from '@/lib/api/result';
import { formatLimaDateTime, formatLimaWeekday } from '@/lib/dates/lima';

interface Props {
  reservationId: string;
  backHref: string;
  detail: ApiResult<ReservationDetail>;
}

export function ReservationDetailHeader({ reservationId, backHref, detail }: Props) {
  const reservation = detail.ok ? detail.data : null;
  return (
    <PageHeader
      eyebrow={
        <Link
          href={backHref}
          className="mb-1 inline-flex items-center gap-1 rounded-sm text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Volver a reservas
        </Link>
      }
      title={
        <>
          Reserva <span className="font-mono font-medium tabular-nums">#{reservationId}</span>
        </>
      }
      actions={<RefreshButton />}
    >
      {reservation && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-sm text-muted-foreground">
          <ReservationStatusBadge
            status={reservation.reservationStatus}
            stale={reservation.sourceFreshness === 'STALE_CLASSIFICATION'}
            rescheduled={reservation.hasRescheduleEvent}
          />
          <span className="tabular-nums">
            {formatLimaWeekday(reservation.appointmentAt)}{' '}
            {formatLimaDateTime(reservation.appointmentAt)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatClinicLabel(reservation.clinicId)}</span>
        </div>
      )}
    </PageHeader>
  );
}
