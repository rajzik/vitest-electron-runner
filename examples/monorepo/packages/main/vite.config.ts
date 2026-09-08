import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    name: 'split-main',
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
