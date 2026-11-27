import {
  compareModelKeys,
  resolveModelIdentity,
} from '@/features/prediction-models/model/model-identity';
import type { ModelResult } from '@/features/reservation-risk/api/risk.contract';
import { formatLimaDateTime } from '@/lib/dates/lima';
import { formatPercentage } from '@/lib/format/percentage';

/**
 * Descripción de los runs de predicción registrados para que recepción pueda distinguirlos sin
 * ver identificadores técnicos. Solo usa los scores persistidos de `GET …/risk`.
 */
export interface PredictionRunOption {
  predictionRunId: string;
  scoredAt: string;
  models: { modelKey: string; label: string; percentageText: string }[];
}

export function toPredictionRunOptions(models: ModelResult[]): PredictionRunOption[] {
  const byRun = new Map<string, PredictionRunOption>();
  for (const model of [...models].sort((a, b) => compareModelKeys(a.modelKey, b.modelKey))) {
    const option = byRun.get(model.predictionRunId) ?? {
      predictionRunId: model.predictionRunId,
      scoredAt: model.scoredAt,
      models: [],
    };
    option.models.push({
      modelKey: model.modelKey,
      label: resolveModelIdentity(model.modelKey, null, model.algorithm).label,
      percentageText: formatPercentage(model.percentageNoShow),
    });
    byRun.set(model.predictionRunId, option);
  }
  return [...byRun.values()];
}

export interface RunChoice {
  predictionRunId: string;
  label: string;
}

/**
 * Opciones enviables al POST de HU-07: EXCLUSIVAMENTE `availablePredictionRunIds` del backend.
 * Si un run no figura en la estimación visible, se identifica por su posición, sin inventar datos.
 */
export function attendanceRunChoices(
  availableRunIds: string[],
  runs: PredictionRunOption[],
): RunChoice[] {
  return availableRunIds.map((predictionRunId, index) => {
    const run = runs.find((item) => item.predictionRunId === predictionRunId);
    if (!run) return { predictionRunId, label: `Estimación registrada ${index + 1}` };
    const models = run.models.map((model) => `${model.label} ${model.percentageText}`).join(' · ');
    return { predictionRunId, label: `${models} (${formatLimaDateTime(run.scoredAt)})` };
  });
}
