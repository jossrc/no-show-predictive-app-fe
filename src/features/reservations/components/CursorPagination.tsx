import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

interface CursorPaginationProps {
  pageNumber: number;
  previousHref: string | null;
  /** Solo existe cuando el backend devuelve `pagination.nextCursor`. */
  nextHref: string | null;
  firstHref: string;
  rowCount: number;
  pageSize: number;
  /** Nombre accesible de la navegación (varias paginaciones pueden convivir en una página). */
  label?: string;
  /** Sustantivo de los elementos [singular, plural]. */
  noun?: readonly [string, string];
}

const RESERVATION_NOUN = ['reserva', 'reservas'] as const;

export function describePageCount(
  pageNumber: number,
  rowCount: number,
  noun: readonly [string, string] = RESERVATION_NOUN,
): string {
  const rows = `${rowCount} ${rowCount === 1 ? noun[0] : noun[1]} en esta página`;
  return pageNumber > 1 ? `Página ${pageNumber} · ${rows}` : rows;
}

/**
 * Paginación keyset: sin totales ni número de páginas (el backend no los proporciona).
 * El cursor es opaco; el historial de cursores vive en la URL junto con los filtros.
 */
export function CursorPagination(props: CursorPaginationProps) {
  const { pageNumber, previousHref, nextHref, firstHref, rowCount, pageSize } = props;
  const { label = 'Paginación de reservas', noun = RESERVATION_NOUN } = props;
  return (
    <nav
      aria-label={label}
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="text-[13px] text-muted-foreground tabular-nums">
        <p>{describePageCount(pageNumber, rowCount, noun)}</p>
        <p className="text-xs">
          Hasta {pageSize} {noun[1]} por página
        </p>
      </div>
      <div className="flex items-center gap-2">
        {pageNumber > 2 && (
          <Button asChild variant="ghost" size="sm">
            <Link href={firstHref} prefetch={false}>
              Primera página
            </Link>
          </Button>
        )}
        <PaginationLink href={previousHref} label="Anterior" direction="previous" />
        <PaginationLink href={nextHref} label="Siguiente" direction="next" />
      </div>
    </nav>
  );
}

function PaginationLink({
  href,
  label,
  direction,
}: {
  href: string | null;
  label: string;
  direction: 'previous' | 'next';
}) {
  if (!href) {
    return (
      <Button variant="outline" size="sm" disabled>
        {label}
      </Button>
    );
  }
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={href} prefetch={false} rel={direction === 'next' ? 'next' : 'prev'}>
        {direction === 'previous' && <ChevronLeft aria-hidden="true" />}
        {label}
        {direction === 'next' && <ChevronRight aria-hidden="true" />}
      </Link>
    </Button>
  );
}
