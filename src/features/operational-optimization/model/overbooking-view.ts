import type {
  OverbookingAuthorization,
  OverbookingCandidate,
  OverbookingState,
} from '@/features/operational-optimization/api/overbooking.contract';
import type { OverbookingSummary } from '@/features/operational-optimization/api/summary.contract';
import {
  MANAGEMENT_UNAVAILABLE_LABEL,
  OVERBOOKING_NOT_ENABLED_LABEL,
} from '@/features/operational-optimization/model/labels';
import { resolveModelIdentity } from '@/features/prediction-models/model/model-identity';
import { formatLimaDateTime } from '@/lib/dates/lima';
import { formatPercentage } from '@/lib/format/percentage';

/** Presentación de HU-06. La elegibilidad la decide el backend; aquí solo se interpreta. */

export type OverbookingMark = 'enabled' | 'not_enabled' | 'unavailable';

export function overbookingMark(summary: OverbookingSummary | null): {
  mark: OverbookingMark;
  label: string;
} {
  if (!summary) return { mark: 'unavailable', label: MANAGEMENT_UNAVAILABLE_LABEL };
  if (summary.enabled) return { mark: 'enabled', label: summary.statusLabel };
  return { mark: 'not_enabled', label: OVERBOOKING_NOT_ENABLED_LABEL };
}

export function eligibleCandidates(state: OverbookingState): OverbookingCandidate[] {
  return state.eligibility.candidates.filter((candidate) => candidate.eligible);
}

/** El botón solo existe si el backend dice `eligible=true` y ofrece un candidato elegible. */
export function canEnableOverbooking(state: OverbookingState): boolean {
  return !state.enabled && state.eligibility.eligible && eligibleCandidates(state).length > 0;
}

export function modelLabel(modelKey: string): string {
  return resolveModelIdentity(modelKey).label;
}

/** Motivos de no elegibilidad (mensajes del backend), por reserva y por modelo, sin duplicados. */
export function ineligibilityReasons(state: OverbookingState): string[] {
  const reservation = state.eligibility.reasons
    .filter((reason) => reason.code !== 'ALREADY_ENABLED')
    .map((reason) => reason.message);
  const perModel = state.eligibility.candidates.flatMap((candidate) =>
    candidate.reasons.map((reason) => `${modelLabel(candidate.modelKey)}: ${reason.message}`),
  );
  return [...new Set([...reservation, ...perModel])];
}

export function candidateLabel(candidate: OverbookingCandidate): string {
  return `${modelLabel(candidate.modelKey)} · ${formatPercentage(candidate.probabilityNoShow * 100)}`;
}

export function authorizationItems(authorization: OverbookingAuthorization) {
  return [
    { term: 'Habilitado el', value: formatLimaDateTime(authorization.enabledAt) },
    { term: 'Modelo usado', value: modelLabel(authorization.modelKey) },
    {
      term: 'Estimación al habilitar',
      value: formatPercentage(authorization.probabilityNoShowAtAuthorization * 100),
    },
    { term: 'Banda relativa al habilitar', value: 'Alto (exploratorio)' },
  ];
}
