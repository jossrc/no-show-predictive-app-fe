import 'server-only';

import type { z } from 'zod';

import {
  type AttendanceOutcomeList,
  attendanceOutcomeListSchema,
  type AttendanceState,
  attendanceStateEnvelopeSchema,
  type RecordAttendanceRequest,
  type RecordAttendanceResponse,
  recordAttendanceResponseSchema,
} from '@/features/operational-optimization/api/attendance.contract';
import {
  type EnableOverbookingRequest,
  type EnableOverbookingResponse,
  enableOverbookingResponseSchema,
  type OverbookingAuthorizationList,
  overbookingAuthorizationListSchema,
  type OverbookingState,
  overbookingStateEnvelopeSchema,
} from '@/features/operational-optimization/api/overbooking.contract';
import {
  type RecordListQuery,
  toRecordListParams,
} from '@/features/operational-optimization/api/records.contract';
import {
  type RecordSpaceRecoveryRequest,
  type RecordSpaceRecoveryResponse,
  recordSpaceRecoveryResponseSchema,
  type SpaceRecoveryOutcomeList,
  spaceRecoveryOutcomeListSchema,
  type SpaceRecoveryState,
  spaceRecoveryStateEnvelopeSchema,
} from '@/features/operational-optimization/api/recovery.contract';
import { fastifyRequest } from '@/lib/api/fastify-client';
import { reservationPath } from '@/lib/api/paths';
import { type ApiResult, mapApiResult } from '@/lib/api/result';
import { API_TIMEOUTS } from '@/lib/api/timeouts';

/**
 * Acceso servidor-servidor a los endpoints operativos de Sprint 02 (HU-06/07/08). Los GET son
 * lecturas puras; los POST solo se invocan desde Server Actions por una acción explícita.
 */

type Envelope<T> = { data: T; requestId: string };

async function readState<T>(
  reservationId: string,
  suffix: string,
  schema: z.ZodType<Envelope<T>>,
): Promise<ApiResult<T>> {
  const result = await fastifyRequest({
    path: reservationPath(reservationId, suffix),
    schema,
    timeoutMs: API_TIMEOUTS.read,
  });
  return mapApiResult(result, (body) => body.data);
}

async function post<T>(
  reservationId: string,
  suffix: string,
  body: unknown,
  schema: z.ZodType<Envelope<T>>,
): Promise<ApiResult<T>> {
  const result = await fastifyRequest({
    method: 'POST',
    path: reservationPath(reservationId, suffix),
    body,
    schema,
    timeoutMs: API_TIMEOUTS.operationalWrite,
  });
  return mapApiResult(result, (envelope) => envelope.data);
}

/* HU-06 */

export function getOverbookingState(reservationId: string): Promise<ApiResult<OverbookingState>> {
  return readState(reservationId, '/overbooking-authorization', overbookingStateEnvelopeSchema);
}

export function enableOverbooking(
  reservationId: string,
  request: EnableOverbookingRequest,
): Promise<ApiResult<EnableOverbookingResponse>> {
  return post(
    reservationId,
    '/overbooking-authorizations',
    request,
    enableOverbookingResponseSchema,
  );
}

export function listOverbookingAuthorizations(
  query: RecordListQuery,
): Promise<ApiResult<OverbookingAuthorizationList>> {
  return fastifyRequest({
    path: '/api/v1/overbooking-authorizations',
    query: toRecordListParams(query),
    schema: overbookingAuthorizationListSchema,
    timeoutMs: API_TIMEOUTS.read,
  });
}

/* HU-07 */

export function getAttendanceState(reservationId: string): Promise<ApiResult<AttendanceState>> {
  return readState(reservationId, '/attendance-outcome', attendanceStateEnvelopeSchema);
}

export function recordAttendance(
  reservationId: string,
  request: RecordAttendanceRequest,
): Promise<ApiResult<RecordAttendanceResponse>> {
  return post(reservationId, '/attendance-outcomes', request, recordAttendanceResponseSchema);
}

export function listAttendanceOutcomes(
  query: RecordListQuery,
): Promise<ApiResult<AttendanceOutcomeList>> {
  return fastifyRequest({
    path: '/api/v1/attendance-outcomes',
    query: toRecordListParams(query),
    schema: attendanceOutcomeListSchema,
    timeoutMs: API_TIMEOUTS.read,
  });
}

/* HU-08 */

export function getSpaceRecoveryState(
  reservationId: string,
): Promise<ApiResult<SpaceRecoveryState>> {
  return readState(reservationId, '/space-recovery-outcome', spaceRecoveryStateEnvelopeSchema);
}

export function recordSpaceRecovery(
  reservationId: string,
  request: RecordSpaceRecoveryRequest,
): Promise<ApiResult<RecordSpaceRecoveryResponse>> {
  return post(
    reservationId,
    '/space-recovery-outcomes',
    request,
    recordSpaceRecoveryResponseSchema,
  );
}

export function listSpaceRecoveryOutcomes(
  query: RecordListQuery,
): Promise<ApiResult<SpaceRecoveryOutcomeList>> {
  return fastifyRequest({
    path: '/api/v1/space-recovery-outcomes',
    query: toRecordListParams(query),
    schema: spaceRecoveryOutcomeListSchema,
    timeoutMs: API_TIMEOUTS.read,
  });
}
