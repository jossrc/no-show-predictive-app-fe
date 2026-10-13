import type { ModelCatalog } from '@/features/prediction-models/api/contract';
import {
  compareModelKeys,
  resolveModelIdentity,
} from '@/features/prediction-models/model/model-identity';
import type { ScoreSummary } from '@/features/reservation-risk/api/risk.contract';
import { RELATIVE_BAND_OPTION_LABELS } from '@/features/reservations/model/labels';
import { formatPercentage } from '@/lib/format/percentage';

export interface ScoreView {
  modelKey: string;
  label: string;
  shortLabel: string;
  percentageNoShow: number;
  percentageText: string;
  experimentalLabel: string | null;
  /** Modelo seleccionado en el filtro (`modelKey` de la consulta). */
  selected: boolean;
}

/**
 * Scores persistidos ordenados con el modelo seleccionado primero y luego por clave
 * (no por posición en el arreglo). No existe «modelo ganador» ni promedio.
 */
export function toScoreViews(
  scores: ScoreSummary[],
  selectedModelKey: string,
  catalog: ModelCatalog | null,
): ScoreView[] {
  return [...scores]
    .sort((a, b) => {
      if (a.modelKey === selectedModelKey) return -1;
      if (b.modelKey === selectedModelKey) return 1;
      return compareModelKeys(a.modelKey, b.modelKey);
    })
    .map((score) => {
      const identity = resolveModelIdentity(score.modelKey, catalog);
      return {
        modelKey: score.modelKey,
        label: identity.label,
        shortLabel: identity.known ? identity.shortLabel : '?',
        percentageNoShow: score.percentageNoShow,
        percentageText: formatPercentage(score.percentageNoShow),
        experimentalLabel: score.experimentalRisk
          ? RELATIVE_BAND_OPTION_LABELS[score.experimentalRisk.level]
          : null,
        selected: score.modelKey === selectedModelKey,
      };
    });
}
