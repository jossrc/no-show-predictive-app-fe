import 'server-only';

import { z } from 'zod';

const serverConfigSchema = z.object({
  dataMode: z.enum(['demo', 'live']).default('demo'),
  apiBaseUrl: z.url().default('http://127.0.0.1:3000'),
  internalApiKey: z.string().optional(),
});

// Read lazily: this foundation does not connect to Fastify or require an API key.
export function getServerConfig() {
  return serverConfigSchema.parse({
    dataMode: process.env.FRONTEND_DATA_MODE,
    apiBaseUrl: process.env.FASTIFY_API_BASE_URL,
    internalApiKey: process.env.FASTIFY_INTERNAL_API_KEY,
  });
}
