// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getPresentationConfig } from '@/lib/config/presentation';
import { getDataSourceStatus, getServerConfig } from '@/lib/config/server';

const API_KEY = 'clave-interna-de-prueba-0123456789-abcdef';

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('FRONTEND_DATA_MODE', 'live');
  vi.stubEnv('FASTIFY_API_BASE_URL', 'http://127.0.0.1:3000');
  vi.stubEnv('FASTIFY_INTERNAL_API_KEY', API_KEY);
});

afterEach(() => vi.unstubAllEnvs());

describe('APP_ENV: modo de presentación', () => {
  it('development habilita el diagnóstico y una etiqueta de entorno', () => {
    vi.stubEnv('APP_ENV', 'development');
    expect(getPresentationConfig()).toMatchObject({
      mode: 'development',
      diagnosticsEnabled: true,
      environmentLabel: 'Desarrollo',
    });
  });

  it('production oculta el diagnóstico y la etiqueta', () => {
    vi.stubEnv('APP_ENV', 'production');
    expect(getPresentationConfig()).toMatchObject({
      mode: 'production',
      diagnosticsEnabled: false,
      environmentLabel: null,
    });
  });

  it.each([undefined, '', 'dev', 'DEVELOPMENT', 'staging'])(
    'un valor ausente o inválido (%s) aplica el comportamiento seguro',
    (value) => {
      vi.stubEnv('APP_ENV', value);
      expect(getPresentationConfig()).toMatchObject({
        mode: 'production',
        diagnosticsEnabled: false,
      });
    },
  );

  it('NODE_ENV=production nunca expone diagnósticos, aunque APP_ENV pida development', () => {
    vi.stubEnv('APP_ENV', 'development');
    vi.stubEnv('NODE_ENV', 'production');
    expect(getPresentationConfig()).toMatchObject({
      mode: 'production',
      diagnosticsEnabled: false,
    });
  });

  it('no sobrescribe NODE_ENV', () => {
    vi.stubEnv('APP_ENV', 'production');
    getPresentationConfig();
    expect(process.env.NODE_ENV).toBe('development');
  });
});

describe('APP_ENV no altera el origen de datos ni la seguridad', () => {
  it.each(['development', 'production'])('con APP_ENV=%s el modo de datos no cambia', (appEnv) => {
    vi.stubEnv('APP_ENV', appEnv);
    expect(getServerConfig()).toMatchObject({ ok: true, mode: 'live' });
    vi.stubEnv('FRONTEND_DATA_MODE', 'mock');
    expect(getServerConfig()).toMatchObject({ ok: true, mode: 'mock' });
  });

  it('permite previsualizar la interfaz de producción en desarrollo local con LIVE', () => {
    vi.stubEnv('APP_ENV', 'production');
    expect(getServerConfig()).toMatchObject({ ok: true, mode: 'live' });
  });

  it('APP_ENV=production no permite LIVE en un runtime de producción', () => {
    vi.stubEnv('APP_ENV', 'production');
    vi.stubEnv('NODE_ENV', 'production');
    expect(getServerConfig()).toEqual({ ok: false, problem: 'LIVE_DISABLED_IN_PRODUCTION' });
  });

  it('la configuración de presentación y el estado del origen no contienen credenciales', () => {
    vi.stubEnv('APP_ENV', 'development');
    const serialized = JSON.stringify([getPresentationConfig(), getDataSourceStatus()]);
    expect(serialized).not.toContain(API_KEY);
    expect(serialized).not.toContain('127.0.0.1');
  });
});
