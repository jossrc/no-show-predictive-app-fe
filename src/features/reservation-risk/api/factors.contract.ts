import { z } from 'zod';

import { algorithmSchema } from '@/features/prediction-models/api/contract';
import { experimentalRiskSummarySchema } from '@/features/reservation-risk/api/experimental-risk.contract';
import { isoDateTimeSchema, requestIdSchema, riskPolicyStatusSchema } from '@/lib/api/schemas';

/** HU-05: `GET …/risk/factors`. Fuente: GetRiskFactorsSchema.ts del backend. */

export const TOP_K_MIN = 1;
export const TOP_K_MAX = 10;
export const DEFAULT_TOP_K = 5;

export const factorDirectionSchema = z.enum([
  'increases_model_output',
  'decreases_model_output',
  'neutral',
]);
export type FactorDirection = z.infer<typeof factorDirectionSchema>;

export const riskFactorSchema = z.object({
  featureName: z.string(),
  label: z.string(),
  direction: factorDirectionSchema,
  contribution: z.number(),
  absoluteContribution: z.number().min(0),
  sensitiveAttribute: z.boolean(),
});
export type RiskFactor = z.infer<typeof riskFactorSchema>;

/** RF: `probability` + `identity`. XGBoost: `log_odds` + `sigmoid` (no son puntos porcentuales). */
export const outputSpaceSchema = z.enum(['probability', 'log_odds']);
export type OutputSpace = z.infer<typeof outputSpaceSchema>;

export const riskFactorsSchema = z.object({
  reservationId: z.string(),
  snapshot: z.object({
    predictionAt: isoDateTimeSchema,
    featureVersion: z.string(),
    builderVersion: z.string(),
    snapshotHash: z.string(),
  }),
  model: z.object({
    modelKey: z.string(),
    algorithm: algorithmSchema,
    modelVersion: z.string(),
    modelHash: z.string(),
    validationStatus: z.string(),
    calibrationStatus: z.string(),
    operationalUseAllowed: z.literal(false),
  }),
  probabilityNoShow: z.number().min(0).max(1),
  percentageNoShow: z.number().min(0).max(100),
  persistedScore: z.object({
    available: z.boolean(),
    sameModelIdentity: z.boolean(),
    probabilityNoShow: z.number().nullable(),
    experimentalRisk: experimentalRiskSummarySchema.nullable(),
  }),
  explanation: z.object({
    method: z.literal('tree_shap'),
    outputSpace: outputSpaceSchema,
    outputLink: z.enum(['identity', 'sigmoid']),
    units: z.string(),
    baseValue: z.number(),
    modelOutputInExplanationSpace: z.number(),
    reconstructedOutputInExplanationSpace: z.number(),
    additivityError: z.number().min(0),
    otherFeaturesContribution: z.number(),
    topK: z.number().int(),
    totalFeatureCount: z.number().int(),
    factors: z.array(riskFactorSchema),
  }),
  interpretation: z.object({
    scope: z.literal('local_association_not_causality'),
    note: z.string(),
    unitsNote: z.string(),
    sensitiveAttributesNote: z.string(),
  }),
  riskLevel: z.null(),
  riskPolicyStatus: riskPolicyStatusSchema,
});
export type RiskFactors = z.infer<typeof riskFactorsSchema>;

export const riskFactorsEnvelopeSchema = z.object({
  data: riskFactorsSchema,
  requestId: requestIdSchema,
});
