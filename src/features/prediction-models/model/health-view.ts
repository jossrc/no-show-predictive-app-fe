import type { MlHealth } from '@/features/prediction-models/api/contract';
import type { ApiResult } from '@/lib/api/result';

export type HealthTone = 'available' | 'unavailable' | 'unknown';

export interface HealthView {
  tone: HealthTone;
  label: string;
  description: string;
}

const SCOPE_NOTE =
  'Indica solo la respuesta del chequeo de salud; no garantiza que cada predicción o explicación pueda generarse.';

/** Estado discreto del servicio ML. Nunca afirma que «todo está operativo». */
export function toHealthView(result: ApiResult<MlHealth>): HealthView {
  if (!result.ok) {
    return {
      tone: 'unknown',
      label: 'ML sin verificar',
      description: `No se pudo consultar la disponibilidad del servicio ML. ${SCOPE_NOTE}`,
    };
  }
  if (result.data.status === 'ok') {
    return {
      tone: 'available',
      label: 'ML disponible',
      description: `Servicio ML disponible para uso exploratorio (no validado). ${SCOPE_NOTE}`,
    };
  }
  if (result.data.status === 'disabled') {
    return {
      tone: 'unavailable',
      label: 'ML deshabilitado',
      description:
        'El backend no tiene habilitado el servicio ML. Las reservas siguen disponibles.',
    };
  }
  return {
    tone: 'unavailable',
    label: 'ML no disponible',
    description:
      'El servicio ML no responde. Las reservas y el historial siguen disponibles; las predicciones y explicaciones fallarán.',
  };
}
