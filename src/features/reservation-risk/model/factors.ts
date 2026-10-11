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
export const OUTPUT_SPACE_LABELS: Readonly<Record<OutputSpace, string>> = {
  probability: 'Probabilidad (enlace identidad)',
  log_odds: 'Log-odds (enlace sigmoide)',
};

export const OUTPUT_SPACE_UNIT_HINTS: Readonly<Record<OutputSpace, string>> = {
  probability: 'Contribuciones en escala de probabilidad (0–1).',
  log_odds: 'Contribuciones en log-odds; no equivalen a puntos porcentuales.',
};

export const DIRECTION_LABELS: Readonly<Record<FactorDirection, string>> = {
  increases_model_output: 'Asociado a una salida mayor del modelo',
  decreases_model_output: 'Asociado a una salida menor del modelo',
  neutral: 'Sin asociación apreciable',
};

export const NON_CAUSAL_NOTE =
  'Los factores representan asociaciones locales con la salida del modelo, no causas demostradas de inasistencia.';

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
