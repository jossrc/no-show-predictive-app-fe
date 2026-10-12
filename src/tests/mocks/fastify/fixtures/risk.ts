import {
  appointmentAt,
  mockExperimentalRisk,
  type MockReservation,
  type MockScore,
  RF,
  toReasons,
  XGB,
} from '@/tests/mocks/fastify/fixtures/reservations';

/** Fixtures SINTÉTICAS de HU-02 y HU-05 (solo pruebas). */

function modelResult(score: MockScore, now: Date) {
  const algorithm = score.model.key === RF.key ? 'random_forest' : 'xgboost';
  return {
    modelKey: score.model.key,
    algorithm,
    modelVersion: `${score.model.key}:${score.model.hash}`,
    modelHash: score.model.hash,
    modelHashSha256: score.experimentalLevel ? score.model.hash.padEnd(64, '0') : null,
    scoringApiVersion: score.experimentalLevel ? 'v2' : 'v1',
    probabilityNoShow: score.probability,
    percentageNoShow: score.probability * 100,
    target: 'NO_SHOW_CANDIDATE',
    validationStatus: 'EXPLORATORY_NOT_VALIDATED',
    calibrationStatus: 'not_operationally_validated',
    operationalUseAllowed: false,
    riskLevel: null,
    experimentalRisk: mockExperimentalRisk(score),
    experimentalRiskUnavailableReason: score.experimentalLevel
      ? null
      : 'SCORED_WITHOUT_RESEARCH_POLICY',
    predictionAt: new Date(now.getTime() - 20 * 86_400_000).toISOString(),
    scoredAt: new Date(now.getTime() - 86_400_000).toISOString(),
    predictionRunId: `run-${score.model.hash}`,
  };
}

function comparison(scores: MockScore[]) {
  const [first, second] = scores;
  if (!first || !second) return null;
  const difference = Math.abs(first.probability - second.probability);
  return {
    absoluteProbabilityDifference: difference,
    absolutePercentagePointDifference: difference * 100,
    interpretation: 'descriptive_only_not_model_confidence',
    ensembleProbability: null,
    selectedWinner: null,
  };
}

const STATUS_MESSAGES = {
  AVAILABLE_EXPLORATORY: 'Estimaciones exploratorias guardadas; no validadas para uso operativo.',
  NOT_SCORED: 'La reserva no tiene estimaciones guardadas.',
  NOT_SCORABLE: 'La reserva no es evaluable con evidencia temporal de su creación.',
} as const;

export function riskAssessment(reservation: MockReservation, scores: MockScore[], now: Date) {
  const status = scores.length > 0 ? 'AVAILABLE_EXPLORATORY' : reservation.availability;
  const scorable = status !== 'NOT_SCORABLE';
  const hasBands = scores.some((score) => score.experimentalLevel);
  return {
    reservationId: reservation.id,
    status,
    reasons: toReasons(reservation.reasons),
    sourceStatus: 'SYNTHETIC_DEMO_ONLY',
    sourceFreshness: reservation.stale ? 'STALE_CLASSIFICATION' : 'CURRENT',
    snapshot: scorable
      ? {
          snapshotType: 'booking_creation',
          predictionAt: new Date(now.getTime() - 20 * 86_400_000).toISOString(),
          appointmentAt: appointmentAt(reservation, now),
          featureVersion: 'BOOKING_BASELINE_V1',
          builderVersion: 'risk_features_builder_v1',
          evidenceSource: 'SYNTHETIC_DEMO_ONLY',
          snapshotHash: 'synthetic-snapshot-hash',
        }
      : null,
    models: scores.map((score) => modelResult(score, now)),
    comparison: comparison(scores),
    riskLevel: null,
    riskPolicyStatus: 'pending_validation',
    riskPolicyVersion: null,
    classificationUnavailable: !hasBands,
    operationalClassificationUnavailable: true,
    experimentalClassificationUnavailable: !hasBands,
    classificationBasis: hasBands ? 'RESEARCH_PROVISIONAL' : null,
    experimentalRiskNotice: hasBands
      ? 'Bandas relativas sintéticas, sin aprobación operativa.'
      : null,
    validationStatus: 'EXPLORATORY_NOT_VALIDATED',
    operationalUseAllowed: false,
    message: STATUS_MESSAGES[status],
  };
}

