import { ScoreList } from '@/features/reservation-risk/components/ScoreList';
import { DetailLink } from '@/features/reservations/components/ReservationsTable';
import { ReservationStatusBadge } from '@/features/reservations/components/ReservationStatusBadge';
import { formatClientLabel } from '@/features/reservations/model/labels';
import type { ReservationRowView } from '@/features/reservations/model/row-view';

/**
 * Variante en tarjetas para móvil (una columna) y tablet (dos columnas): conserva todos los
 * datos de la fila sin desplazamiento horizontal.
 */
export function ReservationsCardList({ rows }: { rows: ReservationRowView[] }) {
  return (
    <ul className="-mb-px grid sm:grid-cols-2">
      {rows.map((row) => (
        <li
          key={row.reservationId}
          className="flex flex-col gap-2.5 border-b px-4 py-4 sm:px-5 sm:odd:border-r"
        >
          <div className="min-w-0">
            <p className="font-medium break-all tabular-nums">Reserva #{row.reservationId}</p>
            <p className="mt-0.5 text-[13px] tabular-nums">
              <span className="text-muted-foreground">{row.weekday} </span>
              {row.date} · {row.time}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <ReservationStatusBadge
              status={row.status}
              stale={row.stale}
              rescheduled={row.rescheduled}
            />
            <span className="text-[13px] break-all text-muted-foreground">
              {row.clinicLabel} · {formatClientLabel(row.clientId)}
            </span>
          </div>
          <div className="mt-auto flex items-end justify-between gap-3 pt-1">
            <div className="min-w-0">
              <p className="mb-0.5 text-xs text-muted-foreground">Estimación</p>
              <ScoreList scores={row.scores} />
            </div>
            <div className="-mr-2 shrink-0">
              <DetailLink row={row} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
