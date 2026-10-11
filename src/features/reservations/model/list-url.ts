import { DEFAULT_MODEL_KEY } from '@/features/prediction-models/api/contract';
import {
  DEFAULT_LIMIT,
  type ReservationListFilters,
  type ReservationListQuery,
} from '@/features/reservations/model/list-query';

export const RESERVATIONS_PATH = '/reservations';
const TRAIL_SEPARATOR = '.';

/**
 * Parámetros enviados a Fastify. Se construyen campo a campo desde una lista blanca:
 * `riskLevel` nunca se serializa y los opcionales vacíos se omiten.
 */
export function toBackendParams(query: ReservationListQuery): Record<string, string> {
  const params: Record<string, string> = {
    from: query.from,
    to: query.to,
    status: query.status,
    sort: query.sort,
    direction: query.direction,
    modelKey: query.modelKey,
    limit: String(query.limit),
  };
  if (query.clinicId) params.clinicId = query.clinicId;
  if (query.cursor) params.cursor = query.cursor;
  return params;
}

/**
 * URL canónica del listado. Las fechas se escriben siempre para que la paginación por
 * cursor no cambie de período al cambiar el día; los valores por defecto se omiten.
 */
export function toListSearchParams(
  filters: ReservationListFilters,
  page: { cursor: string | null; trail: string[] } = { cursor: null, trail: [] },
): URLSearchParams {
  const params = new URLSearchParams({ from: filters.from, to: filters.to });
  if (filters.status !== 'SCHEDULED') params.set('status', filters.status);
  if (filters.clinicId) params.set('clinicId', filters.clinicId);
  if (filters.sort !== 'appointmentAt') params.set('sort', filters.sort);
  if (filters.direction !== 'asc') params.set('direction', filters.direction);
  if (filters.modelKey !== DEFAULT_MODEL_KEY) params.set('modelKey', filters.modelKey);
  if (filters.limit !== DEFAULT_LIMIT) params.set('limit', String(filters.limit));
  if (page.cursor) {
    params.set('cursor', page.cursor);
    if (page.trail.length > 0) params.set('prev', page.trail.join(TRAIL_SEPARATOR));
  }
  return params;
}

export function buildListHref(
  filters: ReservationListFilters,
  page?: { cursor: string | null; trail: string[] },
): string {
  return `${RESERVATIONS_PATH}?${toListSearchParams(filters, page).toString()}`;
}

export function firstPageHref(query: ReservationListQuery): string {
  return buildListHref(query);
}

export function nextPageHref(query: ReservationListQuery, nextCursor: string): string {
  const trail = query.cursor ? [...query.trail, query.cursor] : [];
  return buildListHref(query, { cursor: nextCursor, trail });
}

/** null en la primera página. */
export function previousPageHref(query: ReservationListQuery): string | null {
  if (!query.cursor) return null;
  const previous = query.trail.at(-1) ?? null;
  return buildListHref(query, { cursor: previous, trail: query.trail.slice(0, -1) });
}

export function pageNumber(query: ReservationListQuery): number {
  return query.cursor ? query.trail.length + 2 : 1;
}

/** Enlace al detalle conservando el estado del listado para el regreso. */
export function buildDetailHref(reservationId: string, listHref: string): string {
  const params = new URLSearchParams({ back: listHref });
  return `${RESERVATIONS_PATH}/${encodeURIComponent(reservationId)}?${params.toString()}`;
}

/** Acepta solo rutas internas del listado (evita redirecciones abiertas). */
export function resolveBackHref(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !value.startsWith(`${RESERVATIONS_PATH}?`)) return RESERVATIONS_PATH;
  try {
    const url = new URL(value, 'http://local.invalid');
    return url.pathname === RESERVATIONS_PATH ? `${url.pathname}${url.search}` : RESERVATIONS_PATH;
  } catch {
    return RESERVATIONS_PATH;
  }
}
