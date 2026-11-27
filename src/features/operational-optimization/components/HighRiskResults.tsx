import { ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

import { DevelopmentDiagnostics } from '@/components/diagnostics/DevelopmentDiagnostics';
import { EmptyState } from '@/components/shared/EmptyState';
import { Notice } from '@/components/shared/Notice';
import {
  BlockError,
  RecordDetailLink,
} from '@/features/operational-optimization/components/BlockParts';
import { OverbookingDialog } from '@/features/operational-optimization/components/OverbookingDialog';
import { OverbookingMarkBadge } from '@/features/operational-optimization/components/OverbookingMarkBadge';
import {
  type RecordColumn,
  ResponsiveRecords,
} from '@/features/operational-optimization/components/ResponsiveRecords';
import { operationalListDiagnostics } from '@/features/operational-optimization/model/diagnostics';
import {
  type HighRiskRowView,
  toHighRiskRowView,
} from '@/features/operational-optimization/model/high-risk-view';
import { EXPERIMENTAL_BAND_NOTICE } from '@/features/operational-optimization/model/labels';
import type { OperationalQuery } from '@/features/operational-optimization/model/query';
import {
  blockPageHrefs,
  buildOperationalHref,
  currentOperationalHref,
  pageNumberOf,
  toHighRiskListQuery,
} from '@/features/operational-optimization/model/urls';
import type { ModelKey } from '@/features/prediction-models/api/contract';
import { resolveModelIdentity } from '@/features/prediction-models/model/model-identity';
import { listReservations } from '@/features/reservations/api/reservations.server';
import { CursorPagination } from '@/features/reservations/components/CursorPagination';
import { ReservationStatusBadge } from '@/features/reservations/components/ReservationStatusBadge';
import { toBackendParams } from '@/features/reservations/model/list-url';

const COLUMNS: RecordColumn<HighRiskRowView>[] = [
  {
    key: 'reservation',
    header: 'Reserva',
    primary: true,
    cell: (row) => (
      <span className="tabular-nums">
        <span className="block font-medium">#{row.reservationId}</span>
        <span className="block text-xs font-normal text-muted-foreground">
          Cliente #{row.clientId}
        </span>
      </span>
    ),
  },
  {
    key: 'appointment',
    header: 'Fecha y hora',
    className: 'whitespace-nowrap',
    cell: (row) => (
      <span className="tabular-nums">
        <span className="text-muted-foreground">{row.weekday} </span>
        {row.date} · {row.time}
      </span>
    ),
  },
  { key: 'clinic', header: 'Sede', className: 'whitespace-nowrap', cell: (row) => row.clinicLabel },
  {
    key: 'risk',
    header: 'Riesgo',
    className: 'whitespace-nowrap',
    cell: (row) => (
      <span className="text-[13px]">
        <span className="block font-medium">{row.bandLabel ?? 'Sin banda'}</span>
        <span className="block text-xs text-muted-foreground tabular-nums">
          {row.estimateText ?? 'Sin estimación'}
        </span>
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Estado',
    cell: (row) => <ReservationStatusBadge status={row.status} />,
  },
  {
    key: 'management',
    header: 'Gestión',
    cell: (row) => <OverbookingMarkBadge summary={row.overbooking} />,
  },
];

/**
 * La acción solo se ofrece sin marca previa (`enabled=false`); con `null` no se asume nada. El
 * diálogo permanece montado tras habilitar para que el resultado siga visible.
 */
function RowActions({ row, modelKey }: { row: HighRiskRowView; modelKey: ModelKey }) {
  return (
    <>
      <OverbookingDialog
        reservationId={row.reservationId}
        context={row.context}
        preferredModelKey={modelKey}
        showTrigger={row.overbooking?.enabled === false}
      />
      <RecordDetailLink href={row.detailHref} reservationId={row.reservationId} />
    </>
  );
}

function BlockNotice({
  storeAvailable,
  children,
}: {
  storeAvailable: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b px-5 py-3">
      {storeAvailable ? (
        <Notice className="flex-1">{EXPERIMENTAL_BAND_NOTICE}</Notice>
      ) : (
        <Notice tone="warning" className="flex-1">
          No podemos consultar las estimaciones ni la gestión operativa en este momento.
        </Notice>
      )}
      {children}
    </div>
  );
}

/**
 * HU-06 · Reservas con banda relativa Alta del modelo elegido (`experimentalRiskLevel=HIGH` +
 * `modelKey`), a partir de predicciones ya registradas. La acción consulta la elegibilidad
 * real del backend antes de confirmar; si la marca ya existe, solo se muestra su estado.
 */
export async function HighRiskResults({ query }: { query: OperationalQuery }) {
  const listQuery = toHighRiskListQuery(query);
  const result = await listReservations(listQuery);
  const pages = blockPageHrefs(query, 'risk', result.ok ? result.data.pagination.nextCursor : null);
  const diagnostics = operationalListDiagnostics(
    { feature: 'Reservas con alto riesgo', story: 'HU-06', endpoint: 'GET /api/v1/reservations' },
    toBackendParams(listQuery),
    result,
  );
  if (!result.ok) {
    return (
      <BlockError
        error={result.error}
        subject="las reservas con alto riesgo"
        firstPageHref={pages.first}
        withoutClinicHref={buildOperationalHref({ ...query, clinicId: null }, { view: query.view })}
        diagnostics={diagnostics}
      />
    );
  }

  const backHref = currentOperationalHref(query);
  const rows = result.data.data.map((item) =>
    toHighRiskRowView(item, { modelKey: query.modelKey, backHref }),
  );
  const model = resolveModelIdentity(query.modelKey).label;
  return (
    <>
      <BlockNotice storeAvailable={result.data.predictiveStoreAvailable}>
        <DevelopmentDiagnostics subject="Reservas con alto riesgo" sections={diagnostics} />
      </BlockNotice>
      {rows.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No hay reservas con banda Alta"
          description={`No encontramos reservas con banda relativa Alta según ${model} en este período. Solo se consideran las estimaciones ya registradas.`}
        />
      ) : (
        <ResponsiveRecords
          rows={rows}
          rowKey={(row) => row.reservationId}
          columns={COLUMNS}
          caption={`Reservas con banda relativa Alta según ${model}`}
          actions={(row) => <RowActions row={row} modelKey={query.modelKey} />}
        />
      )}
      <div className="border-t px-5 py-3">
        <CursorPagination
          label="Paginación de reservas con alto riesgo"
          pageNumber={pageNumberOf(query.risk)}
          previousHref={pages.previous}
          nextHref={pages.next}
          firstHref={pages.first}
          rowCount={rows.length}
          pageSize={result.data.pagination.limit}
        />
      </div>
    </>
  );
}
