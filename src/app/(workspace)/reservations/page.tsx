import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Notice } from '@/components/shared/Notice';
import { PageHeader } from '@/components/shared/PageHeader';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { ReservationFilters } from '@/features/reservations/components/ReservationFilters';
import { ReservationsResults } from '@/features/reservations/components/ReservationsResults';
import { ReservationsResultsSkeleton } from '@/features/reservations/components/ReservationsSkeleton';
import {
  parseReservationListParams,
  type RawSearchParams,
} from '@/features/reservations/model/list-query';
import { buildListHref } from '@/features/reservations/model/list-url';
import { todayInLima } from '@/lib/dates/calendar';

export const metadata: Metadata = { title: 'Gestión de reservas' };

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const { query, notices, periodError } = parseReservationListParams(
    await searchParams,
    todayInLima(),
  );
  const listHref = buildListHref(query, { cursor: query.cursor, trail: query.trail });
  const filtersKey = `filters:${buildListHref(query)}`;

  return (
    <>
      <PageHeader
        title="Gestión de reservas"
        description="Consulta y seguimiento de citas programadas."
        actions={<RefreshButton />}
      />
      <ReservationFilters key={filtersKey} initial={query} />
      {notices.length > 0 && (
        <Notice tone="warning" title="Ajustamos algunos filtros" className="mb-4">
          <ul className="list-disc pl-4">
            {notices.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>
        </Notice>
      )}
      {periodError ? (
        <Notice tone="warning" title="Período no válido">
          {periodError} Corrige las fechas en los filtros para consultar reservas.
        </Notice>
      ) : (
        <Suspense
          key={`results:${listHref}`}
          fallback={<ReservationsResultsSkeleton rows={query.limit > 10 ? 8 : query.limit} />}
        >
          <ReservationsResults query={query} listHref={listHref} />
        </Suspense>
      )}
    </>
  );
}
