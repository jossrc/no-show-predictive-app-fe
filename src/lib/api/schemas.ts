import { z } from 'zod';

/**
 * Primitivas compartidas por los contratos de Fastify (fieles a sus JSON Schemas).
 * Los objetos no son `.strict()`: propiedades adicionales se ignoran, pero tipos
 * incompatibles o ausencias de campos requeridos invalidan la respuesta.
 */

/** Instante ISO-8601 con zona explícita (Fastify serializa en UTC con `Z`). */
export const isoDateTimeSchema = z.iso.datetime({ offset: true });

export const nullableIsoDateTimeSchema = isoDateTimeSchema.nullable();

/** BIGINT decimal transportado como cadena (hasta 18 dígitos), nunca como number. */
export const DECIMAL_ID_PATTERN = /^[1-9][0-9]{0,17}$/;

export const decimalIdSchema = z.string().regex(DECIMAL_ID_PATTERN);

export const reasonSchema = z.object({ code: z.string(), message: z.string() });

export const riskPolicyStatusSchema = z.enum(['pending_validation', 'approved']);

/** Permanece null mientras la política de niveles esté pendiente de validación. */
export const riskLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']).nullable();

export const requestIdSchema = z.string();

/** Sobre de error del handler global de Fastify. */
export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    errors: z.array(z.object({ field: z.string(), message: z.string() }).loose()).optional(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
  requestId: z.string().optional(),
});

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

export function isDecimalId(value: string): boolean {
  return DECIMAL_ID_PATTERN.test(value);
}
