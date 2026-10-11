import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

interface CursorPaginationProps {
  pageNumber: number;
  previousHref: string | null;
  /** Solo existe cuando el backend devuelve `pagination.nextCursor`. */
  nextHref: string | null;
  firstHref: string;
  pageSize: number;
  rowCount: number;
}

/**
 * Paginación keyset: sin totales ni número de páginas (el backend no los proporciona).
 * El cursor es opaco; el historial de cursores vive en la URL.
 */
export function CursorPagination(props: CursorPaginationProps) {
  const { pageNumber, previousHref, nextHref, firstHref, pageSize, rowCount } = props;
  return (
    <nav
      aria-label="Paginación de reservas"
      className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs text-muted-foreground tabular-nums">
        Página {pageNumber} · {rowCount} {rowCount === 1 ? 'reserva' : 'reservas'} en esta página
        (máximo {pageSize})
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
  const icon =
    direction === 'previous' ? (
      <ChevronLeft aria-hidden="true" />
    ) : (
      <ChevronRight aria-hidden="true" />
    );
  // «Siguiente» solo existe con `nextCursor`; «Anterior» solo fuera de la primera página.
  if (!href) return null;
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={href} rel={direction === 'next' ? 'next' : 'prev'}>
        {direction === 'previous' && icon}
        {label}
        {direction === 'next' && icon}
      </Link>
    </Button>
  );
}
