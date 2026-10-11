import { DevelopmentDiagnostics } from '@/components/diagnostics/DevelopmentDiagnostics';
import { ApiErrorNotice } from '@/components/shared/ApiErrorNotice';
import { Notice } from '@/components/shared/Notice';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { SectionCard } from '@/components/shared/SectionCard';
import type { ReservationDetail } from '@/features/reservations/api/contract';
import { detailDiagnostics } from '@/features/reservations/model/diagnostics';
import { STALE_CLASSIFICATION_TEXT } from '@/features/reservations/model/labels';
import type { ApiResult } from '@/lib/api/result';
import { formatLimaDateTime } from '@/lib/dates/lima';

const TITLE = 'Información de la cita';

function Fact({ term, value }: { term: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{term}</dt>
      <dd className="mt-0.5 font-medium break-words tabular-nums">{value}</dd>
    </div>
  );
}

/**
 * Datos de la reserva que no aparecen en el encabezado. Solo campos del contrato: sin nombres
 * inventados. Los datos técnicos (snapshot, corte, frescura) quedan en el diagnóstico.
 */
export function ReservationFacts({ detail }: { detail: ApiResult<ReservationDetail> }) {
  const diagnostics = (
    <DevelopmentDiagnostics subject={TITLE} sections={detailDiagnostics(detail)} />
  );
  if (!detail.ok) {
    return (
      <SectionCard title={TITLE} actions={diagnostics}>
        <ApiErrorNotice
          error={detail.error}
          action={<RefreshButton label="Reintentar" size="sm" />}
        />
      </SectionCard>
    );
  }

  const reservation = detail.data;
  return (
    <SectionCard title={TITLE} actions={diagnostics}>
      <div className="space-y-4">
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <Fact term="Cliente" value={`#${reservation.clientId}`} />
          <Fact
            term="Reserva creada"
            value={
              reservation.bookingCreatedAt
                ? formatLimaDateTime(reservation.bookingCreatedAt)
                : 'No registrada'
            }
          />
          <Fact
            term="Reprogramación detectada"
            value={reservation.hasRescheduleEvent ? 'Sí' : 'No'}
          />
        </dl>
        {reservation.sourceFreshness === 'STALE_CLASSIFICATION' && (
          <Notice>{STALE_CLASSIFICATION_TEXT}</Notice>
        )}
      </div>
    </SectionCard>
  );
}
