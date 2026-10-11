import 'server-only';

import type { DataMode } from '@/lib/config/server';

export type Transport = (url: URL, init: RequestInit) => Promise<Response>;

/**
 * `live` usa `fetch` nativo. `mock` carga bajo demanda la infraestructura de prueba
 * (`src/tests/mocks/fastify`), que nunca se ejecuta en producción (ver `getServerConfig`).
 */
export async function resolveTransport(mode: DataMode): Promise<Transport> {
  if (mode === 'live') return (url, init) => fetch(url, init);
  const { mockFastifyTransport } = await import('@/tests/mocks/fastify/transport');
  return mockFastifyTransport;
}
