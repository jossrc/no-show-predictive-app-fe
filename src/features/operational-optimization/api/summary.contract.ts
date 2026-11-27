import { z } from 'zod';

import { nullableIsoDateTimeSchema } from '@/lib/api/schemas';

/**
 * Resumen de gestión Sprint 02 (HU-06/07/08) añadido de forma ADITIVA a cada fila de
 * `GET /api/v1/reservations` y al detalle `GET /api/v1/reservations/:reservationId`.
 * Fuente: `OperationalStatusHttp.ts` del backend (`feature/sprint-02`).
 *
 * Cada objeto es `null` SOLO si el almacén de la app no está disponible
 * (`predictiveStoreAvailable=false` en el listado): nunca significa «no habilitado» ni «no».
 */

export const OVERBOOKING_STATUS_LABELS = {
  ENABLED: 'Habilitado para sobreasignación',
  NOT_ENABLED: 'No habilitado',
} as const;

export const overbookingStatusSchema = z.enum(['ENABLED', 'NOT_ENABLED']);
export type OverbookingStatus = z.infer<typeof overbookingStatusSchema>;

export const attendanceStatusSchema = z.enum(['ATTENDED', 'NO_SHOW']);
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

/** HU-06: marca propia; no cambia `reservationStatus` ni FLOWww. Sin marca: `enabled=false`. */
export const overbookingSummarySchema = z.object({
  enabled: z.boolean(),
  status: overbookingStatusSchema,
  statusLabel: z.string(),
  authorizationId: z.string().nullable(),
  enabledAt: nullableIsoDateTimeSchema,
  modelKey: z.string().nullable(),
  predictionRunId: z.string().nullable(),
});
export type OverbookingSummary = z.infer<typeof overbookingSummarySchema>;

/** HU-07: `recorded=false` ⇒ `attendanceStatus=null` (nunca un valor inferido). */
export const attendanceSummarySchema = z.object({
  recorded: z.boolean(),
  attendanceStatus: attendanceStatusSchema.nullable(),
  recordedAt: nullableIsoDateTimeSchema,
});
export type AttendanceSummary = z.infer<typeof attendanceSummarySchema>;

/** HU-08: `spaceRecovered=false` es un registro («no recuperado»); `null` = sin registro. */
export const spaceRecoverySummarySchema = z.object({
  recorded: z.boolean(),
  spaceRecovered: z.boolean().nullable(),
  recordedAt: nullableIsoDateTimeSchema,
});
export type SpaceRecoverySummary = z.infer<typeof spaceRecoverySummarySchema>;

/** Campos que se agregan a los schemas de reserva (listado y detalle). */
export const operationalStatusFields = {
  overbooking: overbookingSummarySchema.nullable(),
  attendanceOutcome: attendanceSummarySchema.nullable(),
  spaceRecoveryOutcome: spaceRecoverySummarySchema.nullable(),
};

export interface OperationalStatus {
  overbooking: OverbookingSummary | null;
  attendanceOutcome: AttendanceSummary | null;
  spaceRecoveryOutcome: SpaceRecoverySummary | null;
}
