import type { z } from 'zod';

import type { ApiReason, ApiResult } from '@/lib/api/result';
import { errorEnvelopeSchema, reasonSchema } from '@/lib/api/schemas';
import { httpFailure, invalidResponseFailure } from '@/lib/errors/api-errors';

type ParsedBody = { kind: 'empty' } | { kind: 'json'; value: unknown } | { kind: 'invalid' };

async function readBody(response: Response): Promise<ParsedBody> {
  let text: string;
  try {
    text = await response.text();
  } catch {
    return { kind: 'invalid' };
  }
  if (text.trim() === '') return { kind: 'empty' };

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('json')) return { kind: 'invalid' };

  try {
    return { kind: 'json', value: JSON.parse(text) as unknown };
  } catch {
    return { kind: 'invalid' };
  }
}

function readRequestId(body: ParsedBody, response: Response): string | null {
  if (body.kind === 'json' && typeof body.value === 'object' && body.value !== null) {
    const candidate = (body.value as { requestId?: unknown }).requestId;
    if (typeof candidate === 'string' && candidate) return candidate;
  }
  return response.headers.get('x-request-id');
}

function readReasons(details: Record<string, unknown> | undefined): ApiReason[] {
  const parsed = reasonSchema.array().safeParse(details?.reasons);
  return parsed.success ? parsed.data : [];
}

function genericHttpMessage(status: number): string {
  return status >= 500
    ? 'El backend no está disponible en este momento.'
    : 'El backend rechazó la solicitud.';
}

function toHttpFailure(status: number, body: ParsedBody, requestId: string | null) {
  const envelope =
    body.kind === 'json' ? errorEnvelopeSchema.safeParse(body.value) : { success: false as const };

  if (!envelope.success) {
    return httpFailure({
      status,
      code: `HTTP_${status}`,
      message: genericHttpMessage(status),
      requestId,
      reasons: [],
      fieldErrors: [],
    });
  }

  const { error } = envelope.data;
  return httpFailure({
    status,
    code: error.code,
    message: error.message,
    requestId,
    reasons: readReasons(error.details),
    fieldErrors: (error.errors ?? []).map(({ field, message }) => ({ field, message })),
  });
}

/**
 * Interpreta una respuesta HTTP de Fastify.
 *
 * - Estados no exitosos → `kind: 'http'` conservando código, motivos y `requestId`.
 * - `acceptStatuses` permite tratar como cuerpo válido estados como el 503 de Health.
 * - Cuerpos no JSON o incompatibles con `schema` → `invalid_response` (nunca un vacío).
 * - Un cuerpo vacío solo es válido si el schema acepta `undefined` (p. ej. 204).
 */
export async function interpretResponse<T>(
  response: Response,
  schema: z.ZodType<T>,
  acceptStatuses: readonly number[] = [],
): Promise<ApiResult<T>> {
  const body = await readBody(response);
  const requestId = readRequestId(body, response);
  const accepted = response.ok || acceptStatuses.includes(response.status);

  if (!accepted) return toHttpFailure(response.status, body, requestId);
  if (body.kind === 'invalid') return invalidResponseFailure(response.status, requestId);

  const parsed = schema.safeParse(body.kind === 'json' ? body.value : undefined);
  if (!parsed.success) return invalidResponseFailure(response.status, requestId);

  return { ok: true, status: response.status, data: parsed.data, requestId };
}
