import { defineConfig } from 'vitest/config';
import { electronPool } from 'vitest-electron-runner';
export default defineConfig({
  test: {
    name: 'split-renderer',
    include: ['tests/**/*.test.ts'],
    pool: electronPool({
      process: 'renderer',
      showWindow: process.env.ELECTRON_EXAMPLE_SHOW_WINDOW === '1',
    }),
    maxWorkers: 1,
    testTimeout: 10000,
  },
});
