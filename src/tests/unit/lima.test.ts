import { describe, expect, it } from 'vitest';

import { formatLimaDateTime, getLimaDateKey } from '@/lib/dates/lima';

describe('Fechas en America/Lima', () => {
  it('respeta el cambio de día de UTC a Lima', () => {
    expect(getLimaDateKey('2026-10-11T02:30:00Z')).toBe('2026-10-10');
  });

  it('interpreta de forma equivalente timestamps con desplazamiento', () => {
    expect(formatLimaDateTime('2026-10-11T02:30:00Z')).toBe(
      formatLimaDateTime('2026-10-10T21:30:00-05:00'),
    );
    expect(formatLimaDateTime('2026-10-11T02:30:00Z')).toContain('21:30');
  });

  it('conserva el instante UTC original', () => {
    const instant = new Date('2026-10-11T02:30:00Z');
    formatLimaDateTime(instant);
    expect(instant.toISOString()).toBe('2026-10-11T02:30:00.000Z');
  });

  it('rechaza fechas ambiguas sin zona horaria', () => {
    expect(() => getLimaDateKey('2026-10-11T02:30:00')).toThrow(RangeError);
  });

  it('rechaza fechas inválidas', () => {
    expect(() => formatLimaDateTime(new Date('invalid'))).toThrow(RangeError);
  });
});
