import type { ReservationDetail, ReservationList } from '@/features/reservations/api/contract';
import type { ReservationListQuery } from '@/features/reservations/model/list-query';
import { toBackendParams } from '@/features/reservations/model/list-url';
import type { ApiResult } from '@/lib/api/result';
import {
  type DiagnosticSection,
  diagnosticSection,
  responseSections,
  screenContextSection,
} from '@/lib/diagnostics/sections';

function listStateSections(list: ReservationList | null): DiagnosticSection[] {
  if (!list) return [];
  const count = (predicate: (item: ReservationList['data'][number]) => boolean) =>
    list.data.filter(predicate).length;
  return [
    diagnosticSection('Estado de los datos', [
      ['sourceStatus', list.sourceStatus],
      ['predictiveStoreAvailable', list.predictiveStoreAvailable],
      ['riskPolicyStatus', list.riskPolicyStatus],
      ['classificationUnavailable', list.classificationUnavailable],
      ['operationalClassificationUnavailable', list.operationalClassificationUnavailable],
      ['experimentalClassificationUnavailable', list.experimentalClassificationUnavailable],
      ['experimentalRiskPolicy.policyVersion', list.experimentalRiskPolicy?.policyVersion],
      ['experimentalRiskPolicy.modelKey', list.experimentalRiskPolicy?.modelKey],
      ['sort.semantics', list.sort.semantics],
      ['Zona horaria', list.period.timeZone],
      ['Inicio (inclusive)', list.period.startInclusive],
      ['Fin (exclusivo)', list.period.endExclusive],
      ['nextCursor', list.pagination.nextCursor ?? 'null'],
    ]),
    diagnosticSection('Estado predictivo de la página', [
      ...(['AVAILABLE_EXPLORATORY', 'NOT_SCORED', 'NOT_SCORABLE'] as const).map(
        (status) => [status, count((item) => item.risk.predictionAvailability === status)] as const,
      ),
      ['STALE_CLASSIFICATION', count((item) => item.sourceFreshness === 'STALE_CLASSIFICATION')],
    ]),
  ];
}

/** Diagnóstico de desarrollo del listado (HU-01/HU-03). Solo usa campos de la respuesta. */
export function listDiagnostics(
  query: ReservationListQuery,
  result: ApiResult<ReservationList>,
): DiagnosticSection[] {
  return [
    screenContextSection({
      screen: 'Listado de reservas',
      feature: 'Consulta, filtros, orden y paginación',
      story: 'HU-01 · HU-03',
      endpoint: 'GET /api/v1/reservations',
    }),
    diagnosticSection('Parámetros enviados', Object.entries(toBackendParams(query))),
    ...responseSections(result),
    ...listStateSections(result.ok ? result.data : null),
  ];
}

/** Diagnóstico de desarrollo de los datos factuales de la reserva. */
export function detailDiagnostics(detail: ApiResult<ReservationDetail>): DiagnosticSection[] {
  const reservation = detail.ok ? detail.data : null;
  return [
    screenContextSection({
      screen: 'Detalle de reserva',
      feature: 'Información de la cita',
      story: 'HU-01 (detalle de soporte)',
      endpoint: 'GET /api/v1/reservations/:reservationId',
    }),
    ...responseSections(detail),
    diagnosticSection('Datos técnicos de la reserva', [
      ['sourceStatus', reservation?.sourceStatus],
      ['sourceFreshness', reservation?.sourceFreshness],
      ['sourceClassification', reservation?.sourceClassification],
      ['classificationCutoffAt', reservation?.classificationCutoffAt],
      ['hasUsableSnapshot', reservation?.hasUsableSnapshot],
      ['Scores persistidos', reservation?.scores.length],
    ]),
  ];
}
