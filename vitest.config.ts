import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Mirror tsconfig's `@/*` → `src/*` so tests can import app modules.
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    // Pure-function tests only — no DOM/canvas needed.
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
});
