import { Notice } from '@/components/shared/Notice';
import { resolveModelIdentity } from '@/features/prediction-models/model/model-identity';
import {
  describeSourceStatus,
  EXPLORATORY_STATUS_TEXT,
  RISK_POLICY_PENDING_TEXT,
} from '@/features/reservation-risk/model/availability';
import type { ReservationList } from '@/features/reservations/api/contract';
import { formatLimaDateTime } from '@/lib/dates/lima';

function staleSummary(list: ReservationList): string | null {
  const stale = list.data.filter((item) => item.sourceFreshness === 'STALE_CLASSIFICATION');
  if (stale.length === 0) return null;
  const cutoff = stale.find((item) => item.classificationCutoffAt)?.classificationCutoffAt;
  const count = stale.length === 1 ? '1 reserva' : `${stale.length} reservas`;
  const cutoffText = cutoff ? ` (corte de clasificación: ${formatLimaDateTime(cutoff)})` : '';
  return `${count} de esta página tiene${stale.length === 1 ? '' : 'n'} la clasificación desactualizada${cutoffText}: la cita ya pasó y su estado puede no reflejar el resultado final.`;
}

/** Avisos derivados exclusivamente de campos de la respuesta del listado. */
export function ListNotices({ list }: { list: ReservationList }) {
  const stale = staleSummary(list);
  const withoutScores =
    list.data.length > 0 && list.data.every((item) => item.risk.probabilities.length === 0);
  const exploratoryOrder = list.sort.semantics === 'EXPLORATORY_SCORE_ORDER';

  return (
    <>
      {list.sourceStatus === 'SYNTHETIC_DEMO_ONLY' && (
        <Notice tone="warning" title="Fuente sintética">
          El backend informa que estos datos provienen de una base de demostración sintética.
        </Notice>
      )}
      {!list.predictiveStoreAvailable && (
        <Notice tone="warning" title="Almacén predictivo no disponible">
          Las probabilidades persistidas no pudieron consultarse. Los datos de las reservas siguen
          siendo válidos.
        </Notice>
      )}
      {stale && <Notice tone="warning">{stale}</Notice>}
      {exploratoryOrder && (
        <Notice>
          Orden exploratorio por la probabilidad de {resolveModelIdentity(list.sort.modelKey).label}{' '}
          (reservas sin estimación al final). No constituye una priorización operativa validada.
        </Notice>
      )}
      {withoutScores && (
        <Notice>Ninguna reserva de esta página tiene probabilidades registradas.</Notice>
      )}
    </>
  );
}

export function ListLegend({ list }: { list: ReservationList }) {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      {EXPLORATORY_STATUS_TEXT}. Las probabilidades estiman la etiqueta proxy NO_SHOW_CANDIDATE y no
      equivalen a certeza de inasistencia.{' '}
      {list.riskPolicyStatus === 'pending_validation' && RISK_POLICY_PENDING_TEXT} Fuente:{' '}
      {describeSourceStatus(list.sourceStatus)}.
    </p>
  );
}
