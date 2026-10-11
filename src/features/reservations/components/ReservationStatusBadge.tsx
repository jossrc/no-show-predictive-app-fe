import { History, TriangleAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { ReservationStatus } from '@/features/reservations/api/contract';
import {
  RESERVATION_STATUS_LABELS,
  STALE_CLASSIFICATION_TEXT,
} from '@/features/reservations/model/labels';
import { cn } from '@/lib/utils';

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
  stale?: boolean;
  rescheduled?: boolean;
}

/** Estado factual de la reserva. La clasificación obsoleta se advierte con texto, no solo color. */
export function ReservationStatusBadge({
  status,
  stale = false,
  rescheduled = false,
}: ReservationStatusBadgeProps) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge
        variant="outline"
        className={cn('font-normal', status !== 'SCHEDULED' && 'bg-muted text-muted-foreground')}
      >
        {RESERVATION_STATUS_LABELS[status]}
      </Badge>
      {stale && (
        <span
          title={STALE_CLASSIFICATION_TEXT}
          className="inline-flex items-center gap-1 text-xs text-warning"
        >
          <TriangleAlert aria-hidden="true" className="size-3.5" />
          <span className="sr-only">{STALE_CLASSIFICATION_TEXT}</span>
          <span aria-hidden="true">Desactualizada</span>
        </span>
      )}
      {rescheduled && (
        <span
          title="Reprogramación detectada"
          className="inline-flex items-center text-muted-foreground"
        >
          <History aria-hidden="true" className="size-3.5" />
          <span className="sr-only">Reprogramación detectada</span>
        </span>
      )}
    </span>
  );
}
