import { MODEL_KEYS, type ModelCatalog } from '@/features/prediction-models/api/contract';
import {
  compareModelKeys,
  type ModelIdentity,
  resolveModelIdentity,
} from '@/features/prediction-models/model/model-identity';
import type { ModelResult, RiskAssessment } from '@/features/reservation-risk/api/risk.contract';

export interface ModelSlot {
  modelKey: string;
  identity: ModelIdentity;
  /** null: el modelo existe en el catálogo pero no tiene estimación registrada. */
  result: ModelResult | null;
}

/**
 * Un bloque por modelo, identificado por `modelKey`. Incluye modelos del catálogo sin
 * resultado y modelos desconocidos devueltos por la API (sin descartarlos).
 */
export function buildModelSlots(risk: RiskAssessment, catalog: ModelCatalog | null): ModelSlot[] {
  const expected = catalog ? catalog.models.map((model) => model.modelKey) : [...MODEL_KEYS];
  const keys = new Set([...expected, ...risk.models.map((model) => model.modelKey)]);
  return [...keys].sort(compareModelKeys).map((modelKey) => {
    const result = risk.models.find((model) => model.modelKey === modelKey) ?? null;
    return {
      modelKey,
      identity: resolveModelIdentity(modelKey, catalog, result?.algorithm),
      result,
    };
  });
}

export interface PredictionRequestAvailability {
  allowed: boolean;
  /** Explicación contextual cuando la acción no corresponde. */
  reason: string | null;
}

/**
 * La solicitud explícita solo se ofrece cuando puede aportar un resultado nuevo:
 * NOT_SCORED, o AVAILABLE con algún modelo esperado sin estimación. Nunca con NOT_SCORABLE.
 */
export function predictionRequestAvailability(
  risk: RiskAssessment,
  slots: ModelSlot[],
): PredictionRequestAvailability {
  if (risk.status === 'NOT_SCORABLE') {
    return {
      allowed: false,
      reason: 'No contamos con información suficiente para calcular una estimación.',
    };
  }
  if (risk.status === 'NOT_SCORED') return { allowed: true, reason: null };
  const missing = slots.some((slot) => slot.identity.known && slot.result === null);
  return missing
    ? { allowed: true, reason: null }
    : {
        allowed: false,
        reason: 'Todos los modelos disponibles ya tienen una estimación.',
      };
}
