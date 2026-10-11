import type { ApiError, ApiFailure } from '@/lib/api/result';

/**
 * Códigos generados por el propio frontend cuando no existe un código del backend.
 * Los códigos del backend (p. ej. `NOT_SCORABLE`) se conservan sin modificar.
 */
export const FRONTEND_ERROR_CODES = {
  network: 'NETWORK_ERROR',
  timeout: 'TIMEOUT',
  invalidResponse: 'INVALID_RESPONSE',
  configuration: 'FRONTEND_CONFIGURATION_ERROR',
  invalidInput: 'INVALID_INPUT',
} as const;

function failure(error: Omit<ApiError, 'reasons' | 'fieldErrors'> & Partial<ApiError>): ApiFailure {
  return { ok: false, error: { reasons: [], fieldErrors: [], ...error } };
}

export function networkFailure(): ApiFailure {
  return failure({
    kind: 'network',
    status: null,
    code: FRONTEND_ERROR_CODES.network,
    message: 'No se pudo establecer conexión con el backend.',
    requestId: null,
  });
}

export function timeoutFailure(): ApiFailure {
  return failure({
    kind: 'timeout',
    status: null,
    code: FRONTEND_ERROR_CODES.timeout,
    message: 'El backend no respondió dentro del tiempo permitido.',
    requestId: null,
  });
}

export function invalidResponseFailure(status: number, requestId: string | null): ApiFailure {
  return failure({
    kind: 'invalid_response',
    status,
    code: FRONTEND_ERROR_CODES.invalidResponse,
    message: 'La respuesta del backend no coincide con el contrato esperado.',
    requestId,
  });
}

export function configurationFailure(message: string): ApiFailure {
  return failure({
    kind: 'configuration',
    status: null,
    code: FRONTEND_ERROR_CODES.configuration,
    message,
    requestId: null,
  });
}

export function httpFailure(error: Omit<ApiError, 'kind'>): ApiFailure {
  return failure({ kind: 'http', ...error });
}

export function invalidInputFailure(): ApiFailure {
  return failure({
    kind: 'invalid_input',
    status: null,
    code: FRONTEND_ERROR_CODES.invalidInput,
    message: 'Los parámetros de la solicitud no son válidos.',
    requestId: null,
  });
}
