import { z } from 'zod';

import { algorithmSchema, modelKeySchema } from '@/features/prediction-models/api/contract';
import {
  classificationAvailabilityFields,
  experimentalRiskSchema,
  experimentalRiskSummarySchema,
} from '@/features/reservation-risk/api/experimental-risk.contract';
import {
  isoDateTimeSchema,
  reasonSchema,
  requestIdSchema,
  riskLevelSchema,
  riskPolicyStatusSchema,
} from '@/lib/api/schemas';

/**
 * HU-02: `GET …/risk` y `POST …/predictions`.
 * Fuente: RiskHttpSchemas.ts, ReservationHttpSchemas.ts y RequestReservationPredictionSchema.ts.
 */

export const predictionAvailabilitySchema = z.enum([
  'AVAILABLE_EXPLORATORY',
  'NOT_SCORED',
  'NOT_SCORABLE',
]);
export type PredictionAvailability = z.infer<typeof predictionAvailabilitySchema>;

const probabilitySchema = z.number().min(0).max(1);
const percentageSchema = z.number().min(0).max(100);

/** Score persistido resumido (listado y detalle de reserva). */
export const scoreSummarySchema = z.object({
  modelKey: z.string(),
  modelVersion: z.string(),
  modelHash: z.string(),
  probabilityNoShow: probabilitySchema,
  percentageNoShow: percentageSchema,
  scoredAt: isoDateTimeSchema,
  predictionRunId: z.string(),
  riskLevel: riskLevelSchema,
  experimentalRisk: experimentalRiskSummarySchema.nullable(),
});
export type ScoreSummary = z.infer<typeof scoreSummarySchema>;

export const modelResultSchema = z.object({
  modelKey: z.string(),
  algorithm: algorithmSchema,
  modelVersion: z.string(),
  modelHash: z.string(),
  modelHashSha256: z.string().nullable(),
  scoringApiVersion: z.enum(['v1', 'v2']),
  probabilityNoShow: probabilitySchema,
  percentageNoShow: percentageSchema,
  target: z.literal('NO_SHOW_CANDIDATE'),
  validationStatus: z.string(),
  calibrationStatus: z.string(),
  operationalUseAllowed: z.literal(false),
  riskLevel: riskLevelSchema,
  experimentalRisk: experimentalRiskSchema.nullable(),
  experimentalRiskUnavailableReason: z.literal('SCORED_WITHOUT_RESEARCH_POLICY').nullable(),
  predictionAt: isoDateTimeSchema,
  scoredAt: isoDateTimeSchema,
  predictionRunId: z.string(),
});
export type ModelResult = z.infer<typeof modelResultSchema>;

export const riskSnapshotSchema = z.object({
  snapshotType: z.literal('booking_creation'),
  predictionAt: isoDateTimeSchema,
  appointmentAt: isoDateTimeSchema,
  featureVersion: z.string(),
  builderVersion: z.string(),
  evidenceSource: z.enum(['VERIFIED_BOOKING_SNAPSHOT', 'SYNTHETIC_DEMO_ONLY']),
  snapshotHash: z.string(),
});

/** Comparación descriptiva: sin ensemble ni ganador (ambos campos siempre null). */
export const comparisonSchema = z.object({
  absoluteProbabilityDifference: probabilitySchema,
  absolutePercentagePointDifference: percentageSchema,
  interpretation: z.literal('descriptive_only_not_model_confidence'),
  ensembleProbability: z.null(),
  selectedWinner: z.null(),
});

export const riskAssessmentSchema = z.object({
  reservationId: z.string(),
  status: predictionAvailabilitySchema,
  reasons: z.array(reasonSchema),
  sourceStatus: z.enum(['READ_ONLY_EXISTING_SCHEDULE', 'SYNTHETIC_DEMO_ONLY']),
  sourceFreshness: z.enum(['CURRENT', 'STALE_CLASSIFICATION']).optional(),
  snapshot: riskSnapshotSchema.nullable(),
  models: z.array(modelResultSchema),
  comparison: comparisonSchema.nullable(),
  riskLevel: riskLevelSchema,
  riskPolicyStatus: riskPolicyStatusSchema,
  riskPolicyVersion: z.string().nullable(),
  classificationUnavailable: z.boolean(),
  ...classificationAvailabilityFields,
  classificationBasis: z.literal('RESEARCH_PROVISIONAL').nullable(),
  experimentalRiskNotice: z.string().nullable(),
  validationStatus: z.literal('EXPLORATORY_NOT_VALIDATED'),
  operationalUseAllowed: z.literal(false),
  message: z.string(),
});
export type RiskAssessment = z.infer<typeof riskAssessmentSchema>;

export const riskAssessmentEnvelopeSchema = z.object({
  data: riskAssessmentSchema,
  requestId: requestIdSchema,
});

export const predictionRunSchema = z.object({
  predictionRunId: z.string().nullable(),
  replayed: z.boolean(),
  requestedModelKeys: z.array(z.string()),
  snapshotCreated: z.boolean(),
});

export const predictionResponseEnvelopeSchema = z.object({
  data: riskAssessmentSchema.extend({
    run: predictionRunSchema,
    featureWarnings: z.array(z.string()),
  }),
  requestId: requestIdSchema,
});
export type PredictionResponse = z.infer<typeof predictionResponseEnvelopeSchema>['data'];

/** Cuerpo del POST: `compare` prohíbe `modelKey`; `single` lo exige. */
export const predictionRequestSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('compare') }).strict(),
  z.object({ mode: z.literal('single'), modelKey: modelKeySchema }).strict(),
]);
export type PredictionRequest = z.infer<typeof predictionRequestSchema>;
