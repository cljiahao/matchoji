import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
  test: {
    globals: false,
    environment: 'node',
    passWithNoTests: true,
    // Component tests opt into jsdom per file with a `@vitest-environment jsdom` docblock.
    setupFiles: ['test/support/setup.ts'],
    include: ['test/**/*.{test,spec}.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    // Playwright owns e2e/; its spec files would crash under Vitest.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://supabase.test',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'cobertura'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.d.ts', '**/index.ts'],
    },
  },
});
