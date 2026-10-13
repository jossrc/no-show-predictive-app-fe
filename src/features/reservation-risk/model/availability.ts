import type { PredictionAvailability } from '@/features/reservation-risk/api/risk.contract';

/** Aclaración breve: una sola vez por pantalla, junto a las estimaciones. */
export const EXPERIMENTAL_NOTE =
  'Resultados orientativos. No utilizar para decisiones automáticas.';
export const EXPERIMENTAL_NOTE_PLURAL = EXPERIMENTAL_NOTE;

export const ESTIMATES_ABOUT_NOTES = [
  'Las bandas Alto, Medio y Bajo son relativas al resultado de cada modelo.',
  'No representan un nivel de riesgo operativo validado.',
] as const;

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
