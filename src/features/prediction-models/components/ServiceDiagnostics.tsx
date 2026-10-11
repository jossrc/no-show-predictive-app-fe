import { DevelopmentDiagnostics } from '@/components/diagnostics/DevelopmentDiagnostics';
import { getMlHealth } from '@/features/prediction-models/api/models.server';
import { healthDiagnostics } from '@/features/prediction-models/model/health-view';
import { getPresentationConfig } from '@/lib/config/presentation';
import { getDataSourceStatus } from '@/lib/config/server';
import { diagnosticSection } from '@/lib/diagnostics/sections';

/**
 * Diagnóstico global de la cabecera (solo desarrollo): entorno y Health ML. El layout solo lo
 * renderiza con diagnósticos habilitados, por lo que en producción no se consulta Health.
 */
export async function ServiceDiagnostics() {
  const health = await getMlHealth();
  const presentation = getPresentationConfig();
  const source = getDataSourceStatus();
  const sections = [
    diagnosticSection('Entorno', [
      ['Presentación (APP_ENV)', presentation.mode],
      ['Runtime de Next.js (NODE_ENV)', presentation.runtime],
      ['Origen de datos (FRONTEND_DATA_MODE)', source.mode],
      ['Problema de configuración', source.problem],
    ]),
    ...healthDiagnostics(health),
  ];
  return (
    <DevelopmentDiagnostics subject="Entorno y servicios" sections={sections} variant="button" />
  );
}
