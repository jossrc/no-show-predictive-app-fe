import type { ExperimentalRiskLevel } from '@/features/reservation-risk/api/experimental-risk.contract';
import type { ModelSlot } from '@/features/reservation-risk/model/risk-view';
import { formatRelativeBand } from '@/features/reservations/model/labels';
import { formatLimaDateTime } from '@/lib/dates/lima';
import { formatPercentage } from '@/lib/format/percentage';
import { cn } from '@/lib/utils';

const BAND_DOT: Readonly<Record<ExperimentalRiskLevel, string>> = {
  LOW: 'bg-success',
  MEDIUM: 'bg-warning',
  HIGH: 'bg-destructive',
};

/**
 * Score y banda persistidos de un modelo independiente. No se calculan umbrales en el frontend.
 */
export function ModelScoreCard({ slot }: { slot: ModelSlot }) {
  const { identity, result } = slot;
  return (
    <article className="min-w-0 px-4 py-4 sm:px-5">
      <h3 className="text-[13px] font-medium text-muted-foreground">{identity.label}</h3>
      {result ? (
        <>
          <p className="mt-1 text-[28px] leading-tight font-semibold tracking-[-0.02em] tabular-nums">
            {formatPercentage(result.percentageNoShow)}
          </p>
          {result.experimentalRisk && (
            <p className="mt-2 flex items-center gap-2 text-[13px] font-medium">
              <span
                aria-hidden="true"
                className={cn(
                  'size-3 shrink-0 rounded-full',
                  BAND_DOT[result.experimentalRisk.level],
                )}
              />
              {formatRelativeBand(result.experimentalRisk.level)}
            </p>
          )}
          {result.experimentalRiskUnavailableReason && (
            <p className="mt-2 text-xs text-muted-foreground">
              Sin banda relativa para esta estimación.
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            Calculada el {formatLimaDateTime(result.scoredAt)}
          </p>
        </>
      ) : (
        <>
          <p className="mt-1 text-lg leading-tight font-medium text-muted-foreground">
            Sin estimación
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Este modelo aún no tiene una estimación para esta cita.
          </p>
        </>
      )}
    </article>
  );
}
