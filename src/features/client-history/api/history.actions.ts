'use server';

import { z } from 'zod';

import { type ClientHistory, historicalAsOfSchema } from '@/features/client-history/api/contract';
import { getClientHistory } from '@/features/client-history/api/history.server';
import type { ApiResult } from '@/lib/api/result';
import { decimalIdSchema } from '@/lib/api/schemas';
import { invalidInputFailure } from '@/lib/errors/api-errors';

const inputSchema = z.object({
  reservationId: decimalIdSchema,
  historicalAsOf: historicalAsOfSchema,
});

/** Consulta interactiva del historial (cambio de modo). Solo lectura; entrada validada. */
export async function loadClientHistoryAction(
  reservationId: string,
  historicalAsOf: string,
): Promise<ApiResult<ClientHistory>> {
  const input = inputSchema.safeParse({ reservationId, historicalAsOf });
  if (!input.success) return invalidInputFailure();
  return getClientHistory(input.data.reservationId, input.data.historicalAsOf);
}
