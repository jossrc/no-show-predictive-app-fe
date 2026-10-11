import 'server-only';

import {
  type MlHealth,
  mlHealthSchema,
  type ModelCatalog,
  modelCatalogEnvelopeSchema,
} from '@/features/prediction-models/api/contract';
import { fastifyRequest } from '@/lib/api/fastify-client';
import { type ApiResult, mapApiResult } from '@/lib/api/result';
import { API_TIMEOUTS } from '@/lib/api/timeouts';

/** Soporte: identidad pública de RF y XGBoost. Su fallo no debe ocultar reservas. */
export async function getModelCatalog(): Promise<ApiResult<ModelCatalog>> {
  const result = await fastifyRequest({
    path: '/api/v1/ml/models',
    schema: modelCatalogEnvelopeSchema,
    timeoutMs: API_TIMEOUTS.modelCatalog,
  });
  return mapApiResult(result, (body) => body.data);
}

/** Soporte público (sin credencial). El 503 forma parte del contrato (status=error). */
export function getMlHealth(): Promise<ApiResult<MlHealth>> {
  return fastifyRequest({
    path: '/api/v1/health/ml',
    schema: mlHealthSchema,
    timeoutMs: API_TIMEOUTS.health,
    access: 'public',
    acceptStatuses: [503],
  });
}
