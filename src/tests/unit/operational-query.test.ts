import { describe, expect, it } from 'vitest';

import { parseOperationalParams } from '@/features/operational-optimization/model/query';
import {
  blockPageHrefs,
  buildOperationalHref,
  currentOperationalHref,
  toHighRiskListQuery,
  toTrackingListQuery,
  trackingViewHref,
} from '@/features/operational-optimization/model/urls';
import { toBackendParams } from '@/features/reservations/model/list-url';
import {
  backLinkLabel,
  buildDetailHref,
  resolveBackHref,
} from '@/features/reservations/model/list-url';

const TODAY = '2026-11-04';
const parse = (raw: Record<string, string>) => parseOperationalParams(raw, TODAY);

describe('Estado de «Optimización operativa» en la URL', () => {
  it('aplica el período predeterminado (7 días previos y 3 semanas) y el modelo RF', () => {
    const { query, notices, periodError } = parse({});
    expect(query).toMatchObject({
      from: '2026-10-28',
      to: '2026-11-24',
      clinicId: null,
      status: 'SCHEDULED',
      modelKey: 'random_forest_full_v1',
      view: 'authorizations',
      limit: 25,
    });
    expect(notices).toEqual([]);
    expect(periodError).toBeNull();
  });

  it('normaliza valores inválidos con avisos y valida el período de 92 días', () => {
    const { query, notices } = parse({
      from: '2026-13-01',
      to: '2026-11-10',
      clinicId: 'abc',
      status: 'PAST',
      modelKey: 'ensemble',
      view: 'reportes',
      riskCursor: '***',
    });
    expect(query).toMatchObject({
      from: '2026-10-28',
      clinicId: null,
      status: 'SCHEDULED',
      modelKey: 'random_forest_full_v1',
      view: 'authorizations',
      risk: { cursor: null, trail: [] },
    });
    expect(notices).toHaveLength(6);
    expect(parse({ from: '2026-01-01', to: '2026-12-31' }).periodError).toMatch(/92 días/);
  });

  it('la URL es canónica, compatible con volver y conserva ambos cursores por separado', () => {
    const raw = {
      from: '2026-11-01',
      to: '2026-11-30',
      clinicId: '7',
      modelKey: 'xgboost_full_v1',
      riskCursor: 'r2',
      riskPrev: 'r1',
      view: 'attendance',
      trackCursor: 't1',
    };
    const { query } = parse(raw);
    const href = currentOperationalHref(query);
    expect(parse(Object.fromEntries(new URL(href, 'http://x').searchParams)).query).toEqual(query);

    const pages = blockPageHrefs(query, 'risk', 'r3');
    expect(pages.next).toContain('riskCursor=r3');
    expect(pages.next).toContain('riskPrev=r1.r2');
    expect(pages.next).toContain('trackCursor=t1');
    expect(pages.previous).toContain('riskCursor=r1');
    expect(pages.first).not.toContain('riskCursor');
    expect(pages.first).toContain('trackCursor=t1');
  });

  it('cambiar de vista reinicia solo el cursor del seguimiento', () => {
    const { query } = parse({ riskCursor: 'r2', view: 'attendance', trackCursor: 't1' });
    const href = trackingViewHref(query, 'recovery');
    expect(href).toContain('view=recovery');
    expect(href).toContain('riskCursor=r2');
    expect(href).not.toContain('trackCursor');
    expect(buildOperationalHref(query, { view: 'authorizations' })).not.toContain('view=');
  });

  it('alto riesgo: banda HIGH del modelo elegido; seguimiento: sin status ni modelo', () => {
    const { query } = parse({ modelKey: 'xgboost_full_v1', status: 'CANCELLED', riskCursor: 'r1' });
    const backend = toBackendParams(toHighRiskListQuery(query));
    expect(backend).toMatchObject({
      experimentalRiskLevel: 'HIGH',
      modelKey: 'xgboost_full_v1',
      status: 'CANCELLED',
      sort: 'appointmentAt',
      cursor: 'r1',
    });
    expect(backend).not.toHaveProperty('riskLevel');
    const tracking = toTrackingListQuery(query);
    expect(tracking).not.toHaveProperty('status');
    expect(tracking).not.toHaveProperty('modelKey');
    expect(tracking.cursor).toBeNull();
  });
});

describe('Regreso desde el detalle', () => {
  it('acepta la pantalla operativa como origen, con su propia etiqueta', () => {
    const back = buildOperationalHref(parse({}).query);
    const detail = buildDetailHref('900000000001010', back);
    const resolved = resolveBackHref(
      new URL(detail, 'http://x').searchParams.get('back') ?? undefined,
    );
    expect(resolved).toBe(back);
    expect(backLinkLabel(resolved)).toBe('Volver a optimización operativa');
    expect(backLinkLabel('/reservations?from=2026-11-01&to=2026-11-14')).toBe('Volver a reservas');
  });

  it('rechaza rutas externas o desconocidas', () => {
    expect(resolveBackHref('/operational-optimization/../admin?x')).toBe('/reservations');
    expect(resolveBackHref('https://evil.example.com/operational-optimization?x')).toBe(
      '/reservations',
    );
    expect(resolveBackHref('/operational-optimizationX?x')).toBe('/reservations');
  });
});
