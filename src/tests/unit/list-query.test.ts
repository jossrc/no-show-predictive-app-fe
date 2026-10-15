import { describe, expect, it } from 'vitest';

import {
  defaultFilters,
  parseReservationListParams,
  validatePeriod,
} from '@/features/reservations/model/list-query';
import {
  buildDetailHref,
  buildListHref,
  nextPageHref,
  pageNumber,
  previousPageHref,
  resolveBackHref,
  toBackendParams,
} from '@/features/reservations/model/list-url';

const TODAY = '2026-10-11';
const parse = (raw: Record<string, string | string[]>) => parseReservationListParams(raw, TODAY);

describe('Parámetros del listado en la URL (HU-03)', () => {
  it('conserva banda, modelo y orden exploratorio al avanzar y retroceder', () => {
    const initial = parse({
      experimentalRiskLevel: 'HIGH',
      modelKey: 'xgboost_full_v1',
      sort: 'experimentalRisk',
      limit: '10',
    }).query;
    const second = parse(
      Object.fromEntries(new URL(nextPageHref(initial, 'C1'), 'http://x').searchParams),
    ).query;
    expect(second).toMatchObject({
      experimentalRiskLevel: 'HIGH',
      modelKey: 'xgboost_full_v1',
      sort: 'experimentalRisk',
      limit: 10,
      cursor: 'C1',
    });
    expect(previousPageHref(second)).toBe(buildListHref(initial));
    expect(toBackendParams(second)).not.toHaveProperty('riskLevel');
  });

  it('quita una banda experimental inválida sin inventar otra', () => {
    const { query, notices } = parse({ experimentalRiskLevel: 'EXTREME' });
    expect(query.experimentalRiskLevel).toBeNull();
    expect(notices).toEqual(['La banda relativa indicada no era válida; se quitó ese filtro.']);
  });

  it('usa un rango predeterminado de 14 días desde hoy en Lima', () => {
    const { query, notices, periodError } = parse({});
    expect(query).toMatchObject({
      from: '2026-10-11',
      to: '2026-10-24',
      status: 'SCHEDULED',
      sort: 'appointmentAt',
      direction: 'asc',
      limit: 25,
      cursor: null,
    });
    expect(notices).toEqual([]);
    expect(periodError).toBeNull();
  });

  it('ignora riskLevel con un aviso explícito y no lo conserva en la consulta', () => {
    const { query, notices } = parse({ riskLevel: 'LOW' });
    expect(notices.join(' ')).toContain('nivel de riesgo');
    expect(JSON.stringify(query)).not.toContain('riskLevel');
    expect(toBackendParams(query)).not.toHaveProperty('riskLevel');
    expect(buildListHref(query)).not.toContain('riskLevel');
  });

  it('normaliza sort=riskLevel al orden cronológico con aviso', () => {
    const { query, notices } = parse({ sort: 'riskLevel' });
    expect(query.sort).toBe('appointmentAt');
    expect(notices).toHaveLength(1);
  });

  it('acepta el orden exploratorio por probabilidad y la dirección descendente', () => {
    const { query } = parse({
      sort: 'probabilityNoShow',
      direction: 'desc',
      modelKey: 'xgboost_full_v1',
    });
    expect(query).toMatchObject({
      sort: 'probabilityNoShow',
      direction: 'desc',
      modelKey: 'xgboost_full_v1',
    });
  });

  it('no admite PAST como filtro de estado', () => {
    const { query, notices } = parse({ status: 'PAST' });
    expect(query.status).toBe('SCHEDULED');
    expect(notices).toHaveLength(1);
  });

  it('valida la clínica como identificador numérico', () => {
    expect(parse({ clinicId: '11' }).query.clinicId).toBe('11');
    expect(parse({ clinicId: '11abc' }).query.clinicId).toBeNull();
    expect(parse({ clinicId: '0' }).notices).toHaveLength(1);
  });

  it('reemplaza fechas mal formadas por el rango predeterminado y completa una fecha faltante', () => {
    expect(parse({ from: '2026-02-30' }).query.from).toBe(TODAY);
    expect(parse({ from: '2026-12-01' }).query.to).toBe('2026-12-14');
  });

  it('detecta un período invertido o mayor de 92 días', () => {
    expect(parse({ from: '2026-12-10', to: '2026-12-01' }).periodError).toContain('posterior');
    expect(parse({ from: '2026-01-01', to: '2026-04-04' }).periodError).toContain('92');
    expect(validatePeriod('2026-01-01', '2026-04-03')).toBeNull(); // 92 días exactos
  });

  it('acepta límites 1–100 y normaliza el resto', () => {
    expect(parse({ limit: '100' }).query.limit).toBe(100);
    expect(parse({ limit: '101' }).query.limit).toBe(25);
    expect(parse({ limit: '-1' }).query.limit).toBe(25);
  });

  it('rechaza cursores con caracteres no permitidos', () => {
    const { query, notices } = parse({ cursor: 'abc$%' });
    expect(query.cursor).toBeNull();
    expect(notices).toHaveLength(1);
  });
});

describe('Paginación por cursor opaco', () => {
  const base = { ...defaultFilters(TODAY), cursor: null as string | null, trail: [] as string[] };

  it('avanza conservando filtros y el historial de cursores', () => {
    const page2 = parse(
      Object.fromEntries(new URL(nextPageHref(base, 'C1'), 'http://x').searchParams),
    ).query;
    expect(page2).toMatchObject({ cursor: 'C1', trail: [], from: base.from, to: base.to });
    expect(pageNumber(page2)).toBe(2);

    const page3 = parse(
      Object.fromEntries(new URL(nextPageHref(page2, 'C2'), 'http://x').searchParams),
    ).query;
    expect(page3).toMatchObject({ cursor: 'C2', trail: ['C1'] });
    expect(pageNumber(page3)).toBe(3);

    const back = parse(
      Object.fromEntries(new URL(previousPageHref(page3)!, 'http://x').searchParams),
    ).query;
    expect(back).toMatchObject({ cursor: 'C1', trail: [] });
    const first = previousPageHref(back)!;
    expect(first).not.toContain('cursor');
    expect(previousPageHref(base)).toBeNull();
  });

  it('descarta el cursor al cambiar filtros', () => {
    const href = buildListHref({ ...base, status: 'CANCELLED' });
    expect(href).not.toContain('cursor');
    expect(href).toContain('status=CANCELLED');
  });

  it('omite valores predeterminados en la URL pero conserva siempre el período', () => {
    expect(buildListHref(base)).toBe('/reservations?from=2026-10-11&to=2026-10-24');
  });
});

describe('Navegación al detalle y regreso', () => {
  it('conserva el estado del listado en el enlace de regreso', () => {
    const href = buildDetailHref(
      '900000000001001',
      '/reservations?from=2026-12-01&to=2026-12-31&cursor=C1',
    );
    const back = new URL(href, 'http://x').searchParams.get('back');
    expect(resolveBackHref(back ?? undefined)).toBe(
      '/reservations?from=2026-12-01&to=2026-12-31&cursor=C1',
    );
  });

  it('no permite redirecciones abiertas', () => {
    expect(resolveBackHref('https://evil.example.com')).toBe('/reservations');
    expect(resolveBackHref('//evil.example.com/reservations?x')).toBe('/reservations');
    expect(resolveBackHref('/reservations/../admin?x')).toBe('/reservations');
    expect(resolveBackHref(undefined)).toBe('/reservations');
  });
});
