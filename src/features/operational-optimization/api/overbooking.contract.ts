import { z } from 'zod';

import {
  authorshipFields,
  envelopeSchema,
  predictionRunIdSchema,
  probabilitySchema,
  recordIdSchema,
  recordListSchema,
} from '@/features/operational-optimization/api/records.contract';
import {
  OVERBOOKING_STATUS_LABELS,
  overbookingStatusSchema,
} from '@/features/operational-optimization/api/summary.contract';
import { modelKeySchema } from '@/features/prediction-models/api/contract';
import { experimentalRiskLevelSchema } from '@/features/reservation-risk/api/experimental-risk.contract';
import { isoDateTimeSchema, reasonSchema } from '@/lib/api/schemas';

/**
 * HU-06 · Habilitación de horarios para sobreasignación (marca para análisis posterior).
 * `GET …/overbooking-authorization`, `POST …/overbooking-authorizations` y
 * `GET /overbooking-authorizations`. Fuente: `OperationalHttpSchemas.ts`,
 * `GetOverbookingAuthorizationSchema.ts` y `EnableOverbookingSchema.ts`.
 */

/** Motivos de `overbooking_eligibility_v1` (mensajes en español provistos por el backend). */
export const INELIGIBILITY_CODES = [
  'ALREADY_ENABLED',
  'RESERVATION_NOT_SCHEDULED',
  'APPOINTMENT_NOT_FUTURE',
  'NOT_SCORED',
  'EXPERIMENTAL_BAND_UNAVAILABLE',
  'PREDICTION_NOT_HIGH',
  'RESEARCH_POLICY_NOT_CURRENT',
  'PREDICTION_NOT_LATEST',
] as const;

export const overbookingAuthorizationSchema = z.object({
  authorizationId: recordIdSchema,
  reservationId: recordIdSchema,
  clinicId: z.number().int(),
  appointmentAt: isoDateTimeSchema,
  status: z.literal('ENABLED'),
  statusLabel: z.literal(OVERBOOKING_STATUS_LABELS.ENABLED),
  enabledAt: isoDateTimeSchema,
  modelKey: modelKeySchema,
  modelVersion: z.string(),
  predictionRunId: z.string(),
  /** Banda EXPERIMENTAL (research v2) del modelo elegido al autorizar; no es riesgo operativo. */
  riskBandAtAuthorization: z.literal('HIGH'),
  probabilityNoShowAtAuthorization: probabilitySchema,
  researchPolicyHash: z.string(),
  researchPolicyVersion: z.string(),
  scoredAt: isoDateTimeSchema,
  eligibilityRuleVersion: z.literal('overbooking_eligibility_v1'),
  ...authorshipFields,
});
export type OverbookingAuthorization = z.infer<typeof overbookingAuthorizationSchema>;

export const overbookingCandidateSchema = z.object({
  modelKey: modelKeySchema,
  predictionRunId: z.string(),
  probabilityNoShow: probabilitySchema,
  scoredAt: isoDateTimeSchema,
  experimentalRiskLevel: experimentalRiskLevelSchema.nullable(),
  researchPolicyHash: z.string().nullable(),
  eligible: z.boolean(),
  reasons: z.array(reasonSchema),
});
export type OverbookingCandidate = z.infer<typeof overbookingCandidateSchema>;

/** Elegibilidad calculada por el BACKEND: el frontend no la recalcula ni la suaviza. */
export const overbookingEligibilitySchema = z.object({
  ruleVersion: z.literal('overbooking_eligibility_v1'),
  eligible: z.boolean(),
  reasons: z.array(reasonSchema),
  candidates: z.array(overbookingCandidateSchema),
});

export const overbookingStateSchema = z.object({
  reservationId: z.string(),
  enabled: z.boolean(),
  status: overbookingStatusSchema,
  statusLabel: z.string(),
  authorization: overbookingAuthorizationSchema.nullable(),
  eligibility: overbookingEligibilitySchema,
});
export type OverbookingState = z.infer<typeof overbookingStateSchema>;

export const overbookingStateEnvelopeSchema = envelopeSchema(overbookingStateSchema);

/** Cuerpo estricto del POST: el cliente NO envía riesgo, sede, fechas ni autor. */
export const enableOverbookingRequestSchema = z
  .object({ modelKey: modelKeySchema, predictionRunId: predictionRunIdSchema })
  .strict();
export type EnableOverbookingRequest = z.infer<typeof enableOverbookingRequestSchema>;

/** 201 creada · 200 reintento idéntico (`replayed=true`). */
export const enableOverbookingResponseSchema = envelopeSchema(
  overbookingAuthorizationSchema.extend({ enabled: z.literal(true), replayed: z.boolean() }),
);
export type EnableOverbookingResponse = z.infer<typeof enableOverbookingResponseSchema>['data'];

export const overbookingAuthorizationListSchema = recordListSchema(overbookingAuthorizationSchema);
export type OverbookingAuthorizationList = z.infer<typeof overbookingAuthorizationListSchema>;
