import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const src = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': src,
      // `server-only` lanza fuera de un bundle de servidor; en pruebas se sustituye por un módulo vacío.
      'server-only': fileURLToPath(new URL('./src/tests/support/server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/tests/setup/vitest.ts'],
    include: ['src/tests/{unit,components,integration}/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/components/{layout,shared}/**/*.{ts,tsx}',
        'src/features/**/*.{ts,tsx}',
        'src/lib/**/*.ts',
      ],
      exclude: ['**/*.d.ts', 'src/components/ui/**'],
    },
  },
});
