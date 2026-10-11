import { defineConfig, devices } from '@playwright/test';

/**
 * E2E con el backend SIMULADO (`FRONTEND_DATA_MODE=mock`): respuestas deterministas, sin
 * PostgreSQL, sin Python y sin POST reales. Las variables de proceso tienen prioridad sobre
 * `.env.local`, por lo que nunca se usan datos reales en estas pruebas.
 */
export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:3001', colorScheme: 'light', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3001/reservations',
    reuseExistingServer: false,
    timeout: 180_000,
    env: { FRONTEND_DATA_MODE: 'mock', FASTIFY_INTERNAL_API_KEY: '' },
  },
});
