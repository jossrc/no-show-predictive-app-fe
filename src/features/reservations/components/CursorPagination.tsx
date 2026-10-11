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
}

export function describePageCount(pageNumber: number, rowCount: number): string {
  const rows = `${rowCount} ${rowCount === 1 ? 'reserva' : 'reservas'} en esta página`;
  return pageNumber > 1 ? `Página ${pageNumber} · ${rows}` : rows;
}

/**
 * Paginación keyset: sin totales ni número de páginas (el backend no los proporciona).
 * El cursor es opaco; el historial de cursores vive en la URL junto con los filtros.
 */
export function CursorPagination(props: CursorPaginationProps) {
  const { pageNumber, previousHref, nextHref, firstHref, rowCount } = props;
  return (
    <nav
      aria-label="Paginación de reservas"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-[13px] text-muted-foreground tabular-nums">
        {describePageCount(pageNumber, rowCount)}
      </p>
      <div className="flex items-center gap-2">
        {pageNumber > 2 && (
          <Button asChild variant="ghost" size="sm">
            <Link href={firstHref}>Primera página</Link>
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
  // «Siguiente» solo existe con `nextCursor`; «Anterior» solo fuera de la primera página.
  if (!href) return null;
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={href} rel={direction === 'next' ? 'next' : 'prev'}>
        {direction === 'previous' && <ChevronLeft aria-hidden="true" />}
        {label}
        {direction === 'next' && <ChevronRight aria-hidden="true" />}
      </Link>
    </Button>
  );
}
