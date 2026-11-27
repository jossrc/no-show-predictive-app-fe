import { z } from 'zod';

import { decimalIdSchema, isoDateTimeSchema, requestIdSchema } from '@/lib/api/schemas';

/**
 * Primitivas comunes de los contratos operativos (HU-06/07/08).
 * Fuente: `OperationalHttpSchemas.ts` del backend (`feature/sprint-02`).
 */

/** Patrón exacto de `PREDICTION_RUN_ID_PATTERN` del backend (UUID hexadecimal 8-4-4-4-12). */
export const PREDICTION_RUN_ID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const predictionRunIdSchema = z.string().regex(PREDICTION_RUN_ID_PATTERN);

export const probabilitySchema = z.number().min(0).max(1);

/**
 * Autoría técnica: la compuerta `x-api-key` identifica un servicio interno, no a una persona.
 * `actorUserId` es siempre `null` hasta implementar login/RBAC (HU-21/HU-22).
 */
export const authorshipFields = {
  actorKind: z.literal('INTERNAL_SERVICE'),
  actorUserId: z.null(),
};

/** Identificadores BIGINT decimales del almacén de la app: siempre cadenas. */
export const recordIdSchema = decimalIdSchema;

export const recordPeriodSchema = z.object({
  from: z.string(),
  to: z.string(),
  timeZone: z.string(),
  startInclusive: isoDateTimeSchema,
  endExclusive: isoDateTimeSchema,
});

export const recordPaginationSchema = z.object({
  limit: z.number().int(),
  nextCursor: z.string().nullable(),
});

/** Sobre de los tres listados persistidos (orden `appointmentAt ASC, reservationId ASC`). */
export function recordListSchema<T extends z.ZodType>(item: T) {
  return z.object({
    data: z.array(item),
    pagination: recordPaginationSchema,
    period: recordPeriodSchema,
    requestId: requestIdSchema,
  });
}

export interface RecordList<T> {
  data: T[];
  pagination: z.infer<typeof recordPaginationSchema>;
  period: z.infer<typeof recordPeriodSchema>;
  requestId: string;
}

export function envelopeSchema<T extends z.ZodType>(data: T) {
  return z.object({ data, requestId: requestIdSchema });
}

/** Parámetros comunes a los tres listados persistidos (sin `status`: el contrato no lo admite). */
export interface RecordListQuery {
  from: string;
  to: string;
  clinicId: string | null;
  limit: number;
  cursor: string | null;
}

export function toRecordListParams(query: RecordListQuery): Record<string, string> {
  const params: Record<string, string> = {
    from: query.from,
    to: query.to,
    limit: String(query.limit),
  };
  if (query.clinicId) params.clinicId = query.clinicId;
  if (query.cursor) params.cursor = query.cursor;
  return params;
}
