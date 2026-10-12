import type { PredictionAvailability } from '@/features/reservation-risk/api/risk.contract';

/** Advertencia científica breve: se muestra una sola vez, junto al resultado. */
export const EXPERIMENTAL_NOTE =
  'Estimación experimental no calibrada. No validada ni aprobada para decisiones operativas.';
export const EXPERIMENTAL_NOTE_PLURAL =
  'Estimaciones experimentales no calibradas. No validadas ni aprobadas para decisiones operativas.';

export const RISK_POLICY_PENDING_TEXT =
  'La clasificación por niveles de riesgo operativo todavía no está disponible.';

export const EXPERIMENTAL_BAND_NOTE =
  'Las bandas Bajo/Medio/Alto (exploratorio) son relativas al score de cada modelo; no representan riesgo absoluto validado ni autorizan acciones automáticas.';

/** Mensajes para el trabajador: estados funcionales esperados, no errores. */
export const AVAILABILITY_MESSAGES: Readonly<
  Record<Exclude<PredictionAvailability, 'AVAILABLE_EXPLORATORY'>, { title: string; text: string }>
> = {
  NOT_SCORED: {
    title: 'Aún no hay una estimación',
    text: 'Puedes calcularla ahora con los modelos disponibles.',
  },
  NOT_SCORABLE: {
    title: 'Estimación no disponible',
    text: 'No contamos con información suficiente para calcular una estimación para esta cita.',
  },
};
