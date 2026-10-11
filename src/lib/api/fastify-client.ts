import 'server-only';

import type { z } from 'zod';

import { interpretResponse } from '@/lib/api/response';
import type { ApiResult } from '@/lib/api/result';
import { resolveTransport } from '@/lib/api/transport';
import { type ConfigProblem, getServerConfig } from '@/lib/config/server';
import { configurationFailure, networkFailure, timeoutFailure } from '@/lib/errors/api-errors';

export type QueryParams = Readonly<Record<string, string | undefined>>;

export interface FastifyRequest<T> {
  method?: 'GET' | 'POST';
  /** Ruta absoluta del backend, p. ej. `/api/v1/reservations`. */
  path: string;
  query?: QueryParams;
  body?: unknown;
  schema: z.ZodType<T>;
  timeoutMs: number;
  /** `internal` añade `x-api-key`; `public` (Health) no la envía. */
  access?: 'internal' | 'public';
  /** Estados no 2xx cuyo cuerpo forma parte del contrato (Health ML responde 503 con cuerpo). */
  acceptStatuses?: readonly number[];
}

const CONFIG_MESSAGES: Record<ConfigProblem, string> = {
  INVALID_DATA_MODE: 'FRONTEND_DATA_MODE debe ser "live" o "mock".',
  MISSING_API_KEY:
    'Falta FASTIFY_INTERNAL_API_KEY en el entorno del servidor (.env.local). La credencial nunca se envía al navegador.',
  INVALID_BASE_URL: 'FASTIFY_API_BASE_URL no es una URL http(s) válida.',
  LIVE_DISABLED_IN_PRODUCTION:
    'El modo LIVE está deshabilitado en producción hasta contar con autenticación y autorización aprobadas (HU-21/HU-22).',
  MOCK_DISABLED_IN_PRODUCTION: 'El modo mock solo se permite en entornos de prueba.',
};

export function buildRequestUrl(baseUrl: string, path: string, query: QueryParams = {}): URL {
  if (!path.startsWith('/api/')) throw new Error('Ruta de backend no permitida');
  const url = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  return url;
}

function buildHeaders(hasBody: boolean, apiKey: string | null): Headers {
  const headers = new Headers({ Accept: 'application/json' });
  if (hasBody) headers.set('Content-Type', 'application/json');
  if (apiKey) headers.set('x-api-key', apiKey);
  return headers;
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.name === 'TimeoutError';
}

/**
 * Cliente HTTP servidor-servidor hacia Fastify. Nunca registra cabeceras ni la credencial,
 * no sigue redirecciones y no utiliza caché: reservas e historial cambian con cada ingesta.
 */
export async function fastifyRequest<T>(request: FastifyRequest<T>): Promise<ApiResult<T>> {
  const config = getServerConfig();
  if (!config.ok) return configurationFailure(CONFIG_MESSAGES[config.problem]);

  const hasBody = request.body !== undefined;
  const apiKey = request.access === 'public' ? null : config.internalApiKey;
  const transport = await resolveTransport(config.mode);

  let response: Response;
  try {
    response = await transport(buildRequestUrl(config.apiBaseUrl, request.path, request.query), {
      method: request.method ?? 'GET',
      headers: buildHeaders(hasBody, apiKey),
      body: hasBody ? JSON.stringify(request.body) : undefined,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(request.timeoutMs),
    });
  } catch (error) {
    return isTimeoutError(error) ? timeoutFailure() : networkFailure();
  }

  try {
    return await interpretResponse(response, request.schema, request.acceptStatuses);
  } catch (error) {
    // La lectura del cuerpo también puede agotar el presupuesto de tiempo.
    return isTimeoutError(error) ? timeoutFailure() : networkFailure();
  }
}
