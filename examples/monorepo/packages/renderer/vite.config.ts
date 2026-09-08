import { defineConfig } from 'vite-plus';

export default defineConfig({
  base: './',
  build: { target: 'esnext' },
  test: {
    name: 'split-renderer',
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
