import { getLimaDateKey } from '@/lib/dates/lima';

/**
 * Fechas de calendario `YYYY-MM-DD` (sin hora ni zona), como las de `from`/`to` del listado.
 * Se operan con aritmética UTC pura para evitar desfases de un día: nunca se serializan
 * con `toISOString()` a partir de una fecha local.
 */
const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

function toUtcMidnight(key: string): number | null {
  const match = CALENDAR_DATE.exec(key);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const time = Date.UTC(year, month - 1, day);
  const date = new Date(time);
  const valid =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return valid ? time : null;
}

function fromUtcMidnight(time: number): string {
  const date = new Date(time);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function isCalendarDate(value: string): boolean {
  return toUtcMidnight(value) !== null;
}

/** Fecha actual del calendario de Lima (no la del navegador ni la del proceso). */
export function todayInLima(now: Date = new Date()): string {
  return getLimaDateKey(now);
}

export function addCalendarDays(key: string, days: number): string {
  const time = toUtcMidnight(key);
  if (time === null) throw new RangeError(`Fecha de calendario inválida: ${key}`);
  return fromUtcMidnight(time + days * MS_PER_DAY);
}

/** Días entre dos fechas de calendario (`to - from`); negativo si `to` es anterior. */
export function calendarDaysBetween(from: string, to: string): number {
  const start = toUtcMidnight(from);
  const end = toUtcMidnight(to);
  if (start === null || end === null) throw new RangeError('Fecha de calendario inválida');
  return Math.round((end - start) / MS_PER_DAY);
}

const calendarFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** `1 dic. 2026` para una fecha de calendario, sin conversión de zona horaria. */
export function formatCalendarDate(key: string): string {
  const time = toUtcMidnight(key);
  if (time === null) throw new RangeError(`Fecha de calendario inválida: ${key}`);
  return calendarFormatter.format(new Date(time));
}
