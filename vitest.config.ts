import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    projects: [
      'examples/{react,solid,effect}/vitest.config.ts',
      'examples/monorepo/packages/*/vitest.config.ts',
    ],
    globalSetup: ['./examples/monorepo/testing/build.ts'],
  },
});
