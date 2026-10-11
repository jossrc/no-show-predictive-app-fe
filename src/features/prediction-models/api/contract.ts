import { z } from 'zod';

import { requestIdSchema, riskPolicyStatusSchema } from '@/lib/api/schemas';

/**
 * Contratos de soporte: `GET /api/v1/ml/models` y `GET /api/v1/health/ml`.
 * Fuente: ListPredictionModelsSchema.ts y CheckMlServiceSchema.ts del backend.
 */

/** Valores admitidos por los parámetros `modelKey` del backend (MlFeatureContract.ts). */
export const MODEL_KEYS = ['random_forest_full_v1', 'xgboost_full_v1'] as const;
export type ModelKey = (typeof MODEL_KEYS)[number];
export const DEFAULT_MODEL_KEY: ModelKey = 'random_forest_full_v1';
export const modelKeySchema = z.enum(MODEL_KEYS);

export const algorithmSchema = z.enum(['random_forest', 'xgboost']);
export type Algorithm = z.infer<typeof algorithmSchema>;

export const catalogModelSchema = z.object({
  modelKey: z.string(),
  algorithm: algorithmSchema,
  modelVersion: z.string(),
  modelHash: z.string(),
  role: z.string(),
  featureCount: z.number().int(),
  validationStatus: z.string(),
  calibrationStatus: z.string(),
  operationalUseAllowed: z.literal(false),
});
export type CatalogModel = z.infer<typeof catalogModelSchema>;

export const modelCatalogSchema = z.object({
  featureVersion: z.string(),
  defaultModelKey: z.string(),
  models: z.array(catalogModelSchema),
  riskPolicyStatus: riskPolicyStatusSchema,
});
export type ModelCatalog = z.infer<typeof modelCatalogSchema>;

export const modelCatalogEnvelopeSchema = z.object({
  data: modelCatalogSchema,
  requestId: requestIdSchema,
});

/** Health ML no usa el sobre `{ data }`: responde 200 (ok/disabled) o 503 (error). */
export const mlHealthSchema = z.object({
  service: z.literal('ml'),
  status: z.enum(['ok', 'error', 'disabled']),
  message: z.string(),
  servingStatus: z.literal('EXPLORATORY_NOT_VALIDATED').nullable(),
  operationalUseAllowed: z.literal(false),
});
export type MlHealth = z.infer<typeof mlHealthSchema>;
