import type { MlHealth } from '@/features/prediction-models/api/contract';
import type { ApiResult } from '@/lib/api/result';
import {
  type DiagnosticSection,
  diagnosticSection,
  responseSections,
} from '@/lib/diagnostics/sections';

const SCOPE_NOTE =
  'Solo refleja el chequeo de salud; no garantiza que cada predicción o explicación pueda generarse.';

/** Disponibilidad del servicio ML para el diagnóstico. Nunca afirma que «todo está operativo». */
export function describeMlHealth(result: ApiResult<MlHealth>): string {
  if (!result.ok) return 'Sin verificar';
  if (result.data.status === 'ok') return 'Disponible (uso exploratorio)';
  if (result.data.status === 'disabled') return 'Deshabilitado en el backend';
  return 'No disponible';
}

/** Información de Health ML para el panel de desarrollo (no se muestra en producción). */
export function healthDiagnostics(result: ApiResult<MlHealth>): DiagnosticSection[] {
  const health = result.ok ? result.data : null;
  return [
    diagnosticSection('Servicio ML · GET /api/v1/health/ml', [
      ['Disponibilidad', describeMlHealth(result)],
      ['Estado reportado', health?.status],
      ['Mensaje', health?.message],
      ['Estado de servicio', health?.servingStatus],
      ['Alcance', SCOPE_NOTE],
    ]),
    ...responseSections(result),
  ];
}
