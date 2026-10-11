import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/tests/setup/vitest.ts'],
    include: ['src/tests/{unit,components}/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/components/{layout,shared}/**/*.{ts,tsx}',
        'src/lib/dates/**/*.ts',
        'src/app/(workspace)/page.tsx',
      ],
      exclude: ['**/*.d.ts', 'src/components/ui/**'],
    },
  },
});
