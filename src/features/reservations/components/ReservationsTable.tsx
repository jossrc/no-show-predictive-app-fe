import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScoreList } from '@/features/reservation-risk/components/ScoreList';
import { ReservationStatusBadge } from '@/features/reservations/components/ReservationStatusBadge';
import { formatReservationLabel } from '@/features/reservations/model/labels';
import type { ReservationRowView } from '@/features/reservations/model/row-view';

/** Enlace único por reserva: el nombre accesible incluye el texto visible y el identificador. */
export function DetailLink({ row }: { row: ReservationRowView }) {
  return (
    <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary">
      <Link
        href={row.detailHref}
        aria-label={`Ver detalle de ${formatReservationLabel(row.reservationId)}`}
      >
        Ver detalle
        <ChevronRight aria-hidden="true" />
      </Link>
    </Button>
  );
}

/** Tabla semántica de escritorio. La paginación es del servidor: no se re-pagina aquí. */
export function ReservationsTable({
  rows,
  caption,
}: {
  rows: ReservationRowView[];
  caption: string;
}) {
  return (
    <Table>
      <caption className="sr-only">{caption}</caption>
      <TableHeader className="bg-surface-subtle">
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-5">Reserva</TableHead>
          <TableHead>Fecha y hora</TableHead>
          <TableHead className="hidden xl:table-cell">Cliente</TableHead>
          <TableHead>Sede</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Estimación</TableHead>
          <TableHead className="pr-5 text-right">
            <span className="sr-only">Acción</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.reservationId}>
            <TableCell className="pl-5 font-medium tabular-nums">#{row.reservationId}</TableCell>
            <TableCell className="tabular-nums">
              <span className="text-muted-foreground">{row.weekday} </span>
              {row.date}
              <span className="text-muted-foreground"> · </span>
              {row.time}
            </TableCell>
            <TableCell className="hidden text-muted-foreground tabular-nums xl:table-cell">
              #{row.clientId}
            </TableCell>
            <TableCell className="text-muted-foreground">{row.clinicLabel}</TableCell>
            <TableCell>
              <ReservationStatusBadge
                status={row.status}
                stale={row.stale}
                rescheduled={row.rescheduled}
              />
            </TableCell>
            <TableCell>
              <ScoreList scores={row.scores} />
            </TableCell>
            <TableCell className="pr-3 text-right">
              <DetailLink row={row} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
