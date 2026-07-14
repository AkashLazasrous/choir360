import { defineConfig } from 'vitest/config';

/**
 * Default unit-test run: src only. Firestore rules tests live under
 * tests/rules and require the emulator — see vitest.rules.config.ts.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
