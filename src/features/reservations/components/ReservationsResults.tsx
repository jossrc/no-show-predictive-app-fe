import { CalendarX2, SearchX } from 'lucide-react';
import Link from 'next/link';

import { ApiErrorNotice } from '@/components/shared/ApiErrorNotice';
import { EmptyState } from '@/components/shared/EmptyState';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { Button } from '@/components/ui/button';
import { listReservations } from '@/features/reservations/api/reservations.server';
import { reservationsCaption } from '@/features/reservations/components/caption';
import { CursorPagination } from '@/features/reservations/components/CursorPagination';
import { ListLegend, ListNotices } from '@/features/reservations/components/ListNotices';
import { ReservationsCardList } from '@/features/reservations/components/ReservationsCardList';
import { ReservationsTable } from '@/features/reservations/components/ReservationsTable';
import type { ReservationListQuery } from '@/features/reservations/model/list-query';
import {
  buildListHref,
  firstPageHref,
  nextPageHref,
  pageNumber,
  previousPageHref,
} from '@/features/reservations/model/list-url';
import { toReservationRowView } from '@/features/reservations/model/row-view';
import type { ApiError } from '@/lib/api/result';
import { describeApiError } from '@/lib/errors/error-catalog';

interface ResultsProps {
  query: ReservationListQuery;
  listHref: string;
}

function hasNarrowingFilters(query: ReservationListQuery): boolean {
  return query.status !== 'SCHEDULED' || query.clinicId !== null;
}

function ListError({ error, query }: { error: ApiError; query: ReservationListQuery }) {
  const withoutClinic = buildListHref({ ...query, clinicId: null });
  let action = describeApiError(error).retryable ? <RefreshButton label="Reintentar" /> : null;
  if (error.code === 'INVALID_CURSOR') {
    action = (
      <Button asChild size="sm" variant="outline">
        <Link href={firstPageHref(query)}>Ir a la primera página</Link>
      </Button>
    );
  }
  if (error.code === 'UNKNOWN_CLINIC') {
    action = (
      <Button asChild size="sm" variant="outline">
        <Link href={withoutClinic}>Quitar filtro de clínica</Link>
      </Button>
    );
  }
  return <ApiErrorNotice error={error} action={action} />;
}

function EmptyResults({ query }: { query: ReservationListQuery }) {
  if (query.cursor) {
    return (
      <EmptyState
        icon={SearchX}
        title="Esta página ya no tiene reservas"
        description="Los datos pueden haber cambiado desde que se generó el cursor."
        action={
          <Button asChild size="sm" variant="outline">
            <Link href={firstPageHref(query)}>Ir a la primera página</Link>
          </Button>
        }
      />
    );
  }
  if (hasNarrowingFilters(query)) {
    const cleared = buildListHref({ ...query, status: 'SCHEDULED', clinicId: null });
    return (
      <EmptyState
        icon={SearchX}
        title="Sin resultados para los filtros aplicados"
        description="Prueba con otro estado o quita el filtro de clínica. El período se conserva."
        action={
          <Button asChild size="sm" variant="outline">
            <Link href={cleared}>Quitar filtros</Link>
          </Button>
        }
      />
    );
  }
  return (
    <EmptyState
      icon={CalendarX2}
      title="No hay reservas programadas en este período"
      description="Amplía el rango de fechas (máximo 92 días) para consultar otras citas."
    />
  );
}

/** HU-01: resultados del listado. Se renderiza dentro de un Suspense con clave por consulta. */
export async function ReservationsResults({ query, listHref }: ResultsProps) {
  const result = await listReservations(query);
  if (!result.ok) return <ListError error={result.error} query={query} />;

  const list = result.data;
  const context = { selectedModelKey: query.modelKey, listHref, catalog: null };
  const rows = list.data.map((item) => toReservationRowView(item, context));
  const next = list.pagination.nextCursor;

  return (
    <div className="space-y-3">
      <ListNotices list={list} />
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        {rows.length === 0 ? (
          <EmptyResults query={query} />
        ) : (
          <>
            <div className="hidden md:block">
              <ReservationsTable rows={rows} caption={reservationsCaption(query)} />
            </div>
            <div className="md:hidden">
              <ReservationsCardList rows={rows} />
            </div>
            <CursorPagination
              pageNumber={pageNumber(query)}
              previousHref={previousPageHref(query)}
              nextHref={next ? nextPageHref(query, next) : null}
              firstHref={firstPageHref(query)}
              pageSize={list.pagination.limit}
              rowCount={rows.length}
            />
          </>
        )}
      </div>
      <ListLegend list={list} />
    </div>
  );
}
