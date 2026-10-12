/**
 * Representación visual de estimaciones exploratorias. Solo se redondea la presentación
 * (dos decimales para los scores); el valor original del backend no se modifica.
 */
const percentFormatter = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const scoreFormatter = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Porcentaje de score sin calibrar (0–100), incluyendo scores reales de cero. */
export function formatPercentage(percentageNoShow: number): string {
  return `${scoreFormatter.format(percentageNoShow)} %`;
}

/** Diferencia descriptiva entre modelos en puntos porcentuales. */
export function formatPercentagePoints(points: number): string {
  return `${percentFormatter.format(points)} p. p.`;
}

/** Tasa histórica 0–1 como porcentaje (no es una probabilidad predictiva). */
export function formatRate(rate: number): string {
  return `${percentFormatter.format(rate * 100)} %`;
}
