import {
  DEFAULT_MODEL_KEY,
  MODEL_KEYS,
  type ModelKey,
} from '@/features/prediction-models/api/contract';
import { addCalendarDays, calendarDaysBetween, isCalendarDate } from '@/lib/dates/calendar';

/**
 * Estado del listado (HU-01/HU-03) representado en la URL. Es la única fuente de verdad
 * de filtros, orden y página. `riskLevel` y `sort=riskLevel` no existen en este modelo:
 * el backend responde 409 RISK_POLICY_UNAVAILABLE mientras la política esté pendiente.
 */
export const LISTABLE_STATUSES = ['SCHEDULED', 'CANCELLED'] as const;
export type ListableStatus = (typeof LISTABLE_STATUSES)[number];

export const SORT_FIELDS = ['appointmentAt', 'probabilityNoShow'] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_LIMIT = 25;
export const MAX_PERIOD_DAYS = 92;
/** Rango inicial: hoy y los 13 días siguientes en Lima (14 días de calendario). */
export const DEFAULT_PERIOD_DAYS = 14;

const CLINIC_ID_PATTERN = /^[1-9][0-9]{0,8}$/;
const CURSOR_PATTERN = /^[A-Za-z0-9_-]{1,512}$/;
const MAX_TRAIL = 100;
const TRAIL_SEPARATOR = '.';

export interface ReservationListFilters {
  from: string;
  to: string;
  status: ListableStatus;
  clinicId: string | null;
  sort: SortField;
  direction: SortDirection;
  modelKey: ModelKey;
  limit: number;
}

/** `cursor` es opaco; `trail` guarda los cursores de las páginas anteriores (sin la primera). */
export interface ReservationListQuery extends ReservationListFilters {
  cursor: string | null;
  trail: string[];
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface ParsedListParams {
  query: ReservationListQuery;
  notices: string[];
  periodError: string | null;
}

export function defaultFilters(today: string): ReservationListFilters {
  return {
    from: today,
    to: addCalendarDays(today, DEFAULT_PERIOD_DAYS - 1),
    status: 'SCHEDULED',
    clinicId: null,
    sort: 'appointmentAt',
    direction: 'asc',
    modelKey: DEFAULT_MODEL_KEY,
    limit: DEFAULT_LIMIT,
  };
}

export function validatePeriod(from: string, to: string): string | null {
  if (!isCalendarDate(from) || !isCalendarDate(to))
    return 'Las fechas deben tener el formato AAAA-MM-DD.';
  const span = calendarDaysBetween(from, to);
  if (span < 0) return 'La fecha final debe ser igual o posterior a la inicial.';
  if (span > MAX_PERIOD_DAYS) return `El período no puede superar ${MAX_PERIOD_DAYS} días.`;
  return null;
}

export function isValidClinicId(value: string): boolean {
  return CLINIC_ID_PATTERN.test(value);
}

function first(raw: RawSearchParams, key: string): string | undefined {
  const value = raw[key];
  return Array.isArray(value) ? value[0] : value;
}

function pickEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): { value: T; invalid: boolean } {
  if (value === undefined) return { value: fallback, invalid: false };
  const match = allowed.find((item) => item === value);
  return match ? { value: match, invalid: false } : { value: fallback, invalid: true };
}

function parsePeriod(raw: RawSearchParams, today: string, notices: string[]) {
  const defaults = defaultFilters(today);
  const from = first(raw, 'from');
  const to = first(raw, 'to');
  const fromValid = from !== undefined && isCalendarDate(from);
  const toValid = to !== undefined && isCalendarDate(to);

  if ((from !== undefined && !fromValid) || (to !== undefined && !toValid)) {
    notices.push('Se ignoró una fecha con formato no válido y se aplicó el rango predeterminado.');
    return { from: defaults.from, to: defaults.to };
  }
  if (fromValid && toValid) return { from, to };
  if (fromValid) return { from, to: addCalendarDays(from, DEFAULT_PERIOD_DAYS - 1) };
  if (toValid) return { from: addCalendarDays(to, -(DEFAULT_PERIOD_DAYS - 1)), to };
  return { from: defaults.from, to: defaults.to };
}

function parseLimit(value: string | undefined, notices: string[]): number {
  if (value === undefined) return DEFAULT_LIMIT;
  const limit = /^\d{1,3}$/.test(value) ? Number(value) : NaN;
  if (limit >= 1 && limit <= 100) return limit;
  notices.push(`Se ignoró un tamaño de página no válido; se muestran ${DEFAULT_LIMIT} reservas.`);
  return DEFAULT_LIMIT;
}

function parseClinicId(value: string | undefined, notices: string[]): string | null {
  if (value === undefined || value === '') return null;
  if (isValidClinicId(value)) return value;
  notices.push('Se ignoró un identificador de clínica no válido.');
  return null;
}

function parsePagination(raw: RawSearchParams, notices: string[]) {
  const cursor = first(raw, 'cursor');
  if (cursor === undefined) return { cursor: null, trail: [] };
  const trail = (first(raw, 'prev') ?? '').split(TRAIL_SEPARATOR).filter(Boolean);
  const valid = CURSOR_PATTERN.test(cursor) && trail.every((item) => CURSOR_PATTERN.test(item));
  if (!valid || trail.length > MAX_TRAIL) {
    notices.push('La posición de paginación no era válida; se muestra la primera página.');
    return { cursor: null, trail: [] };
  }
  return { cursor, trail };
}

function parseSort(raw: RawSearchParams, notices: string[]) {
  const rawSort = first(raw, 'sort');
  if (rawSort === 'riskLevel') {
    notices.push(
      'El orden por nivel de riesgo no está disponible mientras la clasificación esté pendiente de validación; se ordena por fecha de cita.',
    );
  }
  const sort = pickEnum(
    rawSort === 'riskLevel' ? undefined : rawSort,
    SORT_FIELDS,
    'appointmentAt',
  );
  const direction = pickEnum(first(raw, 'direction'), SORT_DIRECTIONS, 'asc');
  if (sort.invalid || direction.invalid) notices.push('Se ignoró un criterio de orden no válido.');
  return { sort: sort.value, direction: direction.value };
}

/**
 * Normaliza explícitamente los search params recibidos por el servidor. Los valores
 * inválidos se reemplazan por los predeterminados y se informan en `notices`.
 */
export function parseReservationListParams(raw: RawSearchParams, today: string): ParsedListParams {
  const notices: string[] = [];
  if (first(raw, 'riskLevel') !== undefined) {
    notices.push(
      'Se ignoró el filtro por nivel de riesgo: la clasificación está pendiente de validación científica.',
    );
  }
  const status = pickEnum(first(raw, 'status'), LISTABLE_STATUSES, 'SCHEDULED');
  const modelKey = pickEnum(first(raw, 'modelKey'), MODEL_KEYS, DEFAULT_MODEL_KEY);
  if (status.invalid) notices.push('Se ignoró un estado de reserva no válido.');
  if (modelKey.invalid) notices.push('Se ignoró un modelo no reconocido.');

  const period = parsePeriod(raw, today, notices);
  const query: ReservationListQuery = {
    ...period,
    status: status.value,
    clinicId: parseClinicId(first(raw, 'clinicId'), notices),
    ...parseSort(raw, notices),
    modelKey: modelKey.value,
    limit: parseLimit(first(raw, 'limit'), notices),
    ...parsePagination(raw, notices),
  };
  return { query, notices, periodError: validatePeriod(query.from, query.to) };
}
