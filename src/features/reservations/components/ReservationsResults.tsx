import { CalendarX2, SearchX } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { DevelopmentDiagnostics } from '@/components/diagnostics/DevelopmentDiagnostics';
import { ApiErrorNotice } from '@/components/shared/ApiErrorNotice';
import { EmptyState } from '@/components/shared/EmptyState';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { Button } from '@/components/ui/button';
import { RiskFootnote } from '@/features/reservation-risk/components/RiskFootnote';
import { listReservations } from '@/features/reservations/api/reservations.server';
import {
  describeListScope,
  describeSort,
  reservationsCaption,
} from '@/features/reservations/components/caption';
import { CursorPagination } from '@/features/reservations/components/CursorPagination';
import { ListNotices } from '@/features/reservations/components/ListNotices';
import { ReservationsCardList } from '@/features/reservations/components/ReservationsCardList';
import { ReservationsTable } from '@/features/reservations/components/ReservationsTable';
import { listDiagnostics } from '@/features/reservations/model/diagnostics';
import {
  defaultFilters,
  type ReservationListQuery,
} from '@/features/reservations/model/list-query';
import {
  buildListHref,
  firstPageHref,
  nextPageHref,
  pageNumber,
  previousPageHref,
  RESERVATIONS_PATH,
} from '@/features/reservations/model/list-url';
import { toReservationRowView } from '@/features/reservations/model/row-view';
import type { ApiError } from '@/lib/api/result';
import { getPublicDataMode } from '@/lib/config/server';
import { todayInLima } from '@/lib/dates/calendar';
import { describeApiError } from '@/lib/errors/error-catalog';

interface ResultsProps {
  query: ReservationListQuery;
  listHref: string;
}

/** Errores con una acción propia; el resto se presenta como «No pudimos cargar las reservas». */
const SPECIFIC_ERRORS = new Set(['INVALID_CURSOR', 'UNKNOWN_CLINIC', 'INVALID_PERIOD']);

function ListError({ error, query }: { error: ApiError; query: ReservationListQuery }) {
  const presentation = describeApiError(error);
  const actionLink = (href: string, label: string) => (
    <Button asChild size="sm" variant="outline">
      <Link href={href}>{label}</Link>
    </Button>
  );
  if (error.code === 'INVALID_CURSOR') {
    return (
      <ApiErrorNotice
        error={error}
        action={actionLink(firstPageHref(query), 'Ir a la primera página')}
      />
    );
  }
  if (error.code === 'UNKNOWN_CLINIC') {
    const withoutClinic = buildListHref({ ...query, clinicId: null });
    return (
      <ApiErrorNotice error={error} action={actionLink(withoutClinic, 'Quitar filtro de sede')} />
    );
  }
  if (SPECIFIC_ERRORS.has(error.code)) return <ApiErrorNotice error={error} />;
  return (
    <ApiErrorNotice
      error={error}
      title="No pudimos cargar las reservas"
      description={presentation.retryable ? 'Intenta actualizar la información.' : undefined}
      action={presentation.retryable ? <RefreshButton label="Reintentar" size="sm" /> : null}
    />
  );
}

function EmptyResults({ query }: { query: ReservationListQuery }) {
  if (query.cursor) {
    return (
      <EmptyState
        icon={SearchX}
        title="Esta página ya no tiene reservas"
        description="Los resultados cambiaron desde la última consulta."
        action={
          <Button asChild size="sm" variant="outline">
            <Link href={firstPageHref(query)}>Ir a la primera página</Link>
          </Button>
        }
      />
    );
  }
  const isDefault = buildListHref(query) === buildListHref(defaultFilters(todayInLima()));
  return (
    <EmptyState
      icon={CalendarX2}
      title="No encontramos reservas"
      description="Prueba con otro período o modifica los filtros."
      action={
        isDefault ? null : (
          <Button asChild size="sm" variant="outline">
            <Link href={RESERVATIONS_PATH}>Restablecer filtros</Link>
          </Button>
        )
      }
    />
  );
}

function ResultsToolbar({
  query,
  diagnostics,
}: {
  query: ReservationListQuery;
  diagnostics: ReactNode;
}) {
  const sort = describeSort(query);
  return (
    <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium tabular-nums">{describeListScope(query)}</p>
        {sort && <p className="mt-0.5 text-xs text-muted-foreground">{sort}</p>}
      </div>
      {diagnostics}
    </div>
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
  const diagnostics = (
    <DevelopmentDiagnostics
      subject="Listado de reservas"
      sections={listDiagnostics(query, result)}
    />
  );

  return (
    <div className="space-y-3">
      <ListNotices list={list} dataMode={getPublicDataMode()} />
      <div className="overflow-hidden rounded-xl border bg-card shadow-surface">
        <ResultsToolbar query={query} diagnostics={diagnostics} />
        {rows.length === 0 ? (
          <EmptyResults query={query} />
        ) : (
          <>
            <div className="hidden lg:block">
              <ReservationsTable rows={rows} caption={reservationsCaption(query)} />
            </div>
            <div className="lg:hidden">
              <ReservationsCardList rows={rows} />
            </div>
            <div className="space-y-2.5 border-t px-5 py-3">
              <CursorPagination
                pageNumber={pageNumber(query)}
                previousHref={previousPageHref(query)}
                nextHref={next ? nextPageHref(query, next) : null}
                firstHref={firstPageHref(query)}
                rowCount={rows.length}
              />
              {rows.some((row) => row.scores.length > 0) && <RiskFootnote plural />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
