/**
 * Resultado tipado de una operación contra Fastify. Es serializable para poder cruzar la
 * frontera Server Component / Server Action → Client Component sin perder información.
 *
 * Un error nunca se convierte en una lista vacía ni en un valor por defecto.
 */
export interface ApiReason {
  code: string;
  message: string;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export type ApiErrorKind =
  /** El backend respondió con un código HTTP no exitoso. */
  | 'http'
  /** No hubo respuesta: conexión rechazada, DNS, red. */
  | 'network'
  /** Se agotó el tiempo de espera; el resultado de la operación es desconocido. */
  | 'timeout'
  /** Respuesta exitosa pero no JSON o incompatible con el contrato. */
  | 'invalid_response'
  /** El frontend no está configurado para consumir el backend. */
  | 'configuration'
  /** Entrada rechazada por la validación del servidor Next.js antes de llamar al backend. */
  | 'invalid_input';

export interface ApiError {
  kind: ApiErrorKind;
  status: number | null;
  code: string;
  message: string;
  requestId: string | null;
  reasons: ApiReason[];
  fieldErrors: ApiFieldError[];
}

export interface ApiSuccess<T> {
  ok: true;
  status: number;
  data: T;
  requestId: string | null;
}

export interface ApiFailure {
  ok: false;
  error: ApiError;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export function mapApiResult<T, U>(result: ApiResult<T>, map: (data: T) => U): ApiResult<U> {
  return result.ok ? { ...result, data: map(result.data) } : result;
}

export function hasErrorCode(result: ApiResult<unknown>, code: string): boolean {
  return !result.ok && result.error.code === code;
}
