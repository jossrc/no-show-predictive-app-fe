import { addCalendarDays, calendarDaysBetween, isCalendarDate } from '@/lib/dates/calendar';
import { MOCK_CLINICS } from '@/tests/mocks/fastify/fixtures/reservations';
import { operationalStore } from '@/tests/mocks/fastify/operational-store';
import { mockError, mockOk, type MockResponse } from '@/tests/mocks/fastify/responses';

/**
 * Listados persistidos SIMULADOS (`GET /overbooking-authorizations`, `/attendance-outcomes`,
 * `/space-recovery-outcomes`): mismos parámetros, validaciones, orden y paginación keyset.
 */
const LIST_KINDS = {
  '/api/v1/overbooking-authorizations': 'authorizations',
  '/api/v1/attendance-outcomes': 'attendance',
  '/api/v1/space-recovery-outcomes': 'recovery',
} as const;
type ListKind = (typeof LIST_KINDS)[keyof typeof LIST_KINDS];

/** El querystring del backend es `additionalProperties:false`: `status` u otros ⇒ 400. */
const ALLOWED_PARAMS = new Set(['from', 'to', 'clinicId', 'limit', 'cursor']);

export function isOperationalListPath(pathname: string): pathname is keyof typeof LIST_KINDS {
  return pathname in LIST_KINDS;
}

function encodeCursor(kind: ListKind, offset: number): string {
  return Buffer.from(`${kind}:${offset}`).toString('base64url');
}

function decodeCursor(kind: ListKind, cursor: string): number | null {
  const match = /^([a-z]+):(\d+)$/.exec(Buffer.from(cursor, 'base64url').toString());
  return match && match[1] === kind ? Number(match[2]) : null;
}

function invalidRequest(params: URLSearchParams): boolean {
  if ([...params.keys()].some((key) => !ALLOWED_PARAMS.has(key))) return true;
  const limit = Number(params.get('limit') ?? '25');
  const datesValid =
    isCalendarDate(params.get('from') ?? '') && isCalendarDate(params.get('to') ?? '');
  return !datesValid || !Number.isInteger(limit) || limit < 1 || limit > 100;
}

function validate(params: URLSearchParams): MockResponse | null {
  if (invalidRequest(params)) {
    return mockError(400, 'REQUEST_VALIDATION_ERROR', 'La solicitud contiene datos inválidos');
  }
  const span = calendarDaysBetween(params.get('from') ?? '', params.get('to') ?? '');
  if (span < 0 || span > 92) return mockError(422, 'INVALID_PERIOD', 'Período inválido');
  if (params.get('clinicId') === MOCK_CLINICS.unknown) {
    return mockError(422, 'UNKNOWN_CLINIC', 'La sede no existe');
  }
  return null;
}

function records(kind: ListKind, now: Date) {
  const store = operationalStore(now);
  const source =
    kind === 'authorizations'
      ? store.authorizations
      : kind === 'attendance'
        ? store.attendance
        : store.recovery;
  return [...source.values()];
}

export function listOperationalRecords(
  pathname: keyof typeof LIST_KINDS,
  params: URLSearchParams,
  now: Date,
): MockResponse {
  const invalid = validate(params);
  if (invalid) return invalid;
  const kind = LIST_KINDS[pathname];
  const cursor = params.get('cursor');
  const offset = cursor === null ? 0 : decodeCursor(kind, cursor);
  if (offset === null) return mockError(422, 'INVALID_CURSOR', 'El cursor no es válido');

  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const startInclusive = new Date(`${from}T00:00:00-05:00`).toISOString();
  const endExclusive = new Date(`${addCalendarDays(to, 1)}T00:00:00-05:00`).toISOString();
  const clinicId = params.get('clinicId');
  const limit = Number(params.get('limit') ?? '25');
  const matching = records(kind, now)
    .filter(
      (record) => record.appointmentAt >= startInclusive && record.appointmentAt < endExclusive,
    )
    .filter((record) => clinicId === null || String(record.clinicId) === clinicId)
    .sort(
      (a, b) =>
        a.appointmentAt.localeCompare(b.appointmentAt) ||
        a.reservationId.localeCompare(b.reservationId),
    );
  const page = matching.slice(offset, offset + limit);
  const hasMore = offset + limit < matching.length;
  return mockOk({
    data: page,
    pagination: { limit, nextCursor: hasMore ? encodeCursor(kind, offset + limit) : null },
    period: { from, to, timeZone: 'America/Lima', startInclusive, endExclusive },
  });
}
