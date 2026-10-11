import { formatInTimeZone } from 'date-fns-tz';

export const LIMA_TIME_ZONE = 'America/Lima';

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

export function formatLimaDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
    hourCycle: 'h23',
  }).format(toInstant(value));
}

export function getLimaDateKey(value: string | Date): string {
  return formatInTimeZone(toInstant(value), LIMA_TIME_ZONE, 'yyyy-MM-dd');
}
