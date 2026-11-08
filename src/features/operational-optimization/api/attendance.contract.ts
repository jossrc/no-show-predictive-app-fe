import { z } from 'zod';

import {
  authorshipFields,
  envelopeSchema,
  predictionRunIdSchema,
  probabilitySchema,
  recordIdSchema,
  recordListSchema,
} from '@/features/operational-optimization/api/records.contract';
import { attendanceStatusSchema } from '@/features/operational-optimization/api/summary.contract';
import { modelKeySchema } from '@/features/prediction-models/api/contract';
import { experimentalRiskLevelSchema } from '@/features/reservation-risk/api/experimental-risk.contract';
import { isoDateTimeSchema, nullableIsoDateTimeSchema } from '@/lib/api/schemas';

/**
 * HU-07 · Registro del resultado real de la cita y comparación con la predicción.
 * `GET …/attendance-outcome`, `POST …/attendance-outcomes` y `GET /attendance-outcomes`.
 * Fuente: `OperationalHttpSchemas.ts` (AttendanceOutcomeSchema, ComparisonSchema) y
 * `GetAttendanceOutcomeSchema.ts`.
 */

/**
 * Comparación GUARDADA por el backend (`binary_outcome_threshold_v1`): umbral técnico provisional
 * (0.5) que no equivale a las bandas Alto/Medio/Bajo. El frontend no la recalcula.
 */
export const attendanceComparisonSchema = z.object({
  modelKey: modelKeySchema,
  modelVersion: z.string(),
  probabilityNoShow: probabilitySchema,
  scoredAt: isoDateTimeSchema,
  experimentalRiskLevel: experimentalRiskLevelSchema.nullable(),
  comparisonRuleVersion: z.literal('binary_outcome_threshold_v1'),
  threshold: z.number(),
  predictedNoShow: z.boolean(),
  observedNoShow: z.boolean(),
  matchesPrediction: z.boolean(),
});
export type AttendanceComparison = z.infer<typeof attendanceComparisonSchema>;

export const attendanceOutcomeSchema = z.object({
  attendanceOutcomeId: recordIdSchema,
  reservationId: recordIdSchema,
  clinicId: z.number().int(),
  appointmentAt: isoDateTimeSchema,
  appointmentEndAt: nullableIsoDateTimeSchema,
  attendanceStatus: attendanceStatusSchema,
  observedNoShow: z.boolean(),
  recordedAt: isoDateTimeSchema,
  predictionRunId: z.string(),
  finishedRuleVersion: z.literal('appointment_finished_rule_v1'),
  comparisons: z.array(attendanceComparisonSchema),
  comparisonNotice: z.string(),
  ...authorshipFields,
});
export type AttendanceOutcome = z.infer<typeof attendanceOutcomeSchema>;

/** Motivos por los que el backend no permite registrar todavía (regla de cita finalizada). */
export const ATTENDANCE_BLOCKERS = [
  'ALREADY_RECORDED',
  'RESERVATION_CANCELLED',
  'APPOINTMENT_NOT_STARTED',
  'APPOINTMENT_IN_PROGRESS',
  'APPOINTMENT_END_UNKNOWN',
  'PREDICTION_REQUIRED',
] as const;
export const attendanceBlockerSchema = z.enum(ATTENDANCE_BLOCKERS);
export type AttendanceBlocker = z.infer<typeof attendanceBlockerSchema>;

export const attendanceStateSchema = z.object({
  reservationId: z.string(),
  recorded: z.boolean(),
  attendanceStatus: attendanceStatusSchema.nullable(),
  outcome: attendanceOutcomeSchema.nullable(),
  registration: z.object({
    ruleVersion: z.literal('appointment_finished_rule_v1'),
    registrable: z.boolean(),
    blocker: attendanceBlockerSchema.nullable(),
    /** Runs que contienen el último score de cada modelo; únicos valores enviables al POST. */
    availablePredictionRunIds: z.array(z.string()),
  }),
});
export type AttendanceState = z.infer<typeof attendanceStateSchema>;

export const attendanceStateEnvelopeSchema = envelopeSchema(attendanceStateSchema);

export const recordAttendanceRequestSchema = z
  .object({ attendanceStatus: attendanceStatusSchema, predictionRunId: predictionRunIdSchema })
  .strict();
export type RecordAttendanceRequest = z.infer<typeof recordAttendanceRequestSchema>;

export const recordAttendanceResponseSchema = envelopeSchema(
  attendanceOutcomeSchema.extend({ replayed: z.boolean() }),
);
export type RecordAttendanceResponse = z.infer<typeof recordAttendanceResponseSchema>['data'];

export const attendanceOutcomeListSchema = recordListSchema(attendanceOutcomeSchema);
export type AttendanceOutcomeList = z.infer<typeof attendanceOutcomeListSchema>;
