'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';

import { modelKeySchema } from '@/features/prediction-models/api/contract';
import {
  type RiskFactors,
  TOP_K_MAX,
  TOP_K_MIN,
} from '@/features/reservation-risk/api/factors.contract';
import { predictionRequestSchema } from '@/features/reservation-risk/api/risk.contract';
import {
  getRiskFactors,
  requestReservationPrediction,
} from '@/features/reservation-risk/api/risk.server';
import type { ApiResult } from '@/lib/api/result';
import { decimalIdSchema } from '@/lib/api/schemas';
import { invalidInputFailure } from '@/lib/errors/api-errors';

/**
 * Server Actions de HU-02/HU-05. Next.js valida el origen (CSRF) de cada invocación; además,
 * toda entrada se valida aquí antes de contactar a Fastify. La credencial nunca sale del servidor
 * y las respuestas se limitan a lo que la interfaz necesita mostrar.
 */

export interface PredictionOutcome {
  /** 201: se creó y persistió un nuevo run. */
  created: boolean;
  /** 200 con `run.replayed=true`: se reutilizó una predicción existente. */
  replayed: boolean;
  requestedModelKeys: string[];
  featureWarnings: string[];
}

const predictionInputSchema = z.object({
  reservationId: decimalIdSchema,
  request: predictionRequestSchema,
});

export async function requestPredictionAction(
  reservationId: string,
  request: unknown,
): Promise<ApiResult<PredictionOutcome>> {
  const input = predictionInputSchema.safeParse({ reservationId, request });
  if (!input.success) return invalidInputFailure();

  const result = await requestReservationPrediction(input.data.reservationId, input.data.request);
  if (!result.ok) return result;

  // Actualiza la ruta actual (riesgo y detalle) en la misma respuesta de la acción.
  refresh();
  return {
    ok: true,
    status: result.status,
    requestId: result.requestId,
    data: {
      created: result.status === 201,
      replayed: result.data.run.replayed,
      requestedModelKeys: result.data.run.requestedModelKeys,
      featureWarnings: result.data.featureWarnings,
    },
  };
}

const factorsInputSchema = z.object({
  reservationId: decimalIdSchema,
  modelKey: modelKeySchema,
  topK: z.number().int().min(TOP_K_MIN).max(TOP_K_MAX),
});

export async function loadRiskFactorsAction(
  reservationId: string,
  modelKey: string,
  topK: number,
): Promise<ApiResult<RiskFactors>> {
  const input = factorsInputSchema.safeParse({ reservationId, modelKey, topK });
  if (!input.success) return invalidInputFailure();
  return getRiskFactors(input.data.reservationId, input.data.modelKey, input.data.topK);
}
