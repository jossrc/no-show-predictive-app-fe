import { CircleCheck, CircleX } from 'lucide-react';

import { DescriptionList } from '@/components/shared/DescriptionList';
import type { AttendanceOutcome } from '@/features/operational-optimization/api/attendance.contract';
import {
  ATTENDANCE_LABELS,
  COMPARISON_THRESHOLD_NOTE,
} from '@/features/operational-optimization/model/labels';
import {
  type ComparisonView,
  toComparisonViews,
} from '@/features/operational-optimization/model/outcome-view';
import { formatLimaDateTime } from '@/lib/dates/lima';
import { cn } from '@/lib/utils';

/**
 * HU-07 · Resultado real registrado y su comparación GUARDADA con la predicción asociada, por
 * modelo (sin mezclar RF y XGBoost ni recalcular). Solo lectura: no existe edición.
 */
export function AttendanceRecord({ outcome }: { outcome: AttendanceOutcome }) {
  const comparisons = toComparisonViews(outcome.comparisons);
  const scoredAt = outcome.comparisons[0]?.scoredAt;
  return (
    <div className="space-y-3">
      <DescriptionList
        items={[
          { term: 'Resultado registrado', value: ATTENDANCE_LABELS[outcome.attendanceStatus] },
          { term: 'Registrado el', value: formatLimaDateTime(outcome.recordedAt) },
          ...(scoredAt
            ? [{ term: 'Estimación asociada', value: `del ${formatLimaDateTime(scoredAt)}` }]
            : []),
        ]}
      />
      {comparisons.length > 0 && (
        <div className="space-y-2">
          <p className="text-[13px] font-medium">¿La estimación coincidió con lo ocurrido?</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {comparisons.map((comparison) => (
              <ComparisonCard key={comparison.modelKey} comparison={comparison} />
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">{COMPARISON_THRESHOLD_NOTE}</p>
        </div>
      )}
      <p className="text-xs text-pretty text-muted-foreground">{outcome.comparisonNotice}</p>
    </div>
  );
}

function ComparisonCard({ comparison }: { comparison: ComparisonView }) {
  const Icon = comparison.matches ? CircleCheck : CircleX;
  return (
    <li className="space-y-1.5 rounded-lg border bg-surface-subtle px-3 py-2.5 text-[13px]">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{comparison.label}</p>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium',
            comparison.matches ? 'text-success' : 'text-muted-foreground',
          )}
        >
          <Icon aria-hidden="true" className="size-3.5" />
          {comparison.matchText}
        </span>
      </div>
      <dl className="space-y-0.5 text-muted-foreground tabular-nums">
        <div className="flex justify-between gap-2">
          <dt>Estimación</dt>
          <dd className="text-foreground">{comparison.probabilityText}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Predicción</dt>
          <dd className="text-foreground">{comparison.predictedText}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Observado</dt>
          <dd className="text-foreground">{comparison.observedText}</dd>
        </div>
      </dl>
      <p className="text-[11px] text-muted-foreground tabular-nums">
        Umbral provisional: {comparison.thresholdText}
      </p>
    </li>
  );
}
