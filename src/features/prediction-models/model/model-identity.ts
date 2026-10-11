import {
  type Algorithm,
  MODEL_KEYS,
  type ModelCatalog,
  type ModelKey,
} from '@/features/prediction-models/api/contract';

/**
 * Identificación de modelos por `modelKey` (nunca por su posición en un arreglo).
 * El algoritmo de las claves conocidas proviene del contrato del backend
 * (ML_ALGORITHM_BY_MODEL_KEY); el catálogo, cuando está disponible, tiene prioridad.
 */
export const ALGORITHM_LABELS: Readonly<Record<Algorithm, string>> = {
  random_forest: 'Random Forest',
  xgboost: 'XGBoost',
};

const ALGORITHM_SHORT_LABELS: Readonly<Record<Algorithm, string>> = {
  random_forest: 'RF',
  xgboost: 'XGB',
};

const CONTRACT_ALGORITHMS: Readonly<Record<ModelKey, Algorithm>> = {
  random_forest_full_v1: 'random_forest',
  xgboost_full_v1: 'xgboost',
};

export interface ModelIdentity {
  modelKey: string;
  algorithm: Algorithm | null;
  label: string;
  shortLabel: string;
  known: boolean;
}

export function isKnownModelKey(value: string): value is ModelKey {
  return (MODEL_KEYS as readonly string[]).includes(value);
}

function resolveAlgorithm(
  modelKey: string,
  catalog: ModelCatalog | null,
  hint: Algorithm | undefined,
): Algorithm | null {
  if (hint) return hint;
  const fromCatalog = catalog?.models.find((model) => model.modelKey === modelKey);
  if (fromCatalog) return fromCatalog.algorithm;
  return isKnownModelKey(modelKey) ? CONTRACT_ALGORITHMS[modelKey] : null;
}

export function resolveModelIdentity(
  modelKey: string,
  catalog: ModelCatalog | null = null,
  algorithmHint?: Algorithm,
): ModelIdentity {
  const algorithm = resolveAlgorithm(modelKey, catalog, algorithmHint);
  const recognized =
    isKnownModelKey(modelKey) ||
    Boolean(catalog?.models.some((model) => model.modelKey === modelKey));
  if (!algorithm || !recognized) {
    // Clave fuera del contrato/catálogo: se muestra literalmente para no confundirla con RF/XGB.
    const label = algorithm
      ? `${ALGORITHM_LABELS[algorithm]} · ${modelKey}`
      : `Modelo no reconocido (${modelKey})`;
    return { modelKey, algorithm, label, shortLabel: '?', known: false };
  }
  return {
    modelKey,
    algorithm,
    label: ALGORITHM_LABELS[algorithm],
    shortLabel: ALGORITHM_SHORT_LABELS[algorithm],
    known: true,
  };
}

const KEY_ORDER: readonly string[] = MODEL_KEYS;

/** Orden estable de presentación: RF, XGBoost y luego claves desconocidas alfabéticamente. */
export function compareModelKeys(a: string, b: string): number {
  const indexA = KEY_ORDER.indexOf(a);
  const indexB = KEY_ORDER.indexOf(b);
  if (indexA !== -1 || indexB !== -1) {
    return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
  }
  return a.localeCompare(b);
}

/** Claves seleccionables en filtros y explicaciones: catálogo ∩ contrato, o el contrato. */
export function selectableModelKeys(catalog: ModelCatalog | null): ModelKey[] {
  if (!catalog) return [...MODEL_KEYS];
  const fromCatalog = catalog.models.map((model) => model.modelKey).filter(isKnownModelKey);
  return fromCatalog.length > 0
    ? [...new Set(fromCatalog)].sort(compareModelKeys)
    : [...MODEL_KEYS];
}
