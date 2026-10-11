import 'server-only';

import {
  type ClientHistory,
  clientHistoryEnvelopeSchema,
  type HistoricalAsOf,
} from '@/features/client-history/api/contract';
import { fastifyRequest } from '@/lib/api/fastify-client';
import { reservationPath } from '@/lib/api/paths';
import { type ApiResult, mapApiResult } from '@/lib/api/result';
import { API_TIMEOUTS } from '@/lib/api/timeouts';

/** HU-06. El cliente se deriva de la reserva en el backend; no se envía clientId. */
export async function getClientHistory(
  reservationId: string,
  historicalAsOf: HistoricalAsOf,
): Promise<ApiResult<ClientHistory>> {
  const result = await fastifyRequest({
    path: reservationPath(reservationId, '/client-history'),
    query: { historicalAsOf },
    schema: clientHistoryEnvelopeSchema,
    timeoutMs: API_TIMEOUTS.read,
  });
  return mapApiResult(result, (body) => body.data);
}
