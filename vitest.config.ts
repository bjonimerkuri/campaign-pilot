import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/handlers/**', 'src/lib/http.ts', 'src/lib/keys.ts', 'src/lib/schemas.ts'],
      reporter: ['text', 'lcov'],
      thresholds: { lines: 85, functions: 85, statements: 85, branches: 75 },
    },
  },
});
