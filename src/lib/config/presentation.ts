import 'server-only';

/**
 * Modo de presentación de la interfaz (`APP_ENV`). Controla únicamente qué se muestra:
 *
 * - `development`: interfaz de producto + acceso discreto a diagnósticos técnicos.
 * - `production`: solo información de negocio.
 *
 * No sustituye a `NODE_ENV` (runtime de Next.js) ni a `FRONTEND_DATA_MODE` (origen de datos) y no
 * relaja ningún control de seguridad. Ante un valor ausente o inválido, o si el runtime es de
 * producción, se aplica el comportamiento seguro: sin diagnósticos.
 */
export const PRESENTATION_MODES = ['development', 'production'] as const;
export type PresentationMode = (typeof PRESENTATION_MODES)[number];

export interface PresentationConfig {
  mode: PresentationMode;
  diagnosticsEnabled: boolean;
  /** Etiqueta visible del entorno; null cuando no corresponde mostrarla. */
  environmentLabel: string | null;
  /** `NODE_ENV` informado solo para el diagnóstico; no se modifica. */
  runtime: string;
}

function readRequestedMode(): PresentationMode | null {
  const raw = process.env.APP_ENV?.trim();
  return PRESENTATION_MODES.find((mode) => mode === raw) ?? null;
}

export function getPresentationConfig(): PresentationConfig {
  const runtime = process.env.NODE_ENV ?? 'unknown';
  const runtimeIsProduction = runtime === 'production';
  const mode: PresentationMode =
    readRequestedMode() === 'development' && !runtimeIsProduction ? 'development' : 'production';
  const diagnosticsEnabled = mode === 'development';
  return {
    mode,
    diagnosticsEnabled,
    environmentLabel: diagnosticsEnabled ? 'Desarrollo' : null,
    runtime,
  };
}

/** Atajo para componentes de servidor que solo necesitan saber si mostrar diagnósticos. */
export function diagnosticsEnabled(): boolean {
  return getPresentationConfig().diagnosticsEnabled;
}
