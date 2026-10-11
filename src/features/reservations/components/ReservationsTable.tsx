import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AvailabilityBadge } from '@/features/reservation-risk/components/AvailabilityBadge';
import { ScoreList } from '@/features/reservation-risk/components/ScoreList';
import { AVAILABILITY_LABELS } from '@/features/reservation-risk/model/availability';
import { ReservationStatusBadge } from '@/features/reservations/components/ReservationStatusBadge';
import { formatReservationLabel } from '@/features/reservations/model/labels';
import type { ReservationRowView } from '@/features/reservations/model/row-view';

/** Tabla semántica de escritorio. La paginación es del servidor: no se re-pagina aquí. */
export function ReservationsTable({
  rows,
  caption,
}: {
  rows: ReservationRowView[];
  caption: string;
}) {
  return (
    <Table className="min-w-[760px]">
      <caption className="sr-only">{caption}</caption>
      <ReservationsTableHeader />
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.reservationId} className="group">
            <TableCell className="py-3 pl-4">
              <Link
                href={row.detailHref}
                className="font-mono text-[13px] font-medium tabular-nums underline-offset-4 hover:underline"
              >
                #{row.reservationId}
              </Link>
            </TableCell>
            <TableCell className="py-3">
              <div className="tabular-nums">{row.date}</div>
              <div className="text-xs text-muted-foreground tabular-nums">
                {row.weekday} · {row.time}
              </div>
            </TableCell>
            <TableCell className="py-3 text-muted-foreground">{row.clinicLabel}</TableCell>
            <TableCell className="py-3">
              <ReservationStatusBadge
                status={row.status}
                stale={row.stale}
                rescheduled={row.rescheduled}
              />
            </TableCell>
            <TableCell className="py-3">
              <ScoreList scores={row.scores} emptyLabel={AVAILABILITY_LABELS[row.availability]} />
            </TableCell>
            <TableCell className="py-3">
              <AvailabilityBadge availability={row.availability} />
            </TableCell>
            <TableCell className="py-3 pr-4 text-right">
              <Link
                href={row.detailHref}
                aria-label={`Ver detalle de ${formatReservationLabel(row.reservationId)}`}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors group-hover:text-foreground hover:bg-muted"
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ReservationsTableHeader() {
  return (
    <TableHeader className="bg-surface-subtle">
      <TableRow className="hover:bg-transparent">
        <TableHead className="pl-4 text-xs font-medium text-muted-foreground">Reserva</TableHead>
        <TableHead className="text-xs font-medium text-muted-foreground">Cita (Lima)</TableHead>
        <TableHead className="text-xs font-medium text-muted-foreground">Clínica</TableHead>
        <TableHead className="text-xs font-medium text-muted-foreground">Estado</TableHead>
        <TableHead className="text-xs font-medium text-muted-foreground">
          Probabilidad estimada
        </TableHead>
        <TableHead className="text-xs font-medium text-muted-foreground">
          Estado predictivo
        </TableHead>
        <TableHead className="pr-4 text-right text-xs font-medium text-muted-foreground">
          <span className="sr-only">Acciones</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
