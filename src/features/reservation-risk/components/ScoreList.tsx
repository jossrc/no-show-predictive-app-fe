import type { ScoreView } from '@/features/reservation-risk/model/score-view';
import { cn } from '@/lib/utils';

export const NO_ESTIMATE_TEXT = 'Sin estimación';

/**
 * Probabilidades persistidas por modelo, con el modelo elegido en los filtros primero (y
 * destacado). Sin score se indica «Sin estimación»: nunca `0 %`. Sin colores de riesgo.
 */
export function ScoreList({ scores }: { scores: ScoreView[] }) {
  if (scores.length === 0) {
    return <span className="text-[13px] text-muted-foreground">{NO_ESTIMATE_TEXT}</span>;
  }
  return (
    <ul className="space-y-0.5">
      {scores.map((score, index) => (
        <li key={score.modelKey} className="flex items-baseline gap-2 whitespace-nowrap">
          <span
            className={cn(
              'min-w-[3.25rem] tabular-nums',
              index === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground',
            )}
          >
            {score.percentageText}
          </span>
          <span className="text-xs text-muted-foreground">{score.label}</span>
        </li>
      ))}
    </ul>
  );
}
