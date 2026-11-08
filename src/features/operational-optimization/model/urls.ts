import type { RecordListQuery } from '@/features/operational-optimization/api/records.contract';
import {
  type CursorPage,
  FIRST_PAGE,
  type OperationalFilters,
  type OperationalQuery,
  type TrackingView,
  TRAIL_SEPARATOR,
} from '@/features/operational-optimization/model/query';
import { DEFAULT_MODEL_KEY } from '@/features/prediction-models/api/contract';
import { DEFAULT_LIMIT, type ReservationListQuery } from '@/features/reservations/model/list-query';
import { OPERATIONAL_PATH } from '@/lib/routes';

/** URL canónica de «Optimización operativa»: las fechas se escriben siempre (cursor estable). */

interface HrefState {
  limit?: number;
  risk?: CursorPage;
  view?: TrackingView;
  track?: CursorPage;
}

function setPage(params: URLSearchParams, prefix: string, page: CursorPage | undefined) {
  if (!page?.cursor) return;
  params.set(`${prefix}Cursor`, page.cursor);
  if (page.trail.length > 0) params.set(`${prefix}Prev`, page.trail.join(TRAIL_SEPARATOR));
}

export function buildOperationalHref(filters: OperationalFilters, state: HrefState = {}): string {
  const params = new URLSearchParams({ from: filters.from, to: filters.to });
  if (filters.clinicId) params.set('clinicId', filters.clinicId);
  if (filters.status !== 'SCHEDULED') params.set('status', filters.status);
  if (filters.modelKey !== DEFAULT_MODEL_KEY) params.set('modelKey', filters.modelKey);
  if (state.limit && state.limit !== DEFAULT_LIMIT) params.set('limit', String(state.limit));
  setPage(params, 'risk', state.risk);
  if (state.view && state.view !== 'authorizations') params.set('view', state.view);
  setPage(params, 'track', state.track);
  return `${OPERATIONAL_PATH}?${params.toString()}`;
}

/** Estado completo actual (para enlaces al detalle y regreso exacto). */
export function currentOperationalHref(query: OperationalQuery): string {
  return buildOperationalHref(query, query);
}

function nextPage(page: CursorPage, nextCursor: string): CursorPage {
  return { cursor: nextCursor, trail: page.cursor ? [...page.trail, page.cursor] : [] };
}

function previousPage(page: CursorPage): CursorPage | null {
  if (!page.cursor) return null;
  return { cursor: page.trail.at(-1) ?? null, trail: page.trail.slice(0, -1) };
}

export function pageNumberOf(page: CursorPage): number {
  return page.cursor ? page.trail.length + 2 : 1;
}

export type PagedBlock = 'risk' | 'track';

/** Enlaces de paginación de un bloque; el otro bloque conserva su posición. */
export function blockPageHrefs(
  query: OperationalQuery,
  block: PagedBlock,
  nextCursor: string | null,
) {
  const page = query[block];
  const build = (target: CursorPage) => buildOperationalHref(query, { ...query, [block]: target });
  const previous = previousPage(page);
  return {
    first: build(FIRST_PAGE),
    previous: previous ? build(previous) : null,
    next: nextCursor ? build(nextPage(page, nextCursor)) : null,
  };
}

/** Cambiar de listado reinicia su cursor (los cursores están ligados al tipo de listado). */
export function trackingViewHref(query: OperationalQuery, view: TrackingView): string {
  return buildOperationalHref(query, { ...query, view, track: FIRST_PAGE });
}

/**
 * «Reservas con alto riesgo»: listado de Sprint 01 con la banda HIGH del modelo elegido.
 * Solo usa predicciones ya persistidas (el GET nunca ejecuta inferencia).
 */
export function toHighRiskListQuery(query: OperationalQuery): ReservationListQuery {
  return {
    from: query.from,
    to: query.to,
    status: query.status,
    clinicId: query.clinicId,
    sort: 'appointmentAt',
    direction: 'asc',
    modelKey: query.modelKey,
    experimentalRiskLevel: 'HIGH',
    limit: query.limit,
    cursor: query.risk.cursor,
    trail: query.risk.trail,
  };
}

/** Listados persistidos: sin `status` ni `modelKey` (el contrato no los admite). */
export function toTrackingListQuery(query: OperationalQuery): RecordListQuery {
  return {
    from: query.from,
    to: query.to,
    clinicId: query.clinicId,
    limit: query.limit,
    cursor: query.track.cursor,
  };
}
