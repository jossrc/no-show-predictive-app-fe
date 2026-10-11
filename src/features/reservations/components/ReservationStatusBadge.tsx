import { ClockAlert, Repeat2 } from 'lucide-react';

import type { ReservationStatus } from '@/features/reservations/api/contract';
import {
  RESCHEDULED_TEXT,
  RESERVATION_STATUS_LABELS,
  STALE_CLASSIFICATION_TEXT,
} from '@/features/reservations/model/labels';
import { cn } from '@/lib/utils';

const DOT_CLASSES: Record<ReservationStatus, string> = {
  SCHEDULED: 'bg-brand',
  CANCELLED: 'bg-muted-foreground/45',
  PAST: 'bg-muted-foreground/70',
};

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
  stale?: boolean;
  rescheduled?: boolean;
}

/** Estado factual de la cita: el texto comunica el estado; el punto de color es secundario. */
export function ReservationStatusBadge({
  status,
  stale = false,
  rescheduled = false,
}: ReservationStatusBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          'inline-flex h-6 items-center gap-1.5 rounded-full border bg-card px-2.5 text-xs font-medium whitespace-nowrap',
          status === 'SCHEDULED' ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        <span aria-hidden="true" className={cn('size-1.5 rounded-full', DOT_CLASSES[status])} />
        {RESERVATION_STATUS_LABELS[status]}
      </span>
      {stale && (
        <span title={STALE_CLASSIFICATION_TEXT} className="inline-flex text-warning">
          <ClockAlert aria-hidden="true" className="size-4" />
          <span className="sr-only">{STALE_CLASSIFICATION_TEXT}</span>
        </span>
      )}
      {rescheduled && (
        <span title={RESCHEDULED_TEXT} className="inline-flex text-muted-foreground">
          <Repeat2 aria-hidden="true" className="size-4" />
          <span className="sr-only">{RESCHEDULED_TEXT}</span>
        </span>
      )}
    </span>
  );
}
