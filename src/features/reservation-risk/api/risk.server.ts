import 'server-only';

import type { ModelKey } from '@/features/prediction-models/api/contract';
import {
  type RiskFactors,
  riskFactorsEnvelopeSchema,
} from '@/features/reservation-risk/api/factors.contract';
import {
  type PredictionRequest,
  type PredictionResponse,
  predictionResponseEnvelopeSchema,
  type RiskAssessment,
  riskAssessmentEnvelopeSchema,
} from '@/features/reservation-risk/api/risk.contract';
import { fastifyRequest } from '@/lib/api/fastify-client';
import { reservationPath } from '@/lib/api/paths';
import { type ApiResult, mapApiResult } from '@/lib/api/result';
import { API_TIMEOUTS } from '@/lib/api/timeouts';

/** HU-02 (lectura). El backend nunca ejecuta inferencia en este GET. */
export async function getReservationRisk(
  reservationId: string,
): Promise<ApiResult<RiskAssessment>> {
  const result = await fastifyRequest({
    path: reservationPath(reservationId, '/risk'),
    schema: riskAssessmentEnvelopeSchema,
    timeoutMs: API_TIMEOUTS.read,
  });
  return mapApiResult(result, (body) => body.data);
}

/** HU-02 (acción explícita). Puede persistir resultados: solo se invoca por acción del usuario. */
export async function requestReservationPrediction(
  reservationId: string,
  request: PredictionRequest,
): Promise<ApiResult<PredictionResponse>> {
  const result = await fastifyRequest({
    method: 'POST',
    path: reservationPath(reservationId, '/predictions'),
    body: request,
    schema: predictionResponseEnvelopeSchema,
    timeoutMs: API_TIMEOUTS.prediction,
  });
  return mapApiResult(result, (body) => body.data);
}

/** HU-05. Explicación local bajo demanda, un modelo por solicitud. */
export async function getRiskFactors(
  reservationId: string,
  modelKey: ModelKey,
  topK: number,
): Promise<ApiResult<RiskFactors>> {
  const result = await fastifyRequest({
    path: reservationPath(reservationId, '/risk/factors'),
    query: { modelKey, topK: String(topK) },
    schema: riskFactorsEnvelopeSchema,
    timeoutMs: API_TIMEOUTS.explanation,
  });
  return mapApiResult(result, (body) => body.data);
}
