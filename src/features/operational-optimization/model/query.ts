import {
  DEFAULT_MODEL_KEY,
  MODEL_KEYS,
  type ModelKey,
} from '@/features/prediction-models/api/contract';
import {
  DEFAULT_LIMIT,
  isValidClinicId,
  LISTABLE_STATUSES,
  type ListableStatus,
  type RawSearchParams,
  validatePeriod,
} from '@/features/reservations/model/list-query';
import { addCalendarDays, isCalendarDate } from '@/lib/dates/calendar';

/**
 * Estado de «Optimización operativa» en la URL: filtros comunes y una paginación por cursor
 * independiente para cada bloque. Es la única fuente de verdad (compatible con volver/historial).
 */

/** Listados persistidos del bloque «Seguimiento operativo». */
export const TRACKING_VIEWS = ['authorizations', 'attendance', 'recovery'] as const;
export type TrackingView = (typeof TRACKING_VIEWS)[number];

/**
 * Período inicial (28 días de calendario): los 7 días previos, para registrar resultados de citas
 * recientes, y las próximas 3 semanas, para revisar candidatas futuras a sobreasignación.
 */
export const DEFAULT_DAYS_BEFORE = 7;
export const DEFAULT_DAYS_AFTER = 20;

const CURSOR_PATTERN = /^[A-Za-z0-9_-]{1,512}$/;
const MAX_TRAIL = 100;
export const TRAIL_SEPARATOR = '.';

export interface OperationalFilters {
  from: string;
  to: string;
  clinicId: string | null;
  /** Estado de la reserva en la agenda: solo aplica a «Reservas con alto riesgo». */
  status: ListableStatus;
  /** Modelo que define la banda Alta: nunca se combinan RF y XGBoost. */
  modelKey: ModelKey;
}

export interface CursorPage {
  cursor: string | null;
  trail: string[];
}

export interface OperationalQuery extends OperationalFilters {
  limit: number;
  risk: CursorPage;
  view: TrackingView;
  track: CursorPage;
}

export interface ParsedOperationalParams {
  query: OperationalQuery;
  notices: string[];
  periodError: string | null;
}

export const FIRST_PAGE: CursorPage = { cursor: null, trail: [] };

export function defaultOperationalFilters(today: string): OperationalFilters {
  return {
    from: addCalendarDays(today, -DEFAULT_DAYS_BEFORE),
    to: addCalendarDays(today, DEFAULT_DAYS_AFTER),
    clinicId: null,
    status: 'SCHEDULED',
    modelKey: DEFAULT_MODEL_KEY,
  };
}

function first(raw: RawSearchParams, key: string): string | undefined {
  const value = raw[key];
  return Array.isArray(value) ? value[0] : value;
}

function pick<T extends string>(value: string | undefined, allowed: readonly T[]): T | null {
  return allowed.find((item) => item === value) ?? null;
}

function parsePeriod(raw: RawSearchParams, today: string, notices: string[]) {
  const defaults = defaultOperationalFilters(today);
  const from = first(raw, 'from');
  const to = first(raw, 'to');
  if (from === undefined && to === undefined) return { from: defaults.from, to: defaults.to };
  if (from !== undefined && to !== undefined && isCalendarDate(from) && isCalendarDate(to)) {
    return { from, to };
  }
  notices.push('El período no era válido; se aplicó el período predeterminado.');
  return { from: defaults.from, to: defaults.to };
}

function parsePage(raw: RawSearchParams, prefix: string, notices: string[]): CursorPage {
  const cursor = first(raw, `${prefix}Cursor`);
  if (cursor === undefined) return FIRST_PAGE;
  const trail = (first(raw, `${prefix}Prev`) ?? '').split(TRAIL_SEPARATOR).filter(Boolean);
  const valid = CURSOR_PATTERN.test(cursor) && trail.every((item) => CURSOR_PATTERN.test(item));
  if (valid && trail.length <= MAX_TRAIL) return { cursor, trail };
  notices.push('La posición de paginación no era válida; se muestra la primera página.');
  return FIRST_PAGE;
}

function parseLimit(value: string | undefined, notices: string[]): number {
  if (value === undefined) return DEFAULT_LIMIT;
  const limit = /^\d{1,3}$/.test(value) ? Number(value) : NaN;
  if (limit >= 1 && limit <= 100) return limit;
  notices.push(`El tamaño de página no era válido; se muestran ${DEFAULT_LIMIT} por página.`);
  return DEFAULT_LIMIT;
}

function parseClinicId(value: string | undefined, notices: string[]): string | null {
  if (value === undefined || value === '') return null;
  if (isValidClinicId(value)) return value;
  notices.push('El número de sede no era válido; se quitó ese filtro.');
  return null;
}

function parseChoices(raw: RawSearchParams, notices: string[]) {
  const [rawStatus, rawModel, rawView] = [
    first(raw, 'status'),
    first(raw, 'modelKey'),
    first(raw, 'view'),
  ];
  const status = pick(rawStatus, LISTABLE_STATUSES);
  const modelKey = pick(rawModel, MODEL_KEYS);
  const view = pick(rawView, TRACKING_VIEWS);
  if (rawStatus !== undefined && !status) notices.push('El estado indicado no era válido.');
  if (rawModel !== undefined && !modelKey) notices.push('El modelo indicado no se reconoció.');
  if (rawView !== undefined && !view) notices.push('La vista de seguimiento no era válida.');
  return {
    status: status ?? 'SCHEDULED',
    modelKey: modelKey ?? DEFAULT_MODEL_KEY,
    view: view ?? 'authorizations',
  };
}

/** Normaliza los search params; los valores inválidos se reemplazan y se informan. */
export function parseOperationalParams(
  raw: RawSearchParams,
  today: string,
): ParsedOperationalParams {
  const notices: string[] = [];
  const period = parsePeriod(raw, today, notices);
  const query: OperationalQuery = {
    ...period,
    clinicId: parseClinicId(first(raw, 'clinicId'), notices),
    ...parseChoices(raw, notices),
    limit: parseLimit(first(raw, 'limit'), notices),
    risk: parsePage(raw, 'risk', notices),
    track: parsePage(raw, 'track', notices),
  };
  return { query, notices, periodError: validatePeriod(query.from, query.to) };
}
