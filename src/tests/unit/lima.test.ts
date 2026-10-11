import { describe, expect, it } from 'vitest';

import {
  addCalendarDays,
  calendarDaysBetween,
  formatCalendarDate,
  isCalendarDate,
  todayInLima,
} from '@/lib/dates/calendar';
import {
  formatLimaDate,
  formatLimaDateTime,
  formatLimaTime,
  getLimaDateKey,
} from '@/lib/dates/lima';

// Intl puede usar espacios no separables; se normalizan para comparar.
const plain = (value: string) => value.replace(/[  ]/g, ' ');

describe('Instantes UTC presentados en America/Lima', () => {
  it('muestra el formato «5 dic. 2026 · 3:30 p. m.»', () => {
    expect(plain(formatLimaDateTime('2026-12-05T20:30:00.000Z'))).toBe('5 dic. 2026 · 3:30 p. m.');
    expect(plain(formatLimaDate('2026-12-05T20:30:00Z'))).toBe('5 dic. 2026');
    expect(plain(formatLimaTime('2026-12-05T20:30:00Z'))).toBe('3:30 p. m.');
  });

  it('respeta el cambio de día cerca de medianoche UTC', () => {
    expect(getLimaDateKey('2026-10-11T02:30:00Z')).toBe('2026-10-10');
    expect(getLimaDateKey('2026-10-11T04:59:59Z')).toBe('2026-10-10');
    expect(getLimaDateKey('2026-10-11T05:00:00Z')).toBe('2026-10-11');
    expect(plain(formatLimaDateTime('2026-10-11T00:15:00Z'))).toBe('10 oct. 2026 · 7:15 p. m.');
  });

  it('interpreta de forma equivalente timestamps con desplazamiento', () => {
    expect(formatLimaDateTime('2026-10-11T02:30:00Z')).toBe(
      formatLimaDateTime('2026-10-10T21:30:00-05:00'),
    );
  });

  it('conserva el instante UTC original', () => {
    const instant = new Date('2026-10-11T02:30:00Z');
    formatLimaDateTime(instant);
    expect(instant.toISOString()).toBe('2026-10-11T02:30:00.000Z');
  });

  it('rechaza fechas ambiguas sin zona horaria o inválidas', () => {
    expect(() => getLimaDateKey('2026-10-11T02:30:00')).toThrow(RangeError);
    expect(() => formatLimaDateTime(new Date('invalid'))).toThrow(RangeError);
  });
});

describe('Fechas de calendario YYYY-MM-DD', () => {
  it('calcula «hoy» en Lima y no en UTC', () => {
    expect(todayInLima(new Date('2026-10-11T03:00:00Z'))).toBe('2026-10-10');
    expect(todayInLima(new Date('2026-10-11T05:00:00Z'))).toBe('2026-10-11');
  });

  it('suma días sin desfases de zona horaria, incluso entre meses y años bisiestos', () => {
    expect(addCalendarDays('2026-10-11', 13)).toBe('2026-10-24');
    expect(addCalendarDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addCalendarDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(calendarDaysBetween('2026-01-01', '2026-04-03')).toBe(92);
  });

  it('valida fechas reales', () => {
    expect(isCalendarDate('2026-02-29')).toBe(false);
    expect(isCalendarDate('2028-02-29')).toBe(true);
    expect(isCalendarDate('2026-1-01')).toBe(false);
  });

  it('formatea una fecha de calendario sin cambiar el día', () => {
    expect(plain(formatCalendarDate('2026-12-01'))).toBe('1 dic. 2026');
  });
});
