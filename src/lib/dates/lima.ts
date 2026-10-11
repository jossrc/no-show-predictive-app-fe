import { formatInTimeZone } from 'date-fns-tz';

/**
 * Instantes UTC del backend presentados en la zona de negocio America/Lima.
 * Nunca se usa la zona horaria del navegador ni se modifica el instante original.
 */
export const LIMA_TIME_ZONE = 'America/Lima';
const LOCALE = 'es-PE';

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: LIMA_TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: LIMA_TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const weekdayFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: LIMA_TIME_ZONE,
  weekday: 'short',
});

function toInstant(value: string | Date): Date {
  if (typeof value === 'string' && !/(Z|[+-]\d{2}:\d{2})$/i.test(value)) {
    throw new RangeError('El timestamp debe incluir Z o un desplazamiento UTC explícito.');
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('El timestamp no representa una fecha válida.');
  }
  return date;
}

/** `5 dic. 2026` en Lima. */
export function formatLimaDate(value: string | Date): string {
  return dateFormatter.format(toInstant(value));
}

/** `3:30 p. m.` en Lima. */
export function formatLimaTime(value: string | Date): string {
  return timeFormatter.format(toInstant(value));
}

/** `5 dic. 2026 · 3:30 p. m.` en Lima. */
export function formatLimaDateTime(value: string | Date): string {
  const instant = toInstant(value);
  return `${dateFormatter.format(instant)} · ${timeFormatter.format(instant)}`;
}

/** Día abreviado de la semana en Lima, p. ej. `sáb.`. */
export function formatLimaWeekday(value: string | Date): string {
  return weekdayFormatter.format(toInstant(value));
}

/** Fecha de calendario `YYYY-MM-DD` del instante en Lima. */
export function getLimaDateKey(value: string | Date): string {
  return formatInTimeZone(toInstant(value), LIMA_TIME_ZONE, 'yyyy-MM-dd');
}
