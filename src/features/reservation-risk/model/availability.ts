import type { PredictionAvailability } from '@/features/reservation-risk/api/risk.contract';

export const AVAILABILITY_LABELS: Readonly<Record<PredictionAvailability, string>> = {
  AVAILABLE_EXPLORATORY: 'Exploratoria',
  NOT_SCORED: 'Sin predicción',
  NOT_SCORABLE: 'No evaluable',
};

export const AVAILABILITY_DESCRIPTIONS: Readonly<Record<PredictionAvailability, string>> = {
  AVAILABLE_EXPLORATORY: 'Estimación exploratoria registrada; no validada para uso operativo.',
  NOT_SCORED: 'Esta reserva todavía no tiene una predicción registrada.',
  NOT_SCORABLE: 'No es posible generar una predicción con la información disponible.',
};

export const RISK_POLICY_PENDING_TEXT = 'Clasificación de riesgo pendiente de validación.';

export const EXPLORATORY_STATUS_TEXT = 'Estimación exploratoria · no validada para uso operativo';

const SOURCE_STATUS_LABELS: Readonly<Record<string, string>> = {
  READ_ONLY_EXISTING_SCHEDULE: 'Agenda existente en solo lectura',
  SYNTHETIC_DEMO_ONLY: 'Datos sintéticos de demostración',
};

export function describeSourceStatus(sourceStatus: string): string {
  return SOURCE_STATUS_LABELS[sourceStatus] ?? sourceStatus;
}
