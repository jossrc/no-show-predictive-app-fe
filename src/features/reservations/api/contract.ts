import { z } from 'zod';

import {
  classificationAvailabilityFields,
  experimentalRiskPolicySchema,
  experimentalRiskSummarySchema,
} from '@/features/reservation-risk/api/experimental-risk.contract';
import {
  predictionAvailabilitySchema,
  scoreSummarySchema,
} from '@/features/reservation-risk/api/risk.contract';
import {
  isoDateTimeSchema,
  nullableIsoDateTimeSchema,
  reasonSchema,
  requestIdSchema,
  riskLevelSchema,
  riskPolicyStatusSchema,
} from '@/lib/api/schemas';

/**
 * HU-01/HU-03: `GET /api/v1/reservations` y `GET /api/v1/reservations/:reservationId`.
 * Fuente: ReservationHttpSchemas.ts, RiskHttpSchemas.ts (ListItemSchema),
 * ListReservationRisksSchema.ts y GetReservationSchema.ts.
 */

export const reservationStatusSchema = z.enum(['SCHEDULED', 'CANCELLED', 'PAST']);
export type ReservationStatus = z.infer<typeof reservationStatusSchema>;

export const sourceFreshnessSchema = z.enum(['CURRENT', 'STALE_CLASSIFICATION']);
export type SourceFreshness = z.infer<typeof sourceFreshnessSchema>;

/** Los identificadores BIGINT llegan como cadenas y se conservan como cadenas. */
const reservationBaseSchema = z.object({
  reservationId: z.string(),
  clientId: z.string(),
  clinicId: z.number().int(),
  appointmentAt: isoDateTimeSchema,
  bookingCreatedAt: nullableIsoDateTimeSchema,
  reservationStatus: reservationStatusSchema,
  sourceClassification: z.string().nullable(),
  hasRescheduleEvent: z.boolean(),
  classificationCutoffAt: nullableIsoDateTimeSchema,
  sourceFreshness: sourceFreshnessSchema,
});

export const reservationDetailSchema = reservationBaseSchema.extend({
  hasUsableSnapshot: z.boolean(),
  scores: z.array(scoreSummarySchema),
  sourceStatus: z.string(),
});
export type ReservationDetail = z.infer<typeof reservationDetailSchema>;

export const reservationDetailEnvelopeSchema = z.object({
  data: reservationDetailSchema,
  requestId: requestIdSchema,
});

export const listItemRiskSchema = z.object({
  predictionAvailability: predictionAvailabilitySchema,
  notScorableReasons: z.array(reasonSchema),
  riskLevel: riskLevelSchema,
  riskPolicyStatus: riskPolicyStatusSchema,
  classificationUnavailable: z.boolean(),
  ...classificationAvailabilityFields,
  experimentalRisk: experimentalRiskSummarySchema.nullable(),
  experimentalPolicyCurrent: z.boolean(),
  validationStatus: z.literal('EXPLORATORY_NOT_VALIDATED'),
  probabilities: z.array(scoreSummarySchema),
});

export const reservationListItemSchema = reservationBaseSchema.extend({ risk: listItemRiskSchema });
export type ReservationListItem = z.infer<typeof reservationListItemSchema>;

export const reservationListSchema = z.object({
  data: z.array(reservationListItemSchema),
  pagination: z.object({ limit: z.number().int(), nextCursor: z.string().nullable() }),
  period: z.object({
    from: z.string(),
    to: z.string(),
    timeZone: z.string(),
    startInclusive: isoDateTimeSchema,
    endExclusive: isoDateTimeSchema,
  }),
  sort: z.object({
    field: z.string(),
    direction: z.string(),
    modelKey: z.string(),
    semantics: z.string(),
  }),
  riskPolicyStatus: z.string(),
  classificationUnavailable: z.boolean(),
  ...classificationAvailabilityFields,
  experimentalRiskPolicy: experimentalRiskPolicySchema.nullable(),
  sourceStatus: z.string(),
  predictiveStoreAvailable: z.boolean(),
  requestId: requestIdSchema,
});
export type ReservationList = z.infer<typeof reservationListSchema>;
