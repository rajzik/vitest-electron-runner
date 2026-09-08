import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    projects: ['packages/main/vitest.config.ts', 'packages/renderer/vitest.config.ts'],
    globalSetup: ['./testing/build.ts'],
  },
});
