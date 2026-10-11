import 'server-only';

import {
  type ReservationDetail,
  reservationDetailEnvelopeSchema,
  type ReservationList,
  reservationListSchema,
} from '@/features/reservations/api/contract';
import type { ReservationListQuery } from '@/features/reservations/model/list-query';
import { toBackendParams } from '@/features/reservations/model/list-url';
import { fastifyRequest } from '@/lib/api/fastify-client';
import { reservationPath } from '@/lib/api/paths';
import { type ApiResult, mapApiResult } from '@/lib/api/result';
import { API_TIMEOUTS } from '@/lib/api/timeouts';

/** HU-01/HU-03. El listado ya incluye scores persistidos: no hay consultas por fila. */
export function listReservations(query: ReservationListQuery): Promise<ApiResult<ReservationList>> {
  return fastifyRequest({
    path: '/api/v1/reservations',
    query: toBackendParams(query),
    schema: reservationListSchema,
    timeoutMs: API_TIMEOUTS.read,
  });
}

export async function getReservation(reservationId: string): Promise<ApiResult<ReservationDetail>> {
  const result = await fastifyRequest({
    path: reservationPath(reservationId),
    schema: reservationDetailEnvelopeSchema,
    timeoutMs: API_TIMEOUTS.read,
  });
  return mapApiResult(result, (body) => body.data);
}
