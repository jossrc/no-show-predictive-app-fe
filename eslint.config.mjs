import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

const effectiveLines = { skipBlankLines: true, skipComments: true };

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
    '.husky/_/**',
  ]),
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/no-cycle': ['error', { ignoreExternal: true }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/components/ui/**'],
    rules: {
      'max-lines': ['error', { max: 300, ...effectiveLines }],
      'max-lines-per-function': ['error', { max: 70, ...effectiveLines }],
      complexity: ['error', 12],
      'max-depth': ['error', 3],
    },
  },
  {
    files: ['src/components/{layout,shared}/**/*.tsx', 'src/providers/**/*.tsx'],
    rules: { 'max-lines': ['error', { max: 200, ...effectiveLines }] },
  },
  {
    files: ['src/app/**/page.tsx'],
    rules: { 'max-lines': ['error', { max: 120, ...effectiveLines }] },
  },
  {
    // Los bloques describe() agrupan casos; cada archivo de prueba conserva max-lines y complejidad.
    files: ['src/tests/**/*.{test,spec}.{ts,tsx}'],
    rules: { 'max-lines-per-function': 'off' },
  },
  // Registry components keep upstream structure; all other checks still apply.
  prettier,
]);
