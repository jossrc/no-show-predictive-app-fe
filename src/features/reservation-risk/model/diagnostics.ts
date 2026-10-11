import type { ModelCatalog } from '@/features/prediction-models/api/contract';
import type { RiskFactors } from '@/features/reservation-risk/api/factors.contract';
import type { PredictionOutcome } from '@/features/reservation-risk/api/risk.actions';
import type { RiskAssessment } from '@/features/reservation-risk/api/risk.contract';
import type { ApiResult } from '@/lib/api/result';
import {
  type DiagnosticSection,
  diagnosticSection,
  reasonsSection,
  responseSections,
  screenContextSection,
} from '@/lib/diagnostics/sections';

/**
 * Diagnóstico de desarrollo de HU-02 (riesgo y solicitud explícita) y HU-05 (factores).
 * Solo campos presentes en las respuestas: no se calculan métricas nuevas.
 */
function snapshotSection(risk: RiskAssessment): DiagnosticSection {
  const { snapshot } = risk;
  if (!snapshot) return diagnosticSection('Snapshot', [['Disponible', false]]);
  return diagnosticSection('Snapshot', [
    ['Disponible', true],
    ['predictionAt (corte)', snapshot.predictionAt],
    ['featureVersion', snapshot.featureVersion],
    ['builderVersion', snapshot.builderVersion],
    ['evidenceSource', snapshot.evidenceSource],
    ['snapshotHash', snapshot.snapshotHash],
  ]);
}

function assessmentSections(risk: RiskAssessment | null): DiagnosticSection[] {
  if (!risk) return [];
  return [
    diagnosticSection('Estado predictivo', [
      ['Estado', risk.status],
      ['Validación', risk.validationStatus],
      ['Política de riesgo', risk.riskPolicyStatus],
      ['Versión de política', risk.riskPolicyVersion],
      ['classificationUnavailable', risk.classificationUnavailable],
      ['sourceStatus', risk.sourceStatus],
      ['sourceFreshness', risk.sourceFreshness],
      ['Mensaje del backend', risk.message],
    ]),
    reasonsSection('Motivos técnicos', risk.reasons),
    snapshotSection(risk),
    ...risk.models.map((model) =>
      diagnosticSection(`Modelo · ${model.modelKey}`, [
        ['Algoritmo', model.algorithm],
        ['Versión', model.modelVersion],
        ['Hash', model.modelHash],
        ['Validación', model.validationStatus],
        ['Calibración', model.calibrationStatus],
        ['Objetivo', model.target],
        ['probabilityNoShow', model.probabilityNoShow],
        ['scoredAt', model.scoredAt],
        ['predictionRunId', model.predictionRunId],
      ]),
    ),
  ];
}

function catalogSection(catalog: ApiResult<ModelCatalog>): DiagnosticSection {
  return diagnosticSection('Catálogo · GET /api/v1/ml/models', [
    ['Disponible', catalog.ok],
    ['Código de error', catalog.ok ? null : catalog.error.code],
    ['featureVersion', catalog.ok ? catalog.data.featureVersion : null],
    ['defaultModelKey', catalog.ok ? catalog.data.defaultModelKey : null],
    ['Modelos', catalog.ok ? catalog.data.models.map((model) => model.modelKey).join(', ') : null],
  ]);
}

export function riskDiagnostics(
  risk: ApiResult<RiskAssessment>,
  catalog: ApiResult<ModelCatalog>,
): DiagnosticSection[] {
  return [
    screenContextSection({
      screen: 'Detalle de reserva',
      feature: 'Consulta de riesgo',
      story: 'HU-02',
      endpoint: 'GET /api/v1/reservations/:reservationId/risk',
    }),
    ...responseSections(risk),
    ...assessmentSections(risk.ok ? risk.data : null),
    catalogSection(catalog),
  ];
}

export function predictionDiagnostics(outcome: ApiResult<PredictionOutcome>): DiagnosticSection[] {
  const data = outcome.ok ? outcome.data : null;
  return [
    screenContextSection({
      screen: 'Detalle de reserva',
      feature: 'Solicitud explícita de predicción',
      story: 'HU-02',
      endpoint: 'POST /api/v1/reservations/:reservationId/predictions',
    }),
    ...responseSections(outcome),
    diagnosticSection('Ejecución', [
      ['created', data?.created],
      ['run.replayed', data?.replayed],
      ['requestedModelKeys', data?.requestedModelKeys.join(', ')],
      ['featureWarnings', data ? data.featureWarnings.join(', ') || 'ninguno' : null],
    ]),
  ];
}

function explanationSections(data: RiskFactors | null): DiagnosticSection[] {
  if (!data) return [];
  const { explanation, model, snapshot } = data;
  return [
    diagnosticSection('Explicación', [
      ['method', explanation.method],
      ['outputSpace', explanation.outputSpace],
      ['outputLink', explanation.outputLink],
      ['units', explanation.units],
      ['baseValue', explanation.baseValue],
      ['modelOutputInExplanationSpace', explanation.modelOutputInExplanationSpace],
      ['otherFeaturesContribution', explanation.otherFeaturesContribution],
      ['additivityError', explanation.additivityError],
      ['totalFeatureCount', explanation.totalFeatureCount],
    ]),
    diagnosticSection('Modelo y snapshot', [
      ['modelVersion', model.modelVersion],
      ['modelHash', model.modelHash],
      ['validationStatus', model.validationStatus],
      ['calibrationStatus', model.calibrationStatus],
      ['predictionAt (corte)', snapshot.predictionAt],
      ['featureVersion', snapshot.featureVersion],
      ['persistedScore.sameModelIdentity', data.persistedScore.sameModelIdentity],
    ]),
  ];
}

export function factorsDiagnostics(
  request: { modelKey: string; topK: number } | null,
  result: ApiResult<RiskFactors> | undefined,
): DiagnosticSection[] {
  return [
    screenContextSection({
      screen: 'Detalle de reserva',
      feature: 'Factores asociados (SHAP)',
      story: 'HU-05',
      endpoint: 'GET /api/v1/reservations/:reservationId/risk/factors',
    }),
    diagnosticSection('Parámetros enviados', [
      ['modelKey', request?.modelKey],
      ['topK', request?.topK],
    ]),
    ...(result ? responseSections(result) : []),
    ...explanationSections(result?.ok ? result.data : null),
  ];
}
