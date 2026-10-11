import { ModelVersionNote } from '@/features/prediction-models/components/ModelVersionNote';
import type { ModelSlot } from '@/features/reservation-risk/model/risk-view';
import { formatLimaDateTime } from '@/lib/dates/lima';
import { formatPercentage } from '@/lib/format/percentage';

/**
 * Estimación de un modelo independiente. Sin colores ni umbrales de riesgo: la cifra es
 * una probabilidad exploratoria de la etiqueta NO_SHOW_CANDIDATE.
 */
export function ModelScoreCard({ slot }: { slot: ModelSlot }) {
  const { identity, result } = slot;
  const title = identity.label;

  if (!result) {
    return (
      <article className="flex flex-col justify-between rounded-lg border border-dashed p-4">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          Sin estimación registrada para este modelo.
        </p>
      </article>
    );
  }

  return (
    <article className="rounded-lg border bg-surface-subtle p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-[11px] text-muted-foreground">Exploratoria</span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
        {formatPercentage(result.percentageNoShow)}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Probabilidad estimada de inasistencia (etiqueta {result.target})
      </p>
      <div className="mt-3 space-y-1 border-t pt-3">
        <ModelVersionNote modelVersion={result.modelVersion} modelHash={result.modelHash} />
        <p className="text-[11px] text-muted-foreground">
          Evaluada el {formatLimaDateTime(result.scoredAt)}
        </p>
      </div>
    </article>
  );
}
