import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Pure-function tests only — no DOM/canvas needed.
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
});
