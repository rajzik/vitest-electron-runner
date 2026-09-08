import { defineConfig } from 'vite-plus';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    projects: ['packages/main/vite.config.ts', 'packages/renderer/vite.config.ts'],
    globalSetup: ['./testing/build.ts'],
  },
});
