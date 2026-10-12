import { addCalendarDays, calendarDaysBetween, isCalendarDate } from '@/lib/dates/calendar';
import {
  appointmentAt,
  MOCK_CLINICS,
  MOCK_RESERVATIONS,
  mockExperimentalRisk,
  type MockReservation,
  RF,
  toListItem,
  XGB,
} from '@/tests/mocks/fastify/fixtures/reservations';
import { mockError, mockOk, type MockResponse } from '@/tests/mocks/fastify/responses';

/** Simulación del listado: mismas validaciones y paginación keyset (cursor opaco). */

function encodeCursor(offset: number): string {
  return Buffer.from(`offset:${offset}`).toString('base64url');
}

function decodeCursor(cursor: string): number | null {
  const match = /^offset:(\d+)$/.exec(Buffer.from(cursor, 'base64url').toString());
  return match ? Number(match[1]) : null;
}

function selectedModel(params: URLSearchParams): string {
  return params.get('modelKey') ?? RF.key;
}

function validateQuery(params: URLSearchParams): MockResponse | null {
  if (params.has('riskLevel') || params.get('sort') === 'riskLevel') {
    return mockError(409, 'RISK_POLICY_UNAVAILABLE', 'Niveles de riesgo pendientes de validación');
  }
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  if (!isCalendarDate(from) || !isCalendarDate(to)) {
    return mockError(400, 'REQUEST_VALIDATION_ERROR', 'La solicitud no pudo ser procesada');
  }
  const span = calendarDaysBetween(from, to);
  if (span < 0 || span > 92) return mockError(422, 'INVALID_PERIOD', 'Período inválido');
  const clinicId = params.get('clinicId');
  if (clinicId === MOCK_CLINICS.unknown)
    return mockError(422, 'UNKNOWN_CLINIC', 'La sede no existe');
  if (clinicId === MOCK_CLINICS.unavailable) {
    return mockError(503, 'SOURCE_DATA_UNAVAILABLE', 'Servicio temporalmente no disponible');
  }
  if (clinicId === MOCK_CLINICS.unauthorized) {
    return mockError(401, 'UNAUTHORIZED', 'Autenticación requerida');
  }
  return null;
}

function probabilityFor(
  reservation: MockReservation,
  modelKey: string,
  requireBand: boolean,
): number | null {
  const score = reservation.scores.find((score) => score.model.key === modelKey);
  return score && (!requireBand || score.experimentalLevel) ? score.probability : null;
}

function sortReservations(items: MockReservation[], params: URLSearchParams, now: Date) {
  const descending = params.get('direction') === 'desc';
  const modelKey = params.get('modelKey') ?? 'random_forest_full_v1';
  const requireBand = params.get('sort') === 'experimentalRisk';
  const byDate = (a: MockReservation, b: MockReservation) =>
    appointmentAt(a, now).localeCompare(appointmentAt(b, now));
  if (!['probabilityNoShow', 'experimentalRisk'].includes(params.get('sort') ?? '')) {
    return items.sort((a, b) => (descending ? byDate(b, a) : byDate(a, b)));
  }
  // Orden exploratorio por probabilidad, NULLS LAST, desempate cronológico.
  return items.sort((a, b) => {
    const pa = probabilityFor(a, modelKey, requireBand);
    const pb = probabilityFor(b, modelKey, requireBand);
    if (pa === null || pb === null) return pa === pb ? byDate(a, b) : pa === null ? 1 : -1;
    return (descending ? pb - pa : pa - pb) || byDate(a, b);
  });
}

function inPeriod(reservation: MockReservation, from: string, to: string, now: Date): boolean {
  const day = appointmentAt(reservation, now);
  const start = new Date(`${from}T00:00:00-05:00`).toISOString();
  const end = new Date(`${to}T23:59:59.999-05:00`).toISOString();
  return day >= start && day <= end;
}

function matchesExperimentalLevel(item: MockReservation, params: URLSearchParams): boolean {
  const level = params.get('experimentalRiskLevel');
  const modelKey = selectedModel(params);
  return (
    level === null ||
    item.scores.some((score) => score.model.key === modelKey && score.experimentalLevel === level)
  );
}

function mockExperimentalPolicy(modelKey: string) {
  const band = mockExperimentalRisk({
    model: modelKey === RF.key ? RF : XGB,
    probability: 0.31,
    experimentalLevel: 'MEDIUM',
  });
  if (!band) throw new Error('Política sintética ausente');
  return {
    modelKey,
    policyId: band.policyId,
    policyVersion: band.policyVersion,
    policyHash: band.policyHash,
    status: band.status,
    classificationBasis: band.classificationBasis,
    operationalUseAllowed: false,
    notice: 'Política sintética exclusiva de pruebas.',
  };
}

export function listMockReservations(params: URLSearchParams, now: Date): MockResponse {
  const invalid = validateQuery(params);
  if (invalid) return invalid;

  const cursor = params.get('cursor');
  const offset = cursor === null ? 0 : decodeCursor(cursor);
  if (offset === null) {
    return mockError(
      422,
      'INVALID_CURSOR',
      'El cursor de paginación no es válido para esta consulta',
    );
  }

  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const clinicId = params.get('clinicId');
  const limit = Number(params.get('limit') ?? '25');
  const modelKey = selectedModel(params);
  const filtered = MOCK_RESERVATIONS.filter(
    (item) =>
      item.status === (params.get('status') ?? 'SCHEDULED') &&
      matchesExperimentalLevel(item, params) &&
      (clinicId === null || String(item.clinicId) === clinicId) &&
      inPeriod(item, from, to, now),
  );
  const sorted = sortReservations([...filtered], params, now);
  const page = sorted.slice(offset, offset + limit);
  const hasMore = offset + limit < sorted.length;

  return mockOk({
    data: page.map((item) => toListItem(item, now, modelKey)),
    pagination: { limit, nextCursor: hasMore ? encodeCursor(offset + limit) : null },
    period: {
      from,
      to,
      timeZone: 'America/Lima',
      startInclusive: new Date(`${from}T00:00:00-05:00`).toISOString(),
      endExclusive: new Date(`${addCalendarDays(to, 1)}T00:00:00-05:00`).toISOString(),
    },
    sort: {
      field: params.get('sort') ?? 'appointmentAt',
      direction: params.get('direction') ?? 'asc',
      modelKey: params.get('modelKey') ?? 'random_forest_full_v1',
      semantics:
        params.get('sort') === 'probabilityNoShow' ? 'EXPLORATORY_SCORE_ORDER' : 'CHRONOLOGICAL',
    },
    riskPolicyStatus: 'pending_validation',
    classificationUnavailable: false,
    operationalClassificationUnavailable: true,
    experimentalClassificationUnavailable: false,
    experimentalRiskPolicy: mockExperimentalPolicy(modelKey),
    sourceStatus: 'SYNTHETIC_DEMO_ONLY',
    predictiveStoreAvailable: true,
  });
}
