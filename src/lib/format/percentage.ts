/**
 * Representación visual de estimaciones exploratorias. Solo se redondea la presentación
 * (máximo un decimal); el valor original del backend no se modifica.
 * No existen umbrales ni colores de riesgo: la política está pendiente de validación.
 */
const percentFormatter = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

/** `31 %` a partir de `percentageNoShow` (0–100). Un score real de 0 se muestra como `0 %`. */
export function formatPercentage(percentageNoShow: number): string {
  return `${percentFormatter.format(percentageNoShow)} %`;
}

/** Diferencia descriptiva entre modelos en puntos porcentuales. */
export function formatPercentagePoints(points: number): string {
  return `${percentFormatter.format(points)} p. p.`;
}

/** Tasa histórica 0–1 como porcentaje (no es una probabilidad predictiva). */
export function formatRate(rate: number): string {
  return formatPercentage(rate * 100);
}
