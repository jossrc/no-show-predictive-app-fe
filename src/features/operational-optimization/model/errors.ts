import type { ApiError } from '@/lib/api/result';

/**
 * Textos propios de la gestión operativa para códigos compartidos con Sprint 01, cuyo texto del
 * catálogo habla de «estimaciones». El resto se presenta con el catálogo general.
 */
const OPERATIONAL_TEXTS: Readonly<Record<string, { title: string; description: string }>> = {
  PERSISTENCE_UNAVAILABLE: {
    title: 'Gestión operativa no disponible por ahora',
    description: 'No podemos consultar ni registrar la gestión de esta cita. Intenta nuevamente.',
  },
};

export function operationalErrorText(error: ApiError): { title?: string; description?: string } {
  return OPERATIONAL_TEXTS[error.code] ?? {};
}
