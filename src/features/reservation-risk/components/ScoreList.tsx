import type { ScoreView } from '@/features/reservation-risk/model/score-view';
import { cn } from '@/lib/utils';

/**
 * Probabilidades persistidas por modelo, identificadas por su clave. Sin score se muestra un
 * guion con texto accesible: nunca `0 %`.
 */
export function ScoreList({ scores, emptyLabel }: { scores: ScoreView[]; emptyLabel: string }) {
  if (scores.length === 0) {
    return (
      <span className="text-muted-foreground">
        <span aria-hidden="true">—</span>
        <span className="sr-only">{emptyLabel}</span>
      </span>
    );
  }
  return (
    <ul className="space-y-0.5">
      {scores.map((score) => (
        <li key={score.modelKey} className="flex items-baseline gap-2 tabular-nums">
          <span
            title={score.label}
            className="w-8 shrink-0 text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
          >
            {score.shortLabel}
            <span className="sr-only"> ({score.label})</span>
          </span>
          <span
            className={cn(
              score.selected ? 'font-semibold text-foreground' : 'text-muted-foreground',
            )}
          >
            {score.percentageText}
          </span>
        </li>
      ))}
    </ul>
  );
}
