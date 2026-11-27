import type {
  AttendanceComparison,
  AttendanceState,
} from '@/features/operational-optimization/api/attendance.contract';
import type { SpaceRecoveryState } from '@/features/operational-optimization/api/recovery.contract';
import { modelLabel } from '@/features/operational-optimization/model/overbooking-view';
import { compareModelKeys } from '@/features/prediction-models/model/model-identity';
import { formatPercentage } from '@/lib/format/percentage';

/** Presentación de HU-07 y HU-08. Lo que se puede registrar lo decide el backend. */

export type AttendanceMode = 'recorded' | 'form' | 'blocked';

export function attendanceMode(state: AttendanceState): AttendanceMode {
  if (state.recorded && state.outcome) return 'recorded';
  if (state.registration.registrable && state.registration.availablePredictionRunIds.length > 0) {
    return 'form';
  }
  return 'blocked';
}

export interface ComparisonView {
  modelKey: string;
  label: string;
  probabilityText: string;
  predictedText: string;
  observedText: string;
  matches: boolean;
  matchText: string;
  thresholdText: string;
}

/** Comparaciones GUARDADAS por el backend, una por modelo (RF y XGBoost por separado). */
export function toComparisonViews(comparisons: AttendanceComparison[]): ComparisonView[] {
  return [...comparisons]
    .sort((a, b) => compareModelKeys(a.modelKey, b.modelKey))
    .map((comparison) => ({
      modelKey: comparison.modelKey,
      label: modelLabel(comparison.modelKey),
      probabilityText: formatPercentage(comparison.probabilityNoShow * 100),
      predictedText: comparison.predictedNoShow ? 'Inasistencia' : 'Asistencia',
      observedText: comparison.observedNoShow ? 'Inasistencia' : 'Asistencia',
      matches: comparison.matchesPrediction,
      matchText: comparison.matchesPrediction ? 'Coincidió' : 'No coincidió',
      thresholdText: formatPercentage(comparison.threshold * 100),
    }));
}

export type RecoveryMode = 'recorded' | 'form' | 'requires_overbooking' | 'blocked';

/**
 * El formulario solo existe si `recorded=false && registrable=true && preventiveAction.enabled`.
 * Sin habilitación HU-06 se explica el motivo. Nunca se infiere de la asistencia (HU-07).
 */
export function recoveryMode(state: SpaceRecoveryState): RecoveryMode {
  if (state.recorded && state.spaceRecovered !== null) return 'recorded';
  if (!state.recorded && state.registrable && state.preventiveAction.enabled) return 'form';
  if (state.blocker === 'PREVENTIVE_ACTION_REQUIRED' || !state.preventiveAction.enabled) {
    return 'requires_overbooking';
  }
  return 'blocked';
}
