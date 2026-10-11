/**
 * Presupuestos de espera por tipo de operación (ms). Superan los del backend
 * (ML: 5 s inferencia, 10 s explicación) para que el backend responda su propio 504.
 */
export const API_TIMEOUTS = {
  health: 5_000,
  read: 10_000,
  modelCatalog: 15_000,
  explanation: 25_000,
  prediction: 30_000,
} as const;
