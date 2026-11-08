import { z } from 'zod';

import {
  authorshipFields,
  envelopeSchema,
  recordIdSchema,
  recordListSchema,
} from '@/features/operational-optimization/api/records.contract';
import { isoDateTimeSchema } from '@/lib/api/schemas';

/**
 * HU-08 · Registro de espacios recuperados (requiere la marca HU-06; NO depende de HU-07).
 * `GET …/space-recovery-outcome`, `POST …/space-recovery-outcomes` y
 * `GET /space-recovery-outcomes`. Fuente: `OperationalHttpSchemas.ts` y
 * `GetSpaceRecoveryOutcomeSchema.ts`.
 */

export const spaceRecoveryOutcomeSchema = z.object({
  recoveryOutcomeId: recordIdSchema,
  authorizationId: recordIdSchema,
  reservationId: recordIdSchema,
  clinicId: z.number().int(),
  appointmentAt: isoDateTimeSchema,
  /** `true` = recuperado; `false` = gestionado sin recuperar (es un registro, no «sin dato»). */
  spaceRecovered: z.boolean(),
  recordedAt: isoDateTimeSchema,
  ...authorshipFields,
});
export type SpaceRecoveryOutcome = z.infer<typeof spaceRecoveryOutcomeSchema>;

export const RECOVERY_BLOCKERS = ['PREVENTIVE_ACTION_REQUIRED', 'ALREADY_RECORDED'] as const;
export const recoveryBlockerSchema = z.enum(RECOVERY_BLOCKERS);
export type RecoveryBlocker = z.infer<typeof recoveryBlockerSchema>;

export const spaceRecoveryStateSchema = z.object({
  reservationId: z.string(),
  recorded: z.boolean(),
  /** `null` = sin registro; nunca se presenta como «No». */
  spaceRecovered: z.boolean().nullable(),
  outcome: spaceRecoveryOutcomeSchema.nullable(),
  preventiveAction: z.object({ enabled: z.boolean(), authorizationId: z.string().nullable() }),
  registrable: z.boolean(),
  blocker: recoveryBlockerSchema.nullable(),
});
export type SpaceRecoveryState = z.infer<typeof spaceRecoveryStateSchema>;

export const spaceRecoveryStateEnvelopeSchema = envelopeSchema(spaceRecoveryStateSchema);

/** Booleano JSON estricto: nunca `"true"`, `1` ni `null`. */
export const recordSpaceRecoveryRequestSchema = z.object({ spaceRecovered: z.boolean() }).strict();
export type RecordSpaceRecoveryRequest = z.infer<typeof recordSpaceRecoveryRequestSchema>;

export const recordSpaceRecoveryResponseSchema = envelopeSchema(
  spaceRecoveryOutcomeSchema.extend({ replayed: z.boolean() }),
);
export type RecordSpaceRecoveryResponse = z.infer<typeof recordSpaceRecoveryResponseSchema>['data'];

export const spaceRecoveryOutcomeListSchema = recordListSchema(spaceRecoveryOutcomeSchema);
export type SpaceRecoveryOutcomeList = z.infer<typeof spaceRecoveryOutcomeListSchema>;