const RF_FACTORS = [
  {
    featureName: 'previous_no_show_rate',
    label: 'Tasa previa de inasistencia',
    contribution: 0.0612,
  },
  {
    featureName: 'booking_lead_days',
    label: 'Días de anticipación de la reserva',
    contribution: 0.0347,
  },
  {
    featureName: 'age_at_booking',
    label: 'Edad al reservar',
    contribution: -0.0218,
    sensitive: true,
  },
  { featureName: 'appointment_hour', label: 'Hora de la cita', contribution: -0.0105 },
  { featureName: 'is_fwa', label: 'Cita con bandera FWA', contribution: 0 },
];

const XGB_FACTORS = [
  { featureName: 'previous_no_show', label: 'Inasistencias previas', contribution: 0.4821 },
  {
    featureName: 'booking_lead_days',
    label: 'Días de anticipación de la reserva',
    contribution: 0.2133,
  },
  { featureName: 'client_sex', label: 'Sexo registrado', contribution: -0.1502, sensitive: true },
  {
    featureName: 'appointment_weekday',
    label: 'Día de la semana de la cita',
    contribution: -0.0911,
  },
];

function toFactor(factor: {
  featureName: string;
  label: string;
  contribution: number;
  sensitive?: boolean;
}) {
  const direction =
    factor.contribution > 0
      ? 'increases_model_output'
      : factor.contribution < 0
        ? 'decreases_model_output'
        : 'neutral';
  return {
    featureName: factor.featureName,
    label: factor.label,
    direction,
    contribution: factor.contribution,
    absoluteContribution: Math.abs(factor.contribution),
    sensitiveAttribute: factor.sensitive ?? false,
  };
}

const EXPLANATION_SPACES = {
  [RF.key]: {
    model: RF,
    algorithm: 'random_forest',
    probability: 0.31,
    outputSpace: 'probability',
    outputLink: 'identity',
    baseValue: 0.2251,
    output: 0.31,
    other: 0.0213,
    factors: RF_FACTORS,
    unitsNote: 'Contribuciones en escala de probabilidad.',
  },
  [XGB.key]: {
    model: XGB,
    algorithm: 'xgboost',
    probability: 0.274,
    outputSpace: 'log_odds',
    outputLink: 'sigmoid',
    baseValue: -1.3021,
    output: -0.9733,
    other: 0.1252,
    factors: XGB_FACTORS,
    unitsNote: 'Contribuciones en log-odds; no son puntos porcentuales.',
  },
} as const;

export function riskFactors(
  reservation: MockReservation,
  modelKey: string,
  topK: number,
  now: Date,
  options: { emptyFactors: boolean },
) {
  const space = modelKey === XGB.key ? EXPLANATION_SPACES[XGB.key] : EXPLANATION_SPACES[RF.key];
  const factors = options.emptyFactors ? [] : space.factors.slice(0, topK);
  return {
    reservationId: reservation.id,
    snapshot: {
      predictionAt: new Date(now.getTime() - 20 * 86_400_000).toISOString(),
      featureVersion: 'BOOKING_BASELINE_V1',
      builderVersion: 'risk_features_builder_v1',
      snapshotHash: 'synthetic-snapshot-hash',
    },
    model: {
      modelKey: space.model.key,
      algorithm: space.algorithm,
      modelVersion: `${space.model.key}:${space.model.hash}`,
      modelHash: space.model.hash,
      validationStatus: 'EXPLORATORY_NOT_VALIDATED',
      calibrationStatus: 'not_operationally_validated',
      operationalUseAllowed: false,
    },
    probabilityNoShow: space.probability,
    percentageNoShow: space.probability * 100,
    persistedScore: {
      available: true,
      sameModelIdentity: true,
      probabilityNoShow: space.probability,
      experimentalRisk: (() => {
        const score = reservation.scores.find((score) => score.model.key === modelKey);
        return score ? mockExperimentalRisk(score) : null;
      })(),
    },
    explanation: {
      method: 'tree_shap',
      outputSpace: space.outputSpace,
      outputLink: space.outputLink,
      units: space.outputSpace,
      baseValue: space.baseValue,
      modelOutputInExplanationSpace: space.output,
      reconstructedOutputInExplanationSpace: space.output,
      additivityError: 0,
      otherFeaturesContribution: space.other,
      topK,
      totalFeatureCount: 19,
      factors: factors.map(toFactor),
    },
    interpretation: {
      scope: 'local_association_not_causality',
      note: 'Asociación local con la salida del modelo; no implica causalidad.',
      unitsNote: space.unitsNote,
      sensitiveAttributesNote:
        'Los atributos sensibles se muestran por transparencia y no deben usarse para decisiones individuales.',
    },
    riskLevel: null,
    riskPolicyStatus: 'pending_validation',
  };
}
