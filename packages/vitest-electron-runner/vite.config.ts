import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: ['src/index.ts'],
    format: ['esm'],
    platform: 'node',
    dts: true,
    sourcemap: true,
    clean: true,
  },
  test: {
    name: 'vitest-electron-runner',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
