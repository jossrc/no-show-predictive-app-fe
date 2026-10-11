import type {
  FactorDirection,
  OutputSpace,
  RiskFactor,
} from '@/features/reservation-risk/api/factors.contract';

/**
 * Presentación de contribuciones SHAP en la unidad informada por la API.
 * RF: espacio de probabilidad (enlace identidad). XGBoost: log-odds (enlace sigmoide).
 * Las contribuciones nunca se convierten a porcentaje ni se comparan entre modelos.
 */
export const OUTPUT_SPACE_UNITS: Readonly<Record<OutputSpace, string>> = {
  probability: 'probabilidad',
  log_odds: 'log-odds',
};

export const OUTPUT_SPACE_UNIT_HINTS: Readonly<Record<OutputSpace, string>> = {
  probability: 'Contribuciones en escala de probabilidad (de 0 a 1).',
  log_odds:
    'Contribuciones en log-odds, la escala interna de XGBoost; no equivalen a puntos porcentuales.',
};

/** Describe el efecto sobre el cálculo del modelo, no una causa de la inasistencia. */
export const DIRECTION_LABELS: Readonly<Record<FactorDirection, string>> = {
  increases_model_output: 'Eleva la estimación',
  decreases_model_output: 'Reduce la estimación',
  neutral: 'Sin efecto apreciable',
};

export const NON_CAUSAL_NOTE =
  'Estos factores ayudan a interpretar el cálculo, pero no indican necesariamente las causas de una inasistencia.';

const contributionFormatter = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 4,
  signDisplay: 'exceptZero',
});

/** Valor con signo en el espacio de salida, p. ej. `+0.0312`. Nunca incluye `%`. */
export function formatContribution(value: number): string {
  return contributionFormatter.format(value);
}

export interface FactorView {
  featureName: string;
  label: string;
  direction: FactorDirection;
  directionLabel: string;
  contribution: number;
  contributionText: string;
  sensitive: boolean;
}

export function toFactorViews(factors: RiskFactor[]): FactorView[] {
  return factors.map((factor) => ({
    featureName: factor.featureName,
    label: factor.label,
    direction: factor.direction,
    directionLabel: DIRECTION_LABELS[factor.direction],
    contribution: factor.contribution,
    contributionText: formatContribution(factor.contribution),
    sensitive: factor.sensitiveAttribute,
  }));
}
