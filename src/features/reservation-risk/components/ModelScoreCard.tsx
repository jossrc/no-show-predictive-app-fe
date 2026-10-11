import type { ModelSlot } from '@/features/reservation-risk/model/risk-view';
import { formatLimaDateTime } from '@/lib/dates/lima';
import { formatPercentage } from '@/lib/format/percentage';

/**
 * Estimación de un modelo independiente: sin colores ni umbrales de riesgo, sin promedio ni
 * ganador. La versión y el hash del modelo se consultan en el diagnóstico de desarrollo.
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
