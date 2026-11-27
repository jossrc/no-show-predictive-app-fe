import { ClipboardList } from 'lucide-react';
import type { ReactNode } from 'react';

import { DevelopmentDiagnostics } from '@/components/diagnostics/DevelopmentDiagnostics';
import { EmptyState } from '@/components/shared/EmptyState';
import { Notice } from '@/components/shared/Notice';
import {
  listAttendanceOutcomes,
  listOverbookingAuthorizations,
  listSpaceRecoveryOutcomes,
} from '@/features/operational-optimization/api/operational.server';
import {
  type RecordList,
  toRecordListParams,
} from '@/features/operational-optimization/api/records.contract';
import {
  BlockError,
  RecordDetailLink,
} from '@/features/operational-optimization/components/BlockParts';
import { OutcomesDialog } from '@/features/operational-optimization/components/OutcomesDialog';
import { ResponsiveRecords } from '@/features/operational-optimization/components/ResponsiveRecords';
import {
  ATTENDANCE_COLUMNS,
  AUTHORIZATION_COLUMNS,
  RECOVERY_COLUMNS,
} from '@/features/operational-optimization/components/tracking-columns';
import { operationalListDiagnostics } from '@/features/operational-optimization/model/diagnostics';
import type {
  OperationalQuery,
  TrackingView,
} from '@/features/operational-optimization/model/query';
import {
  toAttendanceRow,
  toAuthorizationRow,
  toRecoveryRow,
} from '@/features/operational-optimization/model/tracking-view';
import {
  blockPageHrefs,
  buildOperationalHref,
  currentOperationalHref,
  pageNumberOf,
  toTrackingListQuery,
} from '@/features/operational-optimization/model/urls';
import { CursorPagination } from '@/features/reservations/components/CursorPagination';
import type { ApiResult } from '@/lib/api/result';

const VIEW_CONTEXT: Readonly<
  Record<TrackingView, { feature: string; story: string; endpoint: string; empty: string }>
> = {
  authorizations: {
    feature: 'Horarios habilitados',
    story: 'HU-06 · HU-07 · HU-08',
    endpoint: 'GET /api/v1/overbooking-authorizations',
    empty: 'No hay horarios habilitados para sobreasignación con citas en este período.',
  },
  attendance: {
    feature: 'Asistencia registrada',
    story: 'HU-07',
    endpoint: 'GET /api/v1/attendance-outcomes',
    empty: 'No hay resultados de asistencia registrados para citas de este período.',
  },
  recovery: {
    feature: 'Espacios recuperados',
    story: 'HU-08',
    endpoint: 'GET /api/v1/space-recovery-outcomes',
    empty: 'No hay resultados de recuperación registrados para citas de este período.',
  },
};

const NOUN = ['registro', 'registros'] as const;

/** Estructura común: error localizado, vacío explícito, registros y paginación por cursor. */
function RecordsBlock<T>(props: {
  query: OperationalQuery;
  result: ApiResult<RecordList<T>>;
  render: (records: T[], backHref: string) => ReactNode;
  footer?: (records: T[]) => ReactNode;
}) {
  const { query, result, render, footer } = props;
  const context = VIEW_CONTEXT[query.view];
  const pages = blockPageHrefs(
    query,
    'track',
    result.ok ? result.data.pagination.nextCursor : null,
  );
  const diagnostics = operationalListDiagnostics(
    context,
    toRecordListParams(toTrackingListQuery(query)),
    result,
  );
  if (!result.ok) {
    return (
      <BlockError
        error={result.error}
        subject="el seguimiento operativo"
        firstPageHref={pages.first}
        withoutClinicHref={buildOperationalHref({ ...query, clinicId: null }, { view: query.view })}
        diagnostics={diagnostics}
      />
    );
  }
  const records = result.data.data;
  return (
    <>
      <div className="flex justify-end px-3 pt-2 empty:hidden">
        <DevelopmentDiagnostics subject={context.feature} sections={diagnostics} />
      </div>
      {records.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Sin registros" description={context.empty} />
      ) : (
        render(records, currentOperationalHref(query))
      )}
      {records.length > 0 && footer?.(records)}
      <div className="border-t px-5 py-3">
        <CursorPagination
          label={`Paginación de ${context.feature.toLowerCase()}`}
          noun={NOUN}
          pageNumber={pageNumberOf(query.track)}
          previousHref={pages.previous}
          nextHref={pages.next}
          firstHref={pages.first}
          rowCount={records.length}
          pageSize={result.data.pagination.limit}
        />
      </div>
    </>
  );
}

/** Listado persistido de la vista elegida (una sola lectura por página, sin N+1). */
export async function TrackingResults({ query }: { query: OperationalQuery }) {
  const listQuery = toTrackingListQuery(query);
  if (query.view === 'attendance') {
    return (
      <RecordsBlock
        query={query}
        result={await listAttendanceOutcomes(listQuery)}
        render={(records, backHref) => (
          <ResponsiveRecords
            rows={records.map((record) => toAttendanceRow(record, backHref))}
            rowKey={(row) => row.key}
            columns={ATTENDANCE_COLUMNS}
            caption="Resultados de asistencia registrados"
            actions={(row) => (
              <RecordDetailLink href={row.detailHref} reservationId={row.reservationId} />
            )}
          />
        )}
        footer={(records) => (
          <div className="border-t px-5 py-3">
            <Notice>
              {[...new Set(records.map((record) => record.comparisonNotice))].join(' ')}
            </Notice>
          </div>
        )}
      />
    );
  }
  if (query.view === 'recovery') {
    return (
      <RecordsBlock
        query={query}
        result={await listSpaceRecoveryOutcomes(listQuery)}
        render={(records, backHref) => (
          <ResponsiveRecords
            rows={records.map((record) => toRecoveryRow(record, backHref))}
            rowKey={(row) => row.key}
            columns={RECOVERY_COLUMNS}
            caption="Resultados de recuperación de espacios registrados"
            actions={(row) => (
              <RecordDetailLink href={row.detailHref} reservationId={row.reservationId} />
            )}
          />
        )}
      />
    );
  }
  return (
    <RecordsBlock
      query={query}
      result={await listOverbookingAuthorizations(listQuery)}
      render={(records, backHref) => (
        <ResponsiveRecords
          rows={records.map((record) => toAuthorizationRow(record, backHref))}
          rowKey={(row) => row.key}
          columns={AUTHORIZATION_COLUMNS}
          caption="Horarios habilitados para sobreasignación"
          actions={(row) => (
            <>
              <OutcomesDialog reservationId={row.reservationId} context={row.context} />
              <RecordDetailLink href={row.detailHref} reservationId={row.reservationId} />
            </>
          )}
        />
      )}
    />
  );
}
