import 'server-only';

/**
 * Configuración exclusiva de servidor para consumir Fastify.
 *
 * - `live`: datos reales. Solo se admite fuera de producción mientras no exista autenticación
 *   de usuarios (HU-21/HU-22); el servidor de desarrollo escucha únicamente en loopback.
 * - `mock`: respuestas deterministas de prueba (Playwright/Vitest). Nunca en producción.
 *
 * La credencial `FASTIFY_INTERNAL_API_KEY` solo se lee aquí; nunca se serializa al navegador.
 */
export type DataMode = 'live' | 'mock';

export type ConfigProblem =
  | 'INVALID_DATA_MODE'
  | 'MISSING_API_KEY'
  | 'INVALID_BASE_URL'
  | 'LIVE_DISABLED_IN_PRODUCTION'
  | 'MOCK_DISABLED_IN_PRODUCTION';

export type ServerConfig =
  | { ok: true; mode: 'live'; apiBaseUrl: string; internalApiKey: string }
  | { ok: true; mode: 'mock'; apiBaseUrl: string; internalApiKey: string }
  | { ok: false; problem: ConfigProblem };

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:3000';
const MOCK_INTERNAL_KEY = 'mock-mode-has-no-real-credential';

function readDataMode(): DataMode | null {
  const raw = (process.env.FRONTEND_DATA_MODE ?? 'live').trim();
  return raw === 'live' || raw === 'mock' ? raw : null;
}

function readBaseUrl(): string | null {
  const raw = (process.env.FASTIFY_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim();
  try {
    const url = new URL(raw);
    const validProtocol = url.protocol === 'http:' || url.protocol === 'https:';
    if (!validProtocol || url.username || url.password || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getServerConfig(): ServerConfig {
  const mode = readDataMode();
  if (!mode) return { ok: false, problem: 'INVALID_DATA_MODE' };

  const isProduction = process.env.NODE_ENV === 'production';
  if (mode === 'mock') {
    if (isProduction) return { ok: false, problem: 'MOCK_DISABLED_IN_PRODUCTION' };
    return { ok: true, mode, apiBaseUrl: 'http://fastify.mock', internalApiKey: MOCK_INTERNAL_KEY };
  }

  if (isProduction) return { ok: false, problem: 'LIVE_DISABLED_IN_PRODUCTION' };

  const apiBaseUrl = readBaseUrl();
  if (!apiBaseUrl) return { ok: false, problem: 'INVALID_BASE_URL' };

  const internalApiKey = process.env.FASTIFY_INTERNAL_API_KEY?.trim() ?? '';
  if (!internalApiKey) return { ok: false, problem: 'MISSING_API_KEY' };

  return { ok: true, mode, apiBaseUrl, internalApiKey };
}

/** Modo visible para la interfaz (sin secretos). */
export function getPublicDataMode(): DataMode | 'misconfigured' {
  const config = getServerConfig();
  return config.ok ? config.mode : 'misconfigured';
}

/** Estado del origen de datos para diagnósticos de desarrollo: nunca incluye URL ni credencial. */
export function getDataSourceStatus(): {
  mode: DataMode | 'misconfigured';
  problem: ConfigProblem | null;
} {
  const config = getServerConfig();
  return config.ok
    ? { mode: config.mode, problem: null }
    : { mode: 'misconfigured', problem: config.problem };
}
