import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { AvailabilityBadge } from '@/features/reservation-risk/components/AvailabilityBadge';
import { ScoreList } from '@/features/reservation-risk/components/ScoreList';
import { AVAILABILITY_LABELS } from '@/features/reservation-risk/model/availability';
import { ReservationStatusBadge } from '@/features/reservations/components/ReservationStatusBadge';
import { formatReservationLabel } from '@/features/reservations/model/labels';
import type { ReservationRowView } from '@/features/reservations/model/row-view';

/** Variante compacta para pantallas pequeñas: evita el desplazamiento horizontal. */
export function ReservationsCardList({ rows }: { rows: ReservationRowView[] }) {
  return (
    <ul className="divide-y">
      {rows.map((row) => (
        <li key={row.reservationId}>
          <Link
            href={row.detailHref}
            aria-label={`${formatReservationLabel(row.reservationId)}, ${row.date} ${row.time}`}
            className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50"
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[13px] font-medium tabular-nums">
                  #{row.reservationId}
                </span>
                <AvailabilityBadge availability={row.availability} />
              </div>
              <p className="text-sm tabular-nums">
                {row.date} · {row.time}
                <span className="text-muted-foreground"> · {row.clinicLabel}</span>
              </p>
              <div className="flex items-center justify-between gap-2">
                <ReservationStatusBadge
                  status={row.status}
                  stale={row.stale}
                  rescheduled={row.rescheduled}
                />
                <ScoreList scores={row.scores} emptyLabel={AVAILABILITY_LABELS[row.availability]} />
              </div>
            </div>
            <ChevronRight
              aria-hidden="true"
              className="mt-1 size-4 shrink-0 text-muted-foreground"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
