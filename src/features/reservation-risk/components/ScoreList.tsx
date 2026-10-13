import type { ScoreView } from '@/features/reservation-risk/model/score-view';
import { cn } from '@/lib/utils';

export const NO_ESTIMATE_TEXT = 'Sin estimación';

/**
 * Banda y modelo en el listado. Sin score se indica «Sin estimación». Sin colores de riesgo.
 */
export function ScoreList({ scores }: { scores: ScoreView[] }) {
  if (scores.length === 0) {
    return <span className="text-[13px] text-muted-foreground">{NO_ESTIMATE_TEXT}</span>;
  }
  const highest = Math.max(...scores.map((score) => score.percentageNoShow));
  return (
    <ul className="space-y-0.5">
      {scores.map((score) => {
        const highestPrediction = score.percentageNoShow === highest;
        return (
          <li
            key={score.modelKey}
            className={cn(
              'text-[13px]',
              highestPrediction ? 'font-semibold text-foreground' : 'text-muted-foreground',
            )}
          >
            {score.experimentalLabel ? `${score.experimentalLabel} · ${score.label}` : score.label}
          </li>
        );
      })}
    </ul>
  );
}
