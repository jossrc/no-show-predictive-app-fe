import { z } from 'zod';

import { isoDateTimeSchema, nullableIsoDateTimeSchema, requestIdSchema } from '@/lib/api/schemas';

/** HU-06: `GET …/client-history`. Fuente: GetClientNoShowHistorySchema.ts del backend. */

export const HISTORICAL_AS_OF_MODES = ['booking_creation', 'current_known'] as const;
export const historicalAsOfSchema = z.enum(HISTORICAL_AS_OF_MODES);
export type HistoricalAsOf = z.infer<typeof historicalAsOfSchema>;
export const DEFAULT_HISTORICAL_AS_OF: HistoricalAsOf = 'booking_creation';

const countSchema = z.number().int().min(0);

export const clientHistorySchema = z.object({
  reservationId: z.string(),
  clientId: z.string(),
  historicalAsOf: historicalAsOfSchema,
  cutoffAt: isoDateTimeSchema,
  cutoffSemantics: z.literal('known_at < cutoffAt'),
  /** Etiqueta proxy de posible inasistencia; no es una ausencia confirmada. */
  historySemantics: z.literal('NO_SHOW_CANDIDATE'),
  previousAttended: countSchema,
  previousNoShow: countSchema,
  resolvedTotal: countSchema,
  /** null cuando no hay historial resuelto: nunca equivale a 0 %. */
  noShowRate: z.number().min(0).max(1).nullable(),
  lastNoShowAt: nullableIsoDateTimeSchema,
  lastAttendedAt: nullableIsoDateTimeSchema,
  warnings: z.array(z.string()),
});
export type ClientHistory = z.infer<typeof clientHistorySchema>;

export const clientHistoryEnvelopeSchema = z.object({
  data: clientHistorySchema,
  requestId: requestIdSchema,
});
